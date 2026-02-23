"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bell,
  Search,
  Menu,
  Sun,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const session = useSession();

  // Build breadcrumb from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    name: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <header className="sticky top-0 z-30 flex w-full border-b border-strokedark bg-cardbg">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-sm md:px-6 2xl:px-10">
        {/* Left: hamburger + breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-bodydark2 hover:text-white hover:bg-sidebar transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav className="hidden sm:flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {crumb.href !== breadcrumbs[0]?.href && (
                  <span className="text-bodydark2">/</span>
                )}
                {crumb.isLast ? (
                  <span className="font-medium text-brand">{crumb.name}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-bodydark2 hover:text-white transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Right: search + actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bodydark2" />
              <input
                type="text"
                placeholder="Type to search..."
                className="w-56 rounded-md border border-strokedark bg-sidebar py-2 pl-9 pr-4 text-sm text-bodydark placeholder:text-bodydark2 focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>

          {/* Notification bell */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-strokedark bg-sidebar text-bodydark2 hover:text-white transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
              3
            </span>
          </button>

          {/* Messages */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-strokedark bg-sidebar text-bodydark2 hover:text-white transition-colors">
            <MessageSquare className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
              2
            </span>
          </button>

          {/* User avatar (mobile) */}
          <div className="flex items-center gap-3 ml-2">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-sm font-medium text-bodydark">
                {session?.data?.user?.name || "Admin"}
              </span>
              <span className="text-[11px] text-bodydark2">Administrator</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-brand/20 border-2 border-brand/30 flex items-center justify-center text-xs font-bold text-brand">
              {session?.data?.user?.name
                ? session.data.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                : "AD"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
