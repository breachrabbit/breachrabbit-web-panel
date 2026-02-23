"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Globe,
  Database,
  FolderOpen,
  Shield,
  Clock,
  Server,
  FileText,
  Terminal,
  Settings,
  Lock,
  Package,
  ChevronLeft,
  ChevronDown,
  LogOut,
  Zap,
  Activity,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Hosting",
    items: [
      { name: "Sites", href: "/dashboard/sites", icon: Globe },
      { name: "Databases", href: "/dashboard/databases", icon: Database },
      { name: "File Manager", href: "/dashboard/files", icon: FolderOpen },
      { name: "SSL / TLS", href: "/dashboard/ssl", icon: Lock },
    ],
  },
  {
    label: "Server",
    items: [
      { name: "Firewall", href: "/dashboard/firewall", icon: Shield },
      { name: "Cron Jobs", href: "/dashboard/cron", icon: Clock },
      { name: "Backups", href: "/dashboard/backups", icon: Package },
      { name: "Terminal", href: "/dashboard/terminal", icon: Terminal },
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "Monitoring", href: "/dashboard/monitoring", icon: Activity },
      { name: "Logs", href: "/dashboard/logs", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <aside
      className={cn(
        "sidebar flex flex-col",
        collapsed && "collapsed"
      )}
    >
      {/* Logo + Collapse */}
      <div className="flex h-[var(--header-height)] items-center justify-between border-b px-5">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Zap className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight tracking-tight">
                HostPanel
              </span>
              <span className="text-[10px] font-medium text-primary uppercase tracking-widest">
                Pro
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* OLS Status Indicator */}
      {!collapsed && (
        <div className="mx-4 mt-4 mb-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
          <div className="status-dot active" />
          <span className="text-xs font-medium text-emerald-400">OpenLiteSpeed Running</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      collapsed && "justify-center px-0"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!collapsed && <span>{item.name}</span>}
                    {isActive && !collapsed && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2.5 hover:bg-accent transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary ring-1 ring-primary/20">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">
                {user?.name || "Admin"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.email || "admin@example.com"}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
