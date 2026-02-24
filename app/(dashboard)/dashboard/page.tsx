"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Cpu, HardDrive, Globe, Shield, ArrowUp, ArrowDown, Eye,
  Activity, Database, Clock, Plus, ExternalLink, RefreshCw,
  AlertTriangle, CheckCircle2, Server, Loader2,
} from "lucide-react";
import Link from "next/link";
import type { DashboardData } from "@/lib/services/monitor-service";

// ============================================================================
// Helpers
// ============================================================================

function formatUptime(seconds: number): string {
  if (!seconds) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ============================================================================
// MetricCard
// ============================================================================

function MetricCard({
  icon: Icon, label, value, suffix, subtitle, color, progress, loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix?: string;
  subtitle?: string;
  color: string;
  progress?: number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-md border border-[#222] bg-[#141414] p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {progress !== undefined && !loading && (
          <span className={`text-xs font-medium ${
            progress > 80 ? "text-danger" : progress > 60 ? "text-warning" : "text-success"
          }`}>
            {progress}%
          </span>
        )}
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-[#222]" />
        ) : (
          <h4 className="text-2xl font-bold text-white">
            {value}
            {suffix && <span className="text-sm font-normal text-[#555] ml-1">{suffix}</span>}
          </h4>
        )}
        <span className="text-sm text-[#555]">{label}</span>
      </div>
      {progress !== undefined && !loading && (
        <div className="mt-3 progress-bar">
          <div
            className={`fill ${progress > 80 ? "bg-danger" : progress > 60 ? "bg-warning" : "bg-brand"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {loading && progress !== undefined && (
        <div className="mt-3 h-1.5 w-full animate-pulse rounded-full bg-[#222]" />
      )}
      {subtitle && !loading && <p className="mt-2 text-xs text-[#555]">{subtitle}</p>}
    </div>
  );
}

// ============================================================================
// Skeleton row
// ============================================================================

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i}><div className="h-4 animate-pulse rounded bg-[#222] my-1" /></td>
      ))}
    </tr>
  );
}

// ============================================================================
// Main page
// ============================================================================

export default function DashboardPage() {
  const [data, setData]               = useState<DashboardData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const fetchStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DashboardData = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const stats    = data?.stats;
  const services = stats?.services ?? [];

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-[#555]">
            {lastUpdated
              ? `Updated ${timeAgo(lastUpdated.toISOString())} · uptime ${formatUptime(stats?.uptime ?? 0)}`
              : "Loading server stats…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-md border border-[#222] bg-[#141414] px-4 py-2 text-sm text-[#999] hover:text-white hover:border-brand/50 transition-colors disabled:opacity-50"
          >
            {refreshing
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
          <Link
            href="/dashboard/sites"
            className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brandlight transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New Site
          </Link>
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Could not load server stats: {error}
        </div>
      )}

      {/* ── Metric cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Cpu}
          label="CPU Usage"
          value={stats ? stats.cpu.usage : "—"}
          suffix="%"
          subtitle={stats ? `${stats.cpu.cores} cores · load ${stats.cpu.load[0].toFixed(2)}` : undefined}
          color="bg-brand/20 text-brand"
          progress={stats?.cpu.usage}
          loading={loading}
        />
        <MetricCard
          icon={Activity}
          label="Memory"
          value={stats ? stats.memory.used : "—"}
          suffix={stats ? `/ ${stats.memory.total} GB` : undefined}
          color="bg-success/20 text-success"
          progress={stats?.memory.percent}
          loading={loading}
        />
        <MetricCard
          icon={HardDrive}
          label="Disk Space"
          value={stats ? stats.disk.used : "—"}
          suffix={stats ? `/ ${stats.disk.total} GB` : undefined}
          color="bg-warning/20 text-warning"
          progress={stats?.disk.percent}
          loading={loading}
        />
        <MetricCard
          icon={Globe}
          label="Active Sites"
          value={data ? data.sitesCount : "—"}
          subtitle={data?.sitesCount === 0 ? "No sites yet" : "All sites running"}
          color="bg-[#8B5CF6]/20 text-[#8B5CF6]"
          loading={loading}
        />
      </div>

      {/* ── Services ───────────────────────────────────────────────────── */}
      <div className="rounded-md border border-[#222] bg-[#141414] p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Services</h3>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-[#111] border border-[#222]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {services.map(svc => (
              <div
                key={svc.name}
                className="flex items-center gap-2.5 rounded-md border border-[#222] bg-[#111] px-3 py-2.5"
              >
                <span className={`status-dot ${
                  svc.status === "running" ? "active"  :
                  svc.status === "stopped" ? "error"   : "warning"
                }`} />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[#999] truncate">{svc.name}</span>
                  <span className="text-[10px] text-[#555]">:{svc.port}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sites table + Alerts ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Sites table */}
        <div className="xl:col-span-2 rounded-md border border-[#222] bg-[#141414]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
            <h3 className="text-base font-semibold text-white">Sites</h3>
            <Link href="/dashboard/sites" className="text-xs text-brand hover:text-brandlight transition-colors">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Domain</th>
                  <th className="text-left">Type</th>
                  <th className="text-center">SSL</th>
                  <th className="text-right">Req/24h</th>
                  <th className="text-right">Response</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                ) : !data?.recentSites.length ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-[#555]">
                      <Server className="mx-auto h-8 w-8 mb-2 opacity-30" />
                      No sites yet.{" "}
                      <Link href="/dashboard/sites" className="text-brand hover:underline">
                        Create your first site →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  data.recentSites.map(site => (
                    <tr key={site.domain}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className={`status-dot ${site.status === "active" ? "active" : "stopped"}`} />
                          <span className="text-sm font-medium text-white">{site.domain}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          site.type === "WordPress"
                            ? "bg-[#21759b]/20 text-[#4BA3D0]"
                            : "bg-success/20 text-success"
                        }`}>
                          {site.type}
                        </span>
                      </td>
                      <td className="text-center">
                        {site.sslExpiry !== null ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            site.sslExpiry < 7  ? "text-danger"  :
                            site.sslExpiry < 14 ? "text-warning" :
                            site.sslExpiry < 30 ? "text-[#999]"  : "text-success"
                          }`}>
                            <Shield className="h-3 w-3" />
                            {site.sslExpiry}d
                          </span>
                        ) : (
                          <span className="text-xs text-[#555]">—</span>
                        )}
                      </td>
                      <td className="text-right text-sm text-[#999]">
                        {site.requests24h.toLocaleString()}
                      </td>
                      <td className="text-right text-sm text-[#999]">
                        {site.avgResponseTime > 0 ? `${site.avgResponseTime}ms` : "—"}
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <a
                            href={`https://${site.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                            title="Visit"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <Link
                            href="/dashboard/sites"
                            className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                            title="Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts + Quick Actions */}
        <div className="rounded-md border border-[#222] bg-[#141414]">
          <div className="px-5 py-4 border-b border-[#222]">
            <h3 className="text-base font-semibold text-white">Alerts & Activity</h3>
          </div>
          <div className="p-5 space-y-4 min-h-[120px]">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-[#222] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 animate-pulse rounded bg-[#222]" />
                    <div className="h-2 w-16 animate-pulse rounded bg-[#222]" />
                  </div>
                </div>
              ))
            ) : !data?.alerts.length ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-success/50 mb-2" />
                <p className="text-sm text-[#555]">All good, no alerts</p>
              </div>
            ) : (
              data.alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {alert.type === "error"   && <AlertTriangle className="h-4 w-4 text-danger"  />}
                    {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-warning" />}
                    {alert.type === "success" && <CheckCircle2  className="h-4 w-4 text-success" />}
                    {alert.type === "info"    && <Activity      className="h-4 w-4 text-brand"   />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[#999] leading-snug">{alert.message}</p>
                    <p className="text-[11px] text-[#555] mt-0.5">{timeAgo(alert.time)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[#222] px-5 py-4">
            <h4 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "New Site", icon: Globe,     href: "/dashboard/sites"     },
                { label: "New DB",   icon: Database,  href: "/dashboard/databases" },
                { label: "Backup",   icon: HardDrive, href: "/dashboard/backups"   },
                { label: "Logs",     icon: Clock,     href: "/dashboard/logs"      },
              ].map(action => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-2 rounded-md border border-[#222] px-3 py-2.5 text-xs font-medium text-[#999] hover:text-white hover:border-brand/30 hover:bg-[#111] transition-colors"
                >
                  <action.icon className="h-3.5 w-3.5 text-brand" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
