"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Database as DatabaseIcon,
  MoreVertical,
  ExternalLink,
  Trash2,
  Key,
  HardDrive,
  Copy,
  Link as LinkIcon,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockDatabases = [
  {
    id: "1", name: "blog_wp", type: "MARIADB", sizeBytes: BigInt(245000000),
    users: [{ username: "blog_user", host: "localhost" }],
    linkedSite: "blog.example.com", createdAt: new Date("2026-01-10"),
  },
  {
    id: "2", name: "shop_wp", type: "MARIADB", sizeBytes: BigInt(512000000),
    users: [{ username: "shop_user", host: "localhost" }],
    linkedSite: "shop.example.com", createdAt: new Date("2026-01-15"),
  },
  {
    id: "3", name: "analytics_db", type: "POSTGRESQL", sizeBytes: BigInt(1200000000),
    users: [{ username: "analytics_user", host: "localhost" }, { username: "readonly_user", host: "localhost" }],
    linkedSite: null, createdAt: new Date("2026-02-01"),
  },
];

const typeColors: Record<string, string> = {
  MARIADB: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  POSTGRESQL: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  MONGODB: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function DatabasesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = mockDatabases.filter((db) =>
    db.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalSize = mockDatabases.reduce((acc, db) => acc + Number(db.sizeBytes), 0);
  const totalUsers = mockDatabases.reduce((acc, db) => acc + db.users.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Databases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            MariaDB & PostgreSQL management
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Database
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Databases", value: mockDatabases.length, icon: DatabaseIcon, color: "text-blue-500" },
          { label: "Total Size", value: formatBytes(totalSize), icon: HardDrive, color: "text-violet-500" },
          { label: "DB Users", value: totalUsers, icon: Key, color: "text-emerald-500" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search databases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary/50 border-transparent focus:border-border"
        />
      </div>

      {/* Database List */}
      <div className="space-y-3 stagger-children">
        {filtered.map((db) => (
          <Card key={db.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Name + Type */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary shrink-0">
                    <DatabaseIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-[15px] font-semibold font-mono">{db.name}</h3>
                      <Badge variant="outline" className={`text-[10px] h-5 font-semibold ${typeColors[db.type]}`}>
                        {db.type === "MARIADB" ? "MariaDB" : db.type === "POSTGRESQL" ? "PostgreSQL" : db.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(db.sizeBytes)}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {db.users.length} user{db.users.length !== 1 ? "s" : ""}
                      </span>
                      {db.linkedSite && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <LinkIcon className="h-3 w-3" />
                            {db.linkedSite}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Users + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* User badges */}
                  <div className="hidden md:flex items-center gap-1.5">
                    {db.users.map((u, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] h-5 font-mono">
                        {u.username}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Open Adminer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><ExternalLink className="mr-2 h-4 w-4" /> SQL Client</DropdownMenuItem>
                        <DropdownMenuItem><Key className="mr-2 h-4 w-4" /> Manage Users</DropdownMenuItem>
                        <DropdownMenuItem><Copy className="mr-2 h-4 w-4" /> Export</DropdownMenuItem>
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
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-12 text-center bg-card/50">
          <DatabaseIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No databases found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? "Try adjusting your search" : "Create your first database"}
          </p>
          {!searchQuery && (
            <Button className="mt-4 gap-2"><Plus className="h-4 w-4" /> Create Database</Button>
          )}
        </Card>
      )}
    </div>
  );
}
