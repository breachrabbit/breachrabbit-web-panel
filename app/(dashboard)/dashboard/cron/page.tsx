"use client";

import {
  Clock,
  Plus,
  Trash2,
  Power,
  RefreshCw,
  Play,
  Pause,
  Terminal,
  User,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { parseCron } from "@/lib/utils";

interface CronJob {
  expression: string;
  command: string;
  user: string;
  enabled: boolean;
  description?: string;
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [users, setUsers] = useState<string[]>(["root"]);
  const [selectedUser, setSelectedUser] = useState("root");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Add form
  const [newExpression, setNewExpression] = useState("0 0 * * *");
  const [newCommand, setNewCommand] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Preset expressions
  const presets = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Daily at midnight", value: "0 0 * * *" },
    { label: "Daily at 2 AM", value: "0 2 * * *" },
    { label: "Weekly (Sunday)", value: "0 0 * * 0" },
    { label: "Monthly (1st)", value: "0 0 1 * *" },
  ];

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/cron?user=${selectedUser}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setUsers(data.users || ["root"]);
      }
    } catch {
      // Mock data for development
      setJobs([
        { expression: "0 2 * * *", command: "/usr/local/bin/backup.sh", user: "root", enabled: true, description: "Daily backup" },
        { expression: "*/5 * * * *", command: "/usr/local/bin/check-health.sh", user: "root", enabled: true, description: "Health check" },
        { expression: "0 0 * * 0", command: "certbot renew --quiet", user: "root", enabled: true, description: "SSL renewal" },
        { expression: "0 3 * * *", command: "find /tmp -mtime +7 -delete", user: "root", enabled: false, description: "Cleanup temp" },
        { expression: "30 1 * * *", command: "/opt/scripts/db-optimize.sh", user: "root", enabled: true, description: "DB optimization" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          expression: newExpression,
          command: newCommand,
          user: selectedUser,
          description: newDescription,
        }),
      });
      await fetchData();
      setShowAdd(false);
      setNewCommand("");
      setNewDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (job: CronJob) => {
    await fetch("/api/cron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle",
        expression: job.expression,
        command: job.command,
        enabled: !job.enabled,
        user: job.user,
      }),
    });
    await fetchData();
  };

  const handleDelete = async (job: CronJob) => {
    await fetch("/api/cron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remove",
        expression: job.expression,
        command: job.command,
        user: job.user,
      }),
    });
    await fetchData();
  };

  const enabledCount = jobs.filter((j) => j.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Cron Jobs</h2>
          <p className="text-sm text-[#555]">
            {jobs.length} jobs · {enabledCount} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="rounded-md border border-[#222] bg-[#141414] px-3 py-2.5 text-sm text-[#999] outline-none focus:border-brand"
          >
            {users.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 rounded-md border border-[#222] bg-[#141414] px-4 py-2.5 text-sm text-[#999] hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brandlight transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Job
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-[#222] bg-[#141414] p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{jobs.length}</p>
            <p className="text-xs text-[#555]">Total Jobs</p>
          </div>
        </div>
        <div className="rounded-md border border-[#222] bg-[#141414] p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
            <Play className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{enabledCount}</p>
            <p className="text-xs text-[#555]">Active</p>
          </div>
        </div>
        <div className="rounded-md border border-[#222] bg-[#141414] p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning/15 text-warning">
            <Pause className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{jobs.length - enabledCount}</p>
            <p className="text-xs text-[#555]">Disabled</p>
          </div>
        </div>
      </div>

      {/* Add Job Modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-lg border border-[#222] bg-[#141414] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Add Cron Job</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#555]">Schedule</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newExpression}
                      onChange={(e) => setNewExpression(e.target.value)}
                      placeholder="* * * * *"
                      required
                      className="flex-1 rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] outline-none focus:border-brand"
                    />
                    <span className="text-xs text-[#555] whitespace-nowrap">
                      {parseCron(newExpression)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setNewExpression(p.value)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                          newExpression === p.value
                            ? "border-brand/30 bg-brand/10 text-brand"
                            : "border-[#222] text-[#555] hover:text-white"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#555]">Command</label>
                  <input
                    type="text"
                    value={newCommand}
                    onChange={(e) => setNewCommand(e.target.value)}
                    placeholder="/path/to/script.sh"
                    required
                    className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#555]">Description (optional)</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief description"
                    className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder:text-[#444] outline-none focus:border-brand"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="rounded-md border border-[#222] px-4 py-2.5 text-sm text-[#999] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brandlight disabled:opacity-50 transition-colors"
                  >
                    Create Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Jobs list */}
      <div className="space-y-3">
        {jobs.map((job, idx) => (
          <div
            key={idx}
            className={`rounded-md border bg-[#141414] p-4 card-hover ${
              job.enabled ? "border-[#222]" : "border-[#1a1a1a] opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${
                  job.enabled ? "bg-brand/15 text-brand" : "bg-[#222] text-[#555]"
                }`}>
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  {job.description && (
                    <p className="text-sm font-semibold text-white mb-0.5">{job.description}</p>
                  )}
                  <p className="text-xs font-mono text-[#999] truncate">{job.command}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] font-mono text-brand bg-brand/10 px-2 py-0.5 rounded">
                      {job.expression}
                    </span>
                    <span className="text-[11px] text-[#555]">
                      {parseCron(job.expression)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#555]">
                      <User className="h-3 w-3" /> {job.user}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                <button
                  onClick={() => handleToggle(job)}
                  className={`p-1.5 rounded transition-colors ${
                    job.enabled
                      ? "text-success hover:bg-success/10"
                      : "text-[#555] hover:text-white hover:bg-[#111]"
                  }`}
                  title={job.enabled ? "Disable" : "Enable"}
                >
                  <Power className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(job)}
                  className="p-1.5 rounded text-[#555] hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-[#555]">
          <Clock className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">No cron jobs found for {selectedUser}</p>
        </div>
      )}
    </div>
  );
}
