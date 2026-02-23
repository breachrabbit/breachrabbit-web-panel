"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Globe,
  Database,
  FolderOpen,
  Shield,
  Clock,
  HardDrive,
  Activity,
  FileText,
  Terminal,
  Settings,
  LogOut,
  ChevronDown,
  Server,
  X,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const menuGroups = [
  {
    label: "MENU",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Sites", href: "/dashboard/sites", icon: Globe },
      { name: "Databases", href: "/dashboard/databases", icon: Database },
      { name: "File Manager", href: "/dashboard/files", icon: FolderOpen },
    ],
  },
  {
    label: "SERVER",
    items: [
      { name: "Backups", href: "/dashboard/backups", icon: HardDrive },
      { name: "Firewall", href: "/dashboard/firewall", icon: Shield },
      { name: "Cron Jobs", href: "/dashboard/cron", icon: Clock },
      { name: "Monitoring", href: "/dashboard/monitoring", icon: Activity },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { name: "Logs", href: "/dashboard/logs", icon: FileText },
      { name: "Terminal", href: "/dashboard/terminal", icon: Terminal },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const session = useSession();
  const user = session?.data?.user;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`absolute left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden bg-[#111] duration-200 ease-linear lg:static lg:translate-x-0 ${
          open ? "w-72 translate-x-0" : "w-0 -translate-x-full lg:w-72 lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-bold text-white text-sm">
              HP
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white leading-tight tracking-tight">
                HostPanel
              </span>
              <span className="text-[10px] font-medium text-[#555] uppercase tracking-widest">
                Pro Edition
              </span>
            </div>
          </Link>
          <button
            onClick={onToggle}
            className="block lg:hidden text-[#555] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* OLS Status */}
        <div className="mx-4 mb-4 rounded-md bg-[#0a0a0a] px-4 py-2.5 flex items-center gap-3">
          <Server className="h-4 w-4 text-success flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[#999]">OpenLiteSpeed</span>
            <span className="text-[10px] text-success font-medium">Running · Port 7080</span>
          </div>
          <div className="ml-auto">
            <span className="status-dot active" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col overflow-y-auto no-scrollbar duration-200 ease-linear">
          <nav className="px-4 py-2">
            {menuGroups.map((group) => (
              <div key={group.label} className="mb-5">
                <h3 className="mb-2 ml-4 text-[11px] font-semibold tracking-[0.15em] text-[#555]">
                  {group.label}
                </h3>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`sidebar-link ${isActive ? "active" : ""}`}
                        >
                          <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                          <span>{item.name}</span>
                          {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* User section */}
        <div className="mt-auto border-t border-[#222] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand/20 flex items-center justify-center text-xs font-bold text-brand">
              {user?.name
                ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : "AD"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-[#999] truncate">
                {user?.name || "Admin"}
              </span>
              <span className="text-[11px] text-[#555] truncate">
                {user?.email || "admin@breachrabbit.pro"}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="ml-auto p-2 rounded-md text-[#555] hover:text-white hover:bg-[#0a0a0a] transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
