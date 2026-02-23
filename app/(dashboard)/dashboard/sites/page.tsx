"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Globe,
  ExternalLink,
  Settings,
  Trash2,
  FolderOpen,
  Database as DatabaseIcon,
  FileText,
  Lock,
  MoreVertical,
  Play,
  Pause,
  Zap,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

// TODO: Replace with API calls
const mockSites = [
  {
    id: "1", domain: "blog.example.com", type: "WORDPRESS", status: "ACTIVE",
    phpVersion: "8.3", sslEnabled: true, sslExpiry: new Date("2026-04-15"),
    bandwidth24h: 45200000, requests24h: 1234, avgResponseTime: 125,
  },
  {
    id: "2", domain: "shop.example.com", type: "WORDPRESS", status: "ACTIVE",
    phpVersion: "8.3", sslEnabled: true, sslExpiry: new Date("2026-03-08"),
    bandwidth24h: 82300000, requests24h: 856, avgResponseTime: 98,
  },
  {
    id: "3", domain: "app.example.com", type: "DOCKER_PROXY", status: "ACTIVE",
    proxyTarget: "localhost:3000", sslEnabled: true, sslExpiry: new Date("2026-05-30"),
    bandwidth24h: 12800000, requests24h: 342, avgResponseTime: 45,
  },
  {
    id: "4", domain: "staging.example.com", type: "NODEJS_PROXY", status: "STOPPED",
    proxyTarget: "localhost:4000", sslEnabled: false,
    bandwidth24h: 0, requests24h: 0, avgResponseTime: 0,
  },
];

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  WORDPRESS: { label: "WordPress", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Globe },
  STATIC: { label: "Static", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20", icon: FileText },
  PHP: { label: "PHP", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", icon: Zap },
  NODEJS_PROXY: { label: "Node.js", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Zap },
  DOCKER_PROXY: { label: "Docker", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: Zap },
  CUSTOM_PROXY: { label: "Proxy", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Zap },
};

function getSSLDaysLeft(expiry?: Date): number {
  if (!expiry) return 0;
  return Math.ceil((expiry.getTime() - Date.now()) / 86400000);
}

export default function SitesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = mockSites.filter((s) =>
    s.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sites</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mockSites.length} sites · {mockSites.filter((s) => s.status === "ACTIVE").length} active
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Site
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search sites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary/50 border-transparent focus:border-border"
        />
      </div>

      {/* Sites List */}
      <div className="space-y-3 stagger-children">
        {filtered.map((site) => {
          const sslDays = site.sslEnabled ? getSSLDaysLeft(site.sslExpiry) : 0;
          const tc = typeConfig[site.type] || typeConfig.CUSTOM_PROXY;
          const isActive = site.status === "ACTIVE";

          return (
            <Card
              key={site.id}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-all"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Status + Domain + Type */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`status-dot ${isActive ? "active" : "stopped"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-[15px] font-semibold truncate">
                          {site.domain}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 font-semibold shrink-0 ${tc.color}`}
                        >
                          {tc.label}
                        </Badge>
                        {site.phpVersion && (
                          <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                            PHP {site.phpVersion}
                          </Badge>
                        )}
                      </div>
                      {site.proxyTarget && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          → {site.proxyTarget}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Center: Stats */}
                  <div className="hidden lg:flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Requests</p>
                      <p className="text-sm font-semibold">{site.requests24h.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Traffic</p>
                      <p className="text-sm font-semibold">{formatBytes(site.bandwidth24h)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Response</p>
                      <p className="text-sm font-semibold">
                        {site.avgResponseTime ? `${site.avgResponseTime}ms` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Right: SSL + Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {site.sslEnabled && (
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span
                          className={`text-sm font-bold ${
                            sslDays < 14
                              ? "text-red-500"
                              : sslDays < 30
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {sslDays}d
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`https://${site.domain}`} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FolderOpen className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FolderOpen className="mr-2 h-4 w-4" /> File Manager
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <DatabaseIcon className="mr-2 h-4 w-4" /> Database
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" /> Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" /> Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            {isActive ? (
                              <><Pause className="mr-2 h-4 w-4" /> Stop</>
                            ) : (
                              <><Play className="mr-2 h-4 w-4" /> Start</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <Card className="p-12 text-center bg-card/50">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No sites found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? "Try adjusting your search" : "Create your first site to get started"}
          </p>
          {!searchQuery && (
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Create Site
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
