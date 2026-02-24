"use client";

import {
  HardDrive,
  Plus,
  RefreshCw,
  Download,
  Trash2,
  Clock,
  Database,
  Globe,
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  Cloud,
  Server,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import { formatBytes } from "@/lib/utils";

interface BackupEntry {
  id: string;
  type: "full" | "files" | "database";
  site?: string;
  database?: string;
  size: number;
  status: "completed" | "running" | "failed";
  createdAt: string;
  storage: "local" | "s3" | "sftp";
}

const mockBackups: BackupEntry[] = [
  { id: "1", type: "full", site: "blog.example.com", size: 524288000, status: "completed", createdAt: "2026-02-24 02:00", storage: "local" },
  { id: "2", type: "full", site: "shop.example.com", size: 1288490188, status: "completed", createdAt: "2026-02-24 02:15", storage: "local" },
  { id: "3", type: "database", database: "panel_db", size: 13004390, status: "completed", createdAt: "2026-02-24 02:30", storage: "local" },
  { id: "4", type: "full", site: "api.example.com", size: 104857600, status: "running", createdAt: "2026-02-24 14:00", storage: "s3" },
  { id: "5", type: "database", database: "analytics", size: 0, status: "failed", createdAt: "2026-02-23 02:30", storage: "local" },
  { id: "6", type: "full", site: "blog.example.com", size: 520093696, status: "completed", createdAt: "2026-02-23 02:00", storage: "s3" },
];

const typeIcons = {
  full: Globe,
  files: FolderOpen,
  database: Database,
};

const statusConfig = {
  completed: { icon: CheckCircle, color: "text-success", bg: "bg-success/15", label: "Completed" },
  running: { icon: Loader2, color: "text-brand", bg: "bg-brand/15", label: "Running" },
  failed: { icon: XCircle, color: "text-danger", bg: "bg-danger/15", label: "Failed" },
};

const storageIcons = {
  local: Server,
  s3: Cloud,
  sftp: HardDrive,
};

export default function BackupsPage() {
  const [backups] = useState(mockBackups);
  const [showCreate, setShowCreate] = useState(false);

  const totalSize = backups
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.size, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Backups</h2>
          <p className="text-sm text-[#555]">
            {backups.length} backups · {formatBytes(totalSize)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-md border border-[#222] bg-[#141414] px-4 py-2.5 text-sm text-[#999] hover:text-white transition-colors">
            <Settings className="h-3.5 w-3.5" />
            Schedules
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brandlight transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Backup
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-md border border-[#222] bg-[#141414] p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{backups.length}</p>
            <p className="text-xs text-[#555]">Total Backups</p>
          </div>
        </div>
        <div className="rounded-md border border-[#222] bg-[#141414] p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">
              {backups.filter((b) => b.status === "completed").length}
            </p>
            <p className="text-xs text-[#555]">Completed</p>
          </div>
        </div>
        <div className="rounded-md border border-[#222] bg-[#141414] p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning/15 text-warning">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{formatBytes(totalSize)}</p>
            <p className="text-xs text-[#555]">Storage Used</p>
          </div>
        </div>
        <div className="rounded-md border border-[#222] bg-[#141414] p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/15 text-danger">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">
              {backups.filter((b) => b.status === "failed").length}
            </p>
            <p className="text-xs text-[#555]">Failed</p>
          </div>
        </div>
      </div>

      {/* Backup list */}
      <div className="rounded-md border border-[#222] bg-[#141414] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Backup</th>
                <th className="text-left">Type</th>
                <th className="text-center">Status</th>
                <th className="text-right">Size</th>
                <th className="text-left">Storage</th>
                <th className="text-left">Created</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => {
                const TypeIcon = typeIcons[backup.type];
                const status = statusConfig[backup.status];
                const StatusIcon = status.icon;
                const StorageIcon = storageIcons[backup.storage];

                return (
                  <tr key={backup.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <TypeIcon className="h-4 w-4 text-brand flex-shrink-0" />
                        <span className="text-sm font-medium text-white">
                          {backup.site || backup.database || "Full Server"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-[#555] capitalize">{backup.type}</span>
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status.color}`}>
                        <StatusIcon className={`h-3 w-3 ${backup.status === "running" ? "animate-spin" : ""}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="text-right text-sm text-[#999]">
                      {backup.size > 0 ? formatBytes(backup.size) : "—"}
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs text-[#555]">
                        <StorageIcon className="h-3 w-3" />
                        {backup.storage.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-sm text-[#555]">{backup.createdAt}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        {backup.status === "completed" && (
                          <>
                            <button
                              className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                              title="Restore"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          className="p-1.5 rounded text-[#555] hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
