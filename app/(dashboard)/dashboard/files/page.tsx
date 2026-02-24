"use client";

import {
  FolderOpen,
  File,
  FileText,
  FileCode,
  Image,
  Archive,
  ChevronRight,
  ArrowUp,
  RefreshCw,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit3,
  Copy,
  Scissors,
  FolderPlus,
  MoreHorizontal,
  Home,
  HardDrive,
  Lock,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { formatBytes } from "@/lib/utils";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory" | "symlink";
  size: number;
  modified: string;
  permissions: string;
  owner: string;
  group: string;
}

function getFileIcon(entry: FileEntry) {
  if (entry.type === "directory") return <FolderOpen className="h-4 w-4 text-brand" />;
  if (entry.type === "symlink") return <File className="h-4 w-4 text-[#8B5CF6]" />;

  const ext = entry.name.split(".").pop()?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "ico"].includes(ext))
    return <Image className="h-4 w-4 text-[#EC4899]" />;
  if (["zip", "tar", "gz", "bz2", "7z", "rar"].includes(ext))
    return <Archive className="h-4 w-4 text-warning" />;
  if (["js", "ts", "tsx", "jsx", "py", "php", "rb", "go", "rs", "sh", "css", "scss", "html"].includes(ext))
    return <FileCode className="h-4 w-4 text-success" />;
  if (["md", "txt", "log", "json", "yml", "yaml", "xml", "ini", "conf", "env"].includes(ext))
    return <FileText className="h-4 w-4 text-[#999]" />;

  return <File className="h-4 w-4 text-[#555]" />;
}

export default function FilesPage() {
  const [currentPath, setCurrentPath] = useState("/var/www");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [diskUsage, setDiskUsage] = useState({ used: "0", available: "0", percentage: "0%" });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [contextMenu, setContextMenu] = useState<string | null>(null);

  // Mock data for development
  const mockEntries: FileEntry[] = [
    { name: "blog.example.com", path: "/var/www/blog.example.com", type: "directory", size: 4096, modified: "2026-02-20 14:30", permissions: "drwxr-xr-x", owner: "www-data", group: "www-data" },
    { name: "shop.example.com", path: "/var/www/shop.example.com", type: "directory", size: 4096, modified: "2026-02-22 09:15", permissions: "drwxr-xr-x", owner: "www-data", group: "www-data" },
    { name: "api.example.com", path: "/var/www/api.example.com", type: "directory", size: 4096, modified: "2026-02-23 11:00", permissions: "drwxr-xr-x", owner: "www-data", group: "www-data" },
    { name: "staging.example.com", path: "/var/www/staging.example.com", type: "directory", size: 4096, modified: "2026-02-19 16:45", permissions: "drwxr-xr-x", owner: "www-data", group: "www-data" },
    { name: ".htaccess", path: "/var/www/.htaccess", type: "file", size: 234, modified: "2026-01-10 08:00", permissions: "-rw-r--r--", owner: "root", group: "root" },
    { name: "index.html", path: "/var/www/index.html", type: "file", size: 1247, modified: "2026-01-05 12:00", permissions: "-rw-r--r--", owner: "www-data", group: "www-data" },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}&action=list`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setDiskUsage(data.diskUsage || { used: "0", available: "0", percentage: "0%" });
      } else {
        setEntries(mockEntries);
        setDiskUsage({ used: "6.2G", available: "43G", percentage: "13%" });
      }
    } catch {
      setEntries(mockEntries);
      setDiskUsage({ used: "6.2G", available: "43G", percentage: "13%" });
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigate = (path: string) => {
    setCurrentPath(path);
    setSelected(new Set());
    setContextMenu(null);
  };

  const goUp = () => {
    const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
    navigate(parent);
  };

  const pathParts = currentPath.split("/").filter(Boolean);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mkdir",
          path: `${currentPath}/${newFolderName}`,
        }),
      });
      await fetchData();
    } finally {
      setShowNewFolder(false);
      setNewFolderName("");
    }
  };

  const handleDelete = async (path: string) => {
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", path }),
      });
      await fetchData();
    } catch {}
  };

  const toggleSelect = (path: string) => {
    const next = new Set(selected);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setSelected(next);
  };

  // Sort: directories first, then by name
  const sorted = [...entries].sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">File Manager</h2>
          <p className="text-sm text-[#555]">
            Disk: {diskUsage.used} used / {diskUsage.available} available ({diskUsage.percentage})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 rounded-md border border-[#222] bg-[#141414] px-4 py-2.5 text-sm text-[#999] hover:text-white transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            New Folder
          </button>
          <button className="flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brandlight transition-colors">
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 rounded-md border border-[#222] bg-[#141414] px-4 py-2.5 overflow-x-auto">
        <button
          onClick={() => navigate("/")}
          className="p-1 rounded text-[#555] hover:text-white transition-colors flex-shrink-0"
        >
          <Home className="h-4 w-4" />
        </button>
        {pathParts.map((part, idx) => (
          <div key={idx} className="flex items-center gap-1.5 flex-shrink-0">
            <ChevronRight className="h-3 w-3 text-[#333]" />
            <button
              onClick={() => navigate("/" + pathParts.slice(0, idx + 1).join("/"))}
              className={`text-sm hover:text-white transition-colors ${
                idx === pathParts.length - 1 ? "text-white font-medium" : "text-[#555]"
              }`}
            >
              {part}
            </button>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          <button
            onClick={goUp}
            disabled={currentPath === "/"}
            className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] disabled:opacity-30 transition-colors"
            title="Go up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => fetchData()}
            className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* New folder inline */}
      {showNewFolder && (
        <form onSubmit={handleCreateFolder} className="flex items-center gap-2">
          <FolderPlus className="h-4 w-4 text-brand" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
            className="flex-1 max-w-xs rounded-md border border-[#222] bg-[#141414] px-3 py-2 text-sm text-white placeholder:text-[#444] outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brandlight transition-colors"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowNewFolder(false)}
            className="rounded-md border border-[#222] px-4 py-2 text-sm text-[#999] hover:text-white transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {/* File table */}
      <div className="rounded-md border border-[#222] bg-[#141414] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="w-8 text-center">
                  <input type="checkbox" className="accent-brand" />
                </th>
                <th className="text-left">Name</th>
                <th className="text-right">Size</th>
                <th className="text-left">Modified</th>
                <th className="text-left">Permissions</th>
                <th className="text-left">Owner</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr
                  key={entry.path}
                  className={selected.has(entry.path) ? "bg-brand/5" : ""}
                  onDoubleClick={() => {
                    if (entry.type === "directory") navigate(entry.path);
                  }}
                >
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(entry.path)}
                      onChange={() => toggleSelect(entry.path)}
                      className="accent-brand"
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        if (entry.type === "directory") navigate(entry.path);
                      }}
                      className="flex items-center gap-2.5 text-left"
                    >
                      {getFileIcon(entry)}
                      <span className={`text-sm ${
                        entry.type === "directory"
                          ? "font-medium text-white hover:text-brand"
                          : "text-[#999]"
                      } transition-colors`}>
                        {entry.name}
                      </span>
                    </button>
                  </td>
                  <td className="text-right text-sm text-[#555]">
                    {entry.type === "directory" ? "—" : formatBytes(entry.size)}
                  </td>
                  <td className="text-sm text-[#555]">{entry.modified}</td>
                  <td>
                    <span className="text-xs font-mono text-[#555]">{entry.permissions}</span>
                  </td>
                  <td className="text-sm text-[#555]">{entry.owner}</td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      {entry.type === "file" && (
                        <button
                          className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded text-[#555] hover:text-white hover:bg-[#111] transition-colors"
                        title="Permissions"
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.path)}
                        className="p-1.5 rounded text-[#555] hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-[#555]">
            <FolderOpen className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">Empty directory</p>
          </div>
        )}
      </div>

      {/* Selection toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-lg border border-[#222] bg-[#111] px-5 py-3 shadow-2xl">
          <span className="text-sm text-[#999]">{selected.size} selected</span>
          <div className="h-5 w-px bg-[#222]" />
          <button className="flex items-center gap-1.5 text-sm text-[#999] hover:text-white transition-colors">
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
          <button className="flex items-center gap-1.5 text-sm text-[#999] hover:text-white transition-colors">
            <Scissors className="h-3.5 w-3.5" /> Move
          </button>
          <button className="flex items-center gap-1.5 text-sm text-[#999] hover:text-white transition-colors">
            <Archive className="h-3.5 w-3.5" /> Zip
          </button>
          <button className="flex items-center gap-1.5 text-sm text-danger hover:text-danger transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
