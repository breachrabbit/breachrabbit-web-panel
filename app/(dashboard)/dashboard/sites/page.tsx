"use client";

import {
  Globe,
  Shield,
  ExternalLink,
  FolderOpen,
  Database,
  MoreHorizontal,
  Plus,
  Search,
  Power,
  Trash2,
  Settings,
  Eye,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const sites = [
  {
    id: "1",
    domain: "blog.example.com",
    type: "WordPress",
    status: "active",
    phpVersion: "8.3",
    sslDays: 45,
    sslStatus: "ok",
    requests24h: 1234,
    bandwidth24h: "45.2 MB",
    avgResponse: "125ms",
    diskUsage: "1.2 GB",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    domain: "shop.example.com",
    type: "WordPress",
    status: "active",
    phpVersion: "8.3",
    sslDays: 12,
    sslStatus: "expiring",
    requests24h: 856,
    bandwidth24h: "23.1 MB",
    avgResponse: "89ms",
    diskUsage: "3.8 GB",
    createdAt: "2026-01-20",
  },
  {
    id: "3",
    domain: "api.example.com",
    type: "Node.js",
    status: "active",
    phpVersion: null,
    sslDays: 89,
    sslStatus: "ok",
    requests24h: 5420,
    bandwidth24h: "12.8 MB",
    avgResponse: "45ms",
    diskUsage: "0.4 GB",
    createdAt: "2026-02-01",
  },
  {
    id: "4",
    domain: "staging.example.com",
    type: "PHP",
    status: "stopped",
    phpVersion: "8.3",
    sslDays: 60,
    sslStatus: "ok",
    requests24h: 0,
    bandwidth24h: "0 MB",
    avgResponse: "-",
    diskUsage: "0.8 GB",
    createdAt: "2026-02-10",
  },
];

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    WordPress: "bg-[#21759b]/15 text-[#4BA3D0]",
    "Node.js": "bg-success/15 text-success",
    PHP: "bg-[#8B5CF6]/15 text-[#A78BFA]",
    Static: "bg-bodydark2/15 text-[#555]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${styles[type] || styles.Static}`}>
      {type}
    </span>
  );
}

export default function SitesPage() {
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = sites.filter((s) =>
    s.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sites</h2>
          <p className="text-sm text-[#555]">
            {sites.length} sites · {sites.filter((s) => s.status === "active").length} active
          </p>
        </div>
        <Link
          href="#"
          className="flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brandlight transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Site
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
          <input
            type="text"
            placeholder="Search sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-[#222] bg-[#141414] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-[#555] outline-none focus:border-brand transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 rounded-md border border-[#222] bg-[#141414] px-4 py-2.5 text-sm text-[#999] hover:text-white transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </button>
      </div>

      {/* Sites table */}
      <div className="rounded-md border border-[#222] bg-[#141414] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Site</th>
                <th className="text-left">Type</th>
                <th className="text-center">Status</th>
                <th className="text-center">SSL</th>
                <th className="text-right">Requests</th>
                <th className="text-right">Bandwidth</th>
                <th className="text-right">Response</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((site) => (
                <tr key={site.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-brand flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          {site.domain}
                        </p>
                        {site.phpVersion && (
                          <p className="text-[11px] text-[#555]">
                            PHP {site.phpVersion} · {site.diskUsage}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td><TypeBadge type={site.type} /></td>
                  <td className="text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      site.status === "active" ? "text-success" : "text-[#555]"
                    }`}>
                      <span className={`status-dot ${site.status === "active" ? "active" : "stopped"}`} />
                      {site.status === "active" ? "Active" : "Stopped"}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      site.sslDays < 14 ? "text-warning" : "text-success"
                    }`}>
                      <Shield className="h-3 w-3" />
                      {site.sslDays}d
                      {site.sslDays < 14 && " ⚠"}
                    </span>
                  </td>
                  <td className="text-right text-sm text-[#999]">
                    {site.requests24h.toLocaleString()}
                  </td>
                  <td className="text-right text-sm text-[#999]">
                    {site.bandwidth24h}
                  </td>
                  <td className="text-right text-sm text-[#999]">
                    {site.avgResponse}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <a
                        href={`https://${site.domain}`}
                        target="_blank"
                        rel="noopener"
                        className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                        title="Visit site"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <Link
                        href={`/dashboard/files?site=${site.id}`}
                        className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                        title="File Manager"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/dashboard/databases?site=${site.id}`}
                        className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                        title="Database"
                      >
                        <Database className="h-3.5 w-3.5" />
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === site.id ? null : site.id)}
                          className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                        {openMenu === site.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-md border border-[#222] bg-[#141414] py-1 shadow-lg">
                              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#999] hover:text-white hover:bg-[#111] transition-colors">
                                <Settings className="h-3.5 w-3.5" /> Settings
                              </button>
                              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#999] hover:text-white hover:bg-[#111] transition-colors">
                                <Power className="h-3.5 w-3.5" />
                                {site.status === "active" ? "Stop" : "Start"}
                              </button>
                              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#555]">
            <Globe className="h-8 w-8 mb-3 opacity-50" />
            <p className="text-sm">No sites found</p>
          </div>
        )}
      </div>
    </div>
  );
}
