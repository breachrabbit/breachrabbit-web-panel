import { shellExec } from "@/lib/shell";
import prisma from "@/lib/prisma";

// ============================================================================
// Types
// ============================================================================

export interface CpuMetric {
  usage: number;   // 0-100%
  cores: number;
  load: [number, number, number]; // 1m, 5m, 15m
}

export interface MemoryMetric {
  used: number;    // GB
  total: number;   // GB
  percent: number; // 0-100%
}

export interface DiskMetric {
  used: number;    // GB
  total: number;   // GB
  percent: number; // 0-100%
}

export interface ServiceStatus {
  name: string;
  service: string;
  port: number;
  status: "running" | "stopped" | "unknown";
}

export interface SystemStats {
  cpu: CpuMetric;
  memory: MemoryMetric;
  disk: DiskMetric;
  uptime: number; // seconds
  services: ServiceStatus[];
}

export interface DashboardAlert {
  type: "error" | "warning" | "info" | "success";
  message: string;
  time: string;
}

export interface DashboardData {
  stats: SystemStats;
  sitesCount: number;
  alerts: DashboardAlert[];
  recentSites: RecentSite[];
}

export interface RecentSite {
  domain: string;
  type: string;
  status: string;
  sslExpiry: number | null; // days
  requests24h: number;
  avgResponseTime: number;
}

// ============================================================================
// Services list
// ============================================================================

const SERVICES: Omit<ServiceStatus, "status">[] = [
  { name: "OpenLiteSpeed", service: "lshttpd",      port: 8088 },
  { name: "Nginx",         service: "nginx",         port: 80   },
  { name: "MariaDB",       service: "mariadb",       port: 3306 },
  { name: "PostgreSQL",    service: "postgresql",    port: 5432 },
  { name: "Redis",         service: "redis-server",  port: 6379 },
  { name: "PHP-FPM 8.3",  service: "php8.3-fpm",   port: 9000 },
  { name: "PHP-FPM 8.4",  service: "php8.4-fpm",   port: 9001 },
];

// ============================================================================
// CPU — two /proc/stat reads with 300ms gap
// ============================================================================

async function getCpu(): Promise<CpuMetric> {
  try {
    const result = await shellExec(
      `awk 'NR==1{idle=$5+$6; total=0; for(i=2;i<=NF;i++) total+=$i; print idle, total}' /proc/stat; ` +
      `sleep 0.3; ` +
      `awk 'NR==1{idle=$5+$6; total=0; for(i=2;i<=NF;i++) total+=$i; print idle, total}' /proc/stat; ` +
      `cat /proc/loadavg; ` +
      `nproc`
    );

    const lines = result.stdout.trim().split("\n").filter(Boolean);

    let usage = 0;
    if (lines.length >= 2) {
      const [idle1, total1] = lines[0].split(" ").map(Number);
      const [idle2, total2] = lines[1].split(" ").map(Number);
      const idleDiff  = idle2  - idle1;
      const totalDiff = total2 - total1;
      if (totalDiff > 0) {
        usage = Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)));
      }
    }

    // load average — line like "0.52 0.48 0.43 1/234 5678"
    const loadLine = lines.find(l => /^\d+\.\d+\s+\d+\.\d+/.test(l));
    const load: [number, number, number] = [0, 0, 0];
    if (loadLine) {
      const parts = loadLine.split(" ");
      load[0] = parseFloat(parts[0]) || 0;
      load[1] = parseFloat(parts[1]) || 0;
      load[2] = parseFloat(parts[2]) || 0;
    }

    const coresLine = lines.find(l => /^\d+$/.test(l.trim()));
    const cores = coresLine ? parseInt(coresLine.trim()) : 1;

    return { usage, cores, load };
  } catch {
    return { usage: 0, cores: 1, load: [0, 0, 0] };
  }
}

// ============================================================================
// Memory — free -m
// ============================================================================

async function getMemory(): Promise<MemoryMetric> {
  try {
    const result = await shellExec(`free -m | awk 'NR==2{print $2, $3}'`);
    const parts = result.stdout.trim().split(" ").map(Number);
    const totalMB = parts[0] || 0;
    const usedMB  = parts[1] || 0;
    const total   = Math.round(totalMB / 1024 * 10) / 10;
    const used    = Math.round(usedMB  / 1024 * 10) / 10;
    const percent = totalMB > 0 ? Math.round((usedMB / totalMB) * 100) : 0;
    return { used, total, percent };
  } catch {
    return { used: 0, total: 0, percent: 0 };
  }
}

// ============================================================================
// Disk — df on /
// ============================================================================

async function getDisk(): Promise<DiskMetric> {
  try {
    const result = await shellExec(`df -BG / | awk 'NR==2{gsub(/G/,"",$2); gsub(/G/,"",$3); gsub(/%/,"",$5); print $2, $3, $5}'`);
    const parts = result.stdout.trim().split(" ").map(Number);
    return {
      total:   parts[0] || 0,
      used:    parts[1] || 0,
      percent: parts[2] || 0,
    };
  } catch {
    return { total: 0, used: 0, percent: 0 };
  }
}

// ============================================================================
// Uptime
// ============================================================================

async function getUptime(): Promise<number> {
  try {
    const result = await shellExec(`awk '{print int($1)}' /proc/uptime`);
    return parseInt(result.stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

// ============================================================================
// Service statuses — one batch systemctl call
// ============================================================================

async function getServices(): Promise<ServiceStatus[]> {
  try {
    const names = SERVICES.map(s => s.service).join(" ");
    const result = await shellExec(
      `for s in ${names}; do printf "%s:%s\n" "$s" "$(systemctl is-active "$s" 2>/dev/null || echo unknown)"; done`
    );

    const map: Record<string, string> = {};
    for (const line of result.stdout.split("\n").filter(Boolean)) {
      const idx = line.indexOf(":");
      if (idx > 0) map[line.slice(0, idx)] = line.slice(idx + 1).trim();
    }

    return SERVICES.map(svc => ({
      ...svc,
      status: map[svc.service] === "active"
        ? "running"
        : map[svc.service] === "inactive"
          ? "stopped"
          : "unknown",
    }));
  } catch {
    return SERVICES.map(svc => ({ ...svc, status: "unknown" as const }));
  }
}

// ============================================================================
// Full system stats — parallel
// ============================================================================

export async function getSystemStats(): Promise<SystemStats> {
  const [cpu, memory, disk, uptime, services] = await Promise.all([
    getCpu(),
    getMemory(),
    getDisk(),
    getUptime(),
    getServices(),
  ]);
  return { cpu, memory, disk, uptime, services };
}

// ============================================================================
// DB: sites count
// ============================================================================

export async function getSitesCount(): Promise<number> {
  try {
    return await prisma.site.count({ where: { status: "ACTIVE" } });
  } catch {
    return 0;
  }
}

// ============================================================================
// DB: recent sites for the table
// ============================================================================

export async function getRecentSites(): Promise<RecentSite[]> {
  try {
    const sites = await prisma.site.findMany({
      take: 5,
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        domain: true,
        type: true,
        status: true,
        sslExpiry: true,
        requests24h: true,
        avgResponseTime: true,
      },
    });

    const now = Date.now();
    return sites.map(s => ({
      domain:          s.domain,
      type:            formatSiteType(s.type),
      status:          s.status.toLowerCase(),
      sslExpiry:       s.sslExpiry
                         ? Math.ceil((s.sslExpiry.getTime() - now) / 86_400_000)
                         : null,
      requests24h:     s.requests24h ?? 0,
      avgResponseTime: Math.round(s.avgResponseTime ?? 0),
    }));
  } catch {
    return [];
  }
}

function formatSiteType(type: string): string {
  const map: Record<string, string> = {
    WORDPRESS:    "WordPress",
    STATIC:       "Static",
    PHP:          "PHP",
    NODEJS_PROXY: "Node.js",
    DOCKER_PROXY: "Docker",
    CUSTOM_PROXY: "Proxy",
  };
  return map[type] ?? type;
}

// ============================================================================
// DB: alerts — SSL expiring + notifications
// ============================================================================

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = [];
  const now = new Date();

  try {
    // SSL certs expiring within 30 days
    const soon = new Date(now.getTime() + 30 * 86_400_000);
    const certs = await prisma.sslCertificate.findMany({
      where: { expiresAt: { lte: soon }, status: { not: "expired" } },
      orderBy: { expiresAt: "asc" },
      take: 5,
    });

    for (const cert of certs) {
      const days = Math.ceil((cert.expiresAt.getTime() - now.getTime()) / 86_400_000);
      alerts.push({
        type:    days < 7 ? "error" : days < 14 ? "warning" : "info",
        message: `SSL for ${cert.domain} expires in ${days} day${days !== 1 ? "s" : ""}`,
        time:    cert.expiresAt.toISOString(),
      });
    }
  } catch { /* no certs table yet */ }

  try {
    // Unread notifications
    const notifs = await prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const n of notifs) {
      alerts.push({
        type:    (n.severity === "critical" || n.severity === "error") ? "error"
                 : n.severity === "warning" ? "warning"
                 : n.severity === "info" ? "info"
                 : "info",
        message: n.message,
        time:    n.createdAt.toISOString(),
      });
    }
  } catch { /* no notifications yet */ }

  return alerts.slice(0, 8);
}

// ============================================================================
// Full dashboard data — everything in parallel
// ============================================================================

export async function getDashboardData(): Promise<DashboardData> {
  const [stats, sitesCount, alerts, recentSites] = await Promise.all([
    getSystemStats(),
    getSitesCount(),
    getDashboardAlerts(),
    getRecentSites(),
  ]);
  return { stats, sitesCount, alerts, recentSites };
}
