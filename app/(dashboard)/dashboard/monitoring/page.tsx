"use client";

import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Clock,
  TrendingUp,
  Server,
  Thermometer,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatBytes, formatUptime } from "@/lib/utils";

interface Metrics {
  cpu: { usage: number; cores: number; model: string; temp?: number };
  memory: { total: number; used: number; free: number; percentage: number };
  disk: { total: number; used: number; free: number; percentage: number };
  network: { rxRate: string; txRate: string; rxTotal: string; txTotal: string };
  uptime: number;
  loadAvg: [number, number, number];
}

function ProgressBar({ value, color = "brand" }: { value: number; color?: string }) {
  const colorClass =
    value > 90 ? "bg-danger" :
    value > 70 ? "bg-warning" :
    `bg-${color}`;

  return (
    <div className="h-2 w-full rounded-full bg-[#222]">
      <div
        className={`h-full rounded-full ${colorClass} transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    cpu: { usage: 12.4, cores: 4, model: "Intel Xeon E5-2680 v4 @ 2.40GHz" },
    memory: { total: 4148166656, used: 1308622848, free: 2839543808, percentage: 31.5 },
    disk: { total: 53687091200, used: 6656409600, free: 47030681600, percentage: 12.4 },
    network: { rxRate: "2.4 MB/s", txRate: "1.1 MB/s", rxTotal: "124.5 GB", txTotal: "89.2 GB" },
    uptime: 3888000,
    loadAvg: [0.12, 0.08, 0.05],
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate live updates
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          usage: Math.max(2, Math.min(95, prev.cpu.usage + (Math.random() - 0.5) * 5)),
        },
        memory: {
          ...prev.memory,
          percentage: Math.max(20, Math.min(90, prev.memory.percentage + (Math.random() - 0.5) * 2)),
        },
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitoring</h2>
          <p className="text-sm text-[#555]">
            Uptime: {formatUptime(metrics.uptime)} · Load: {metrics.loadAvg.join(", ")}
          </p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors ${
            autoRefresh
              ? "border-success/30 bg-success/10 text-success"
              : "border-[#222] bg-[#141414] text-[#999] hover:text-white"
          }`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
          {autoRefresh ? "Live" : "Paused"}
        </button>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* CPU */}
        <div className="rounded-md border border-[#222] bg-[#141414] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <Cpu className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white">CPU</span>
            </div>
            <span className="text-2xl font-bold text-white">{metrics.cpu.usage.toFixed(1)}%</span>
          </div>
          <ProgressBar value={metrics.cpu.usage} />
          <div className="mt-3 space-y-1">
            <p className="text-[11px] text-[#555]">{metrics.cpu.cores} cores</p>
            <p className="text-[11px] text-[#555] truncate">{metrics.cpu.model}</p>
          </div>
        </div>

        {/* Memory */}
        <div className="rounded-md border border-[#222] bg-[#141414] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success">
                <MemoryStick className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white">Memory</span>
            </div>
            <span className="text-2xl font-bold text-white">{metrics.memory.percentage.toFixed(1)}%</span>
          </div>
          <ProgressBar value={metrics.memory.percentage} color="success" />
          <div className="mt-3 space-y-1">
            <p className="text-[11px] text-[#555]">
              {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
            </p>
            <p className="text-[11px] text-[#555]">
              {formatBytes(metrics.memory.free)} free
            </p>
          </div>
        </div>

        {/* Disk */}
        <div className="rounded-md border border-[#222] bg-[#141414] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <HardDrive className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white">Disk</span>
            </div>
            <span className="text-2xl font-bold text-white">{metrics.disk.percentage.toFixed(1)}%</span>
          </div>
          <ProgressBar value={metrics.disk.percentage} color="warning" />
          <div className="mt-3 space-y-1">
            <p className="text-[11px] text-[#555]">
              {formatBytes(metrics.disk.used)} / {formatBytes(metrics.disk.total)}
            </p>
            <p className="text-[11px] text-[#555]">
              {formatBytes(metrics.disk.free)} free
            </p>
          </div>
        </div>

        {/* Network */}
        <div className="rounded-md border border-[#222] bg-[#141414] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#A78BFA]">
                <Wifi className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white">Network</span>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#555]">RX Rate</span>
              <span className="font-medium text-success">{metrics.network.rxRate}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#555]">TX Rate</span>
              <span className="font-medium text-brand">{metrics.network.txRate}</span>
            </div>
            <div className="border-t border-[#222] pt-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#555]">Total RX</span>
                <span className="text-[#999]">{metrics.network.rxTotal}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[#555]">Total TX</span>
                <span className="text-[#999]">{metrics.network.txTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-[#222] bg-[#141414] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">System Info</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#555]">Hostname</span>
              <span className="font-medium text-[#999]">hostpanel-server</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#555]">OS</span>
              <span className="font-medium text-[#999]">Debian 12 (Bookworm)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#555]">Kernel</span>
              <span className="font-medium text-[#999]">6.1.0-18-amd64</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#555]">Uptime</span>
              <span className="font-medium text-[#999]">{formatUptime(metrics.uptime)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#555]">Load Average</span>
              <span className="font-medium text-[#999]">{metrics.loadAvg.join(", ")}</span>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[#222] bg-[#141414] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Services</h3>
          <div className="space-y-2.5">
            {[
              { name: "OpenLiteSpeed", version: "1.8.1", status: "running" },
              { name: "MariaDB", version: "11.3.2", status: "running" },
              { name: "PostgreSQL", version: "16.2", status: "running" },
              { name: "Redis", version: "7.2.4", status: "running" },
              { name: "Fail2ban", version: "1.0.2", status: "running" },
              { name: "PHP-FPM 8.3", version: "8.3.4", status: "running" },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="status-dot active" />
                  <span className="text-[#999]">{svc.name}</span>
                </span>
                <span className="text-[#555]">v{svc.version}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
