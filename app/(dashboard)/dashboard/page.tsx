"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server,
  Globe,
  Database,
  HardDrive,
  Cpu,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Zap,
  Lock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { formatBytes, formatUptime } from "@/lib/utils";
import Link from "next/link";

// TODO: Replace with real API calls to /api/monitoring/server and OLS API
const serverStats = {
  cpu: { usage: 23, cores: 4 },
  memory: { used: 6.2 * 1024 ** 3, total: 16 * 1024 ** 3 },
  disk: { used: 85 * 1024 ** 3, total: 250 * 1024 ** 3 },
  uptime: 432000,
  ols: { version: "1.8.1", status: "running", connections: 142 },
  nginx: { status: "running" },
};

const sites = [
  { domain: "blog.example.com", type: "WordPress", status: "active", sslDays: 45, requests: 1234, response: 125 },
  { domain: "shop.example.com", type: "WordPress", status: "active", sslDays: 12, requests: 856, response: 98 },
  { domain: "api.example.com", type: "Docker Proxy", status: "active", sslDays: 89, requests: 342, response: 45 },
];

const recentActivity = [
  { action: "SSL Renewed", target: "blog.example.com", time: "2h ago", type: "success" },
  { action: "Backup Created", target: "shop.example.com", time: "5h ago", type: "info" },
  { action: "Login Attempt Blocked", target: "192.168.1.100", time: "8h ago", type: "warning" },
  { action: "Site Deployed", target: "api.example.com", time: "1d ago", type: "info" },
];

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
  trend,
  color = "blue",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  progress?: number;
  trend?: { value: string; up: boolean };
  color?: "blue" | "emerald" | "amber" | "violet";
}) {
  const colorMap = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", ring: "ring-blue-500/20", bar: "bg-blue-500", glow: "glow-blue" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/20", bar: "bg-emerald-500", glow: "glow-emerald" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", ring: "ring-amber-500/20", bar: "bg-amber-500", glow: "glow-amber" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-500", ring: "ring-violet-500/20", bar: "bg-violet-500", glow: "glow-blue" },
  };
  const c = colorMap[color];

  return (
    <div className={`metric-card ${c.glow}`}>
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{subtitle}</p>
              {trend && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${trend.up ? "text-emerald-500" : "text-red-500"}`}>
                  {trend.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {trend.value}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
      </div>
      {progress !== undefined && (
        <div className="relative z-10 mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full ${c.bar} transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const cpuPercent = serverStats.cpu.usage;
  const memPercent = (serverStats.memory.used / serverStats.memory.total) * 100;
  const diskPercent = (serverStats.disk.used / serverStats.disk.total) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Server overview and quick actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2" asChild>
            <Link href="/dashboard/sites">
              <Plus className="h-3.5 w-3.5" />
              New Site
            </Link>
          </Button>
        </div>
      </div>

      {/* Service Status Bar */}
      <div className="flex items-center gap-3 rounded-xl border bg-card/50 p-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10">
          <div className="status-dot active" />
          <span className="text-xs font-semibold text-emerald-400">OLS {serverStats.ols.version}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10">
          <div className="status-dot active" />
          <span className="text-xs font-semibold text-emerald-400">Nginx</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10">
          <div className="status-dot active" />
          <span className="text-xs font-semibold text-emerald-400">MariaDB</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10">
          <div className="status-dot active" />
          <span className="text-xs font-semibold text-emerald-400">Redis</span>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          Uptime: <span className="font-medium text-foreground">{formatUptime(serverStats.uptime)}</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
        <MetricCard
          title="CPU Usage"
          value={`${cpuPercent}%`}
          subtitle={`${serverStats.cpu.cores} cores`}
          icon={Cpu}
          progress={cpuPercent}
          trend={{ value: "2.1%", up: false }}
          color="blue"
        />
        <MetricCard
          title="Memory"
          value={formatBytes(serverStats.memory.used)}
          subtitle={`of ${formatBytes(serverStats.memory.total)}`}
          icon={Activity}
          progress={memPercent}
          color="violet"
        />
        <MetricCard
          title="Disk Space"
          value={formatBytes(serverStats.disk.used)}
          subtitle={`of ${formatBytes(serverStats.disk.total)}`}
          icon={HardDrive}
          progress={diskPercent}
          trend={{ value: "1.2 GB/day", up: true }}
          color={diskPercent > 80 ? "amber" : "emerald"}
        />
        <MetricCard
          title="Active Sites"
          value={`${sites.length}`}
          subtitle={`${serverStats.ols.connections} active connections`}
          icon={Globe}
          color="emerald"
        />
      </div>

      {/* Sites + Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sites */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Sites</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/dashboard/sites">View all →</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {sites.map((site) => (
              <div
                key={site.domain}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-background/30 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`status-dot ${site.status}`} />
                  <div>
                    <p className="text-sm font-semibold">{site.domain}</p>
                    <p className="text-xs text-muted-foreground">{site.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Requests/24h</p>
                    <p className="text-sm font-medium">{site.requests.toLocaleString()}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Response</p>
                    <p className="text-sm font-medium">{site.response}ms</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={`text-sm font-semibold ${
                          site.sslDays < 14
                            ? "text-red-500"
                            : site.sslDays < 30
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {site.sslDays}d
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      item.type === "success"
                        ? "bg-emerald-500"
                        : item.type === "warning"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.target}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Deploy WordPress", icon: Globe, href: "/dashboard/sites", color: "text-blue-500" },
          { label: "Create Database", icon: Database, href: "/dashboard/databases", color: "text-violet-500" },
          { label: "Issue SSL", icon: Lock, href: "/dashboard/ssl", color: "text-emerald-500" },
          { label: "Security Scan", icon: Shield, href: "/dashboard/firewall", color: "text-amber-500" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 p-4 hover:bg-accent/50 hover:border-border transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <span className="text-sm font-medium group-hover:text-foreground transition-colors">
              {action.label}
            </span>
            <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  );
}
