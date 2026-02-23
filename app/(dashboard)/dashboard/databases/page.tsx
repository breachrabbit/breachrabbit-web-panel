"use client";

import {
  Database,
  Users,
  HardDrive,
  Plus,
  Search,
  MoreHorizontal,
  Link2,
  Terminal,
  Download,
  Trash2,
  Copy,
  Key,
} from "lucide-react";
import { useState } from "react";

const databases = [
  {
    id: "1",
    name: "blog_wp",
    type: "MariaDB",
    size: "45.2 MB",
    sizeBytes: 47395430,
    tables: 12,
    users: 1,
    linkedSite: "blog.example.com",
    charset: "utf8mb4",
    lastBackup: "2h ago",
  },
  {
    id: "2",
    name: "shop_wp",
    type: "MariaDB",
    size: "128.6 MB",
    sizeBytes: 134872064,
    tables: 34,
    users: 1,
    linkedSite: "shop.example.com",
    charset: "utf8mb4",
    lastBackup: "2h ago",
  },
  {
    id: "3",
    name: "panel_db",
    type: "PostgreSQL",
    size: "12.4 MB",
    sizeBytes: 13004390,
    tables: 18,
    users: 1,
    linkedSite: null,
    charset: "UTF8",
    lastBackup: "6h ago",
  },
  {
    id: "4",
    name: "analytics",
    type: "MariaDB",
    size: "1.2 GB",
    sizeBytes: 1288490188,
    tables: 8,
    users: 2,
    linkedSite: "api.example.com",
    charset: "utf8mb4",
    lastBackup: "1d ago",
  },
];

function DbIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    MariaDB: "bg-brand/15 text-brand",
    PostgreSQL: "bg-[#336791]/20 text-[#6DA4D0]",
    MongoDB: "bg-success/15 text-success",
  };
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[type] || "bg-bodydark2/15 text-bodydark2"}`}>
      <Database className="h-5 w-5" />
    </div>
  );
}

function TypeLabel({ type }: { type: string }) {
  const colors: Record<string, string> = {
    MariaDB: "text-brand",
    PostgreSQL: "text-[#6DA4D0]",
    MongoDB: "text-success",
  };
  return (
    <span className={`text-[11px] font-medium ${colors[type] || "text-bodydark2"}`}>
      {type}
    </span>
  );
}

export default function DatabasesPage() {
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = databases.filter((db) =>
    db.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSize = databases.reduce((sum, db) => sum + db.sizeBytes, 0);
  const totalSizeFormatted =
    totalSize > 1e9
      ? (totalSize / 1e9).toFixed(1) + " GB"
      : (totalSize / 1e6).toFixed(1) + " MB";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Databases</h2>
          <p className="text-sm text-bodydark2">
            {databases.length} databases · {totalSizeFormatted} total
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brandlight transition-colors">
          <Plus className="h-4 w-4" />
          Create Database
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-strokedark bg-cardbg p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{databases.length}</p>
            <p className="text-xs text-bodydark2">Total Databases</p>
          </div>
        </div>
        <div className="rounded-md border border-strokedark bg-cardbg p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning/15 text-warning">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{totalSizeFormatted}</p>
            <p className="text-xs text-bodydark2">Total Size</p>
          </div>
        </div>
        <div className="rounded-md border border-strokedark bg-cardbg p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">
              {databases.reduce((sum, db) => sum + db.users, 0)}
            </p>
            <p className="text-xs text-bodydark2">Database Users</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bodydark2" />
        <input
          type="text"
          placeholder="Search databases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-strokedark bg-cardbg py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-bodydark2 outline-none focus:border-brand transition-colors"
        />
      </div>

      {/* Database cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((db) => (
          <div
            key={db.id}
            className="rounded-md border border-strokedark bg-cardbg p-5 card-hover"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <DbIcon type={db.type} />
                <div>
                  <h4 className="text-sm font-semibold text-white">{db.name}</h4>
                  <TypeLabel type={db.type} />
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === db.id ? null : db.id)}
                  className="p-1.5 rounded text-bodydark2 hover:text-white hover:bg-sidebar transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openMenu === db.id && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
                    <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-md border border-strokedark bg-sidebar py-1 shadow-lg">
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-bodydark hover:text-white hover:bg-cardbg transition-colors">
                        <Key className="h-3.5 w-3.5" /> Manage Users
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-bodydark hover:text-white hover:bg-cardbg transition-colors">
                        <Copy className="h-3.5 w-3.5" /> Clone
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-bodydark hover:text-white hover:bg-cardbg transition-colors">
                        <Download className="h-3.5 w-3.5" /> Export
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" /> Drop
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-bodydark2 flex items-center gap-1.5">
                  <HardDrive className="h-3 w-3" /> Size
                </span>
                <span className="font-medium text-bodydark">{db.size}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-bodydark2 flex items-center gap-1.5">
                  <Database className="h-3 w-3" /> Tables
                </span>
                <span className="font-medium text-bodydark">{db.tables}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-bodydark2 flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> Users
                </span>
                <span className="font-medium text-bodydark">{db.users}</span>
              </div>
              {db.linkedSite && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-bodydark2 flex items-center gap-1.5">
                    <Link2 className="h-3 w-3" /> Site
                  </span>
                  <span className="font-medium text-brand">{db.linkedSite}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-bodydark2">Charset</span>
                <span className="font-medium text-bodydark">{db.charset}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-strokedark">
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-strokedark py-2 text-xs font-medium text-bodydark hover:text-white hover:border-brand/30 hover:bg-sidebar transition-colors">
                <Terminal className="h-3 w-3" /> SQL Editor
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-strokedark py-2 text-xs font-medium text-bodydark hover:text-white hover:border-brand/30 hover:bg-sidebar transition-colors">
                <Download className="h-3 w-3" /> Export
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-bodydark2">
          <Database className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">No databases found</p>
        </div>
      )}
    </div>
  );
}
