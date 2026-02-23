"use client";

import {
  Cpu,
  HardDrive,
  Globe,
  Shield,
  ArrowUp,
  ArrowDown,
  Eye,
  Activity,
  Database,
  Clock,
  Plus,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

// Mock data — replace with real API calls
const metrics = {
  cpu: { value: 23, trend: -5, label: "CPU Usage" },
  ram: { value: 41, used: 3.2, total: 8, trend: 2, label: "Memory" },
  disk: { value: 42, used: 42, total: 100, trend: 1, label: "Disk Usage" },
  sites: { value: 3, trend: 0, label: "Active Sites" },
};

const services = [
  { name: "OpenLiteSpeed", status: "running", port: 8088 },
  { name: "Nginx", status: "running", port: 443 },
  { name: "MariaDB", status: "running", port: 3306 },
  { name: "PostgreSQL", status: "running", port: 5432 },
  { name: "Redis", status: "running", port: 6379 },
  { name: "PHP-FPM 8.3", status: "running", port: 9000 },
];

const sites = [
  { domain: "blog.example.com", type: "WordPress", status: "active", ssl: 45, php: "8.3", requests: 1234, bandwidth: "45.2 MB", response: "125ms" },
  { domain: "shop.example.com", type: "WordPress", status: "active", ssl: 12, php: "8.3", requests: 856, bandwidth: "23.1 MB", response: "89ms" },
  { domain: "api.example.com", type: "Node.js", status: "active", ssl: 89, php: null, requests: 5420, bandwidth: "12.8 MB", response: "45ms" },
];

const alerts = [
  { type: "warning", message: "SSL for shop.example.com expires in 12 days", time: "2h ago" },
  { type: "info", message: "Backup completed successfully", time: "6h ago" },
  { type: "success", message: "System updated to latest version", time: "1d ago" },
];

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  subtitle,
  trend,
  color,
  progress,
}: {
  icon: any;
  label: string;
  value: string | number;
  suffix?: string;
  subtitle?: string;
  trend?: number;
  color: string;
  progress?: number;
}) {
  return (
    <div className="rounded-md border border-[#222] bg-[#141414] p-5 animate-in">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && trend !== 0 && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              trend > 0 ? "text-danger" : "text-success"
            }`}
          >
            {trend > 0 ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <h4 className="text-2xl font-bold text-white">
          {value}
          {suffix && (
            <span className="text-sm font-normal text-[#555] ml-1">
              {suffix}
            </span>
          )}
        </h4>
        <span className="text-sm text-[#555]">{label}</span>
      </div>
      {progress !== undefined && (
        <div className="mt-3 progress-bar">
          <div
            className={`fill ${
              progress > 80
                ? "bg-danger"
                : progress > 60
                ? "bg-warning"
                : "bg-brand"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {subtitle && (
        <p className="mt-2 text-xs text-[#555]">{subtitle}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-[#555]">
            Server overview and quick management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-md border border-[#222] bg-[#141414] px-4 py-2 text-sm text-[#999] hover:text-white hover:border-brand/50 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <Link
            href="/dashboard/sites"
            className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brandlight transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Site
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Cpu}
          label="CPU Usage"
          value={metrics.cpu.value}
          suffix="%"
          trend={metrics.cpu.trend}
          color="bg-brand/20 text-brand"
          progress={metrics.cpu.value}
        />
        <MetricCard
          icon={Activity}
          label="Memory"
          value={`${metrics.ram.used}`}
          suffix={`/ ${metrics.ram.total} GB`}
          trend={metrics.ram.trend}
          color="bg-success/20 text-success"
          progress={metrics.ram.value}
        />
        <MetricCard
          icon={HardDrive}
          label="Disk Space"
          value={`${metrics.disk.used}`}
          suffix={`/ ${metrics.disk.total} GB`}
          trend={metrics.disk.trend}
          color="bg-warning/20 text-warning"
          progress={metrics.disk.value}
        />
        <MetricCard
          icon={Globe}
          label="Active Sites"
          value={metrics.sites.value}
          subtitle="All sites running normally"
          trend={0}
          color="bg-[#8B5CF6]/20 text-[#8B5CF6]"
        />
      </div>

      {/* Services status bar */}
      <div className="rounded-md border border-[#222] bg-[#141414] p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Services</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="flex items-center gap-2.5 rounded-md border border-[#222] bg-[#111] px-3 py-2.5"
            >
              <span
                className={`status-dot ${
                  svc.status === "running" ? "active" : "error"
                }`}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-[#999] truncate">
                  {svc.name}
                </span>
                <span className="text-[10px] text-[#555]">
                  :{svc.port}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Sites table */}
        <div className="xl:col-span-2 rounded-md border border-[#222] bg-[#141414]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
            <h3 className="text-base font-semibold text-white">Sites</h3>
            <Link
              href="/dashboard/sites"
              className="text-xs text-brand hover:text-brandlight transition-colors"
            >
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
                  <th className="text-right">Requests/24h</th>
                  <th className="text-right">Response</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.domain}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className={`status-dot ${site.status === "active" ? "active" : "stopped"}`} />
                        <span className="text-sm font-medium text-white">
                          {site.domain}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          site.type === "WordPress"
                            ? "bg-[#21759b]/20 text-[#4BA3D0]"
                            : "bg-success/20 text-success"
                        }`}
                      >
                        {site.type}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          site.ssl < 14
                            ? "text-warning"
                            : site.ssl < 30
                            ? "text-[#999]"
                            : "text-success"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {site.ssl}d
                      </span>
                    </td>
                    <td className="text-right text-sm text-[#999]">
                      {site.requests.toLocaleString()}
                    </td>
                    <td className="text-right text-sm text-[#999]">
                      {site.response}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                          title="Visit"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                          title="Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts & Activity */}
        <div className="rounded-md border border-[#222] bg-[#141414]">
          <div className="px-5 py-4 border-b border-[#222]">
            <h3 className="text-base font-semibold text-white">
              Alerts & Activity
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {alert.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  ) : alert.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Activity className="h-4 w-4 text-brand" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#999] leading-snug">
                    {alert.message}
                  </p>
                  <p className="text-[11px] text-[#555] mt-0.5">
                    {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="border-t border-[#222] px-5 py-4">
            <h4 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "New Site", icon: Globe, href: "/dashboard/sites" },
                { label: "New DB", icon: Database, href: "/dashboard/databases" },
                { label: "Backup", icon: HardDrive, href: "/dashboard/backups" },
                { label: "Logs", icon: Clock, href: "/dashboard/logs" },
              ].map((action) => (
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
