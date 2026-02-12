"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Sites",
    href: "/dashboard/sites",
    icon: Globe,
  },
  {
    name: "Databases",
    href: "/dashboard/databases",
    icon: Database,
  },
  {
    name: "Files",
    href: "/dashboard/files",
    icon: FolderOpen,
  },
  {
    name: "SSL Certificates",
    href: "/dashboard/ssl",
    icon: Lock,
  },
  {
    name: "Backups",
    href: "/dashboard/backups",
    icon: Package,
  },
  {
    name: "Firewall",
    href: "/dashboard/firewall",
    icon: Shield,
  },
  {
    name: "Cron Jobs",
    href: "/dashboard/cron",
    icon: Clock,
  },
  {
    name: "Monitoring",
    href: "/dashboard/monitoring",
    icon: Server,
  },
  {
    name: "Logs",
    href: "/dashboard/logs",
    icon: FileText,
  },
  {
    name: "Terminal",
    href: "/dashboard/terminal",
    icon: Terminal,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Globe className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Breach Rabbit HostPanel Pro</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-4 scrollbar-thin overflow-y-auto h-[calc(100vh-4rem)]">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
