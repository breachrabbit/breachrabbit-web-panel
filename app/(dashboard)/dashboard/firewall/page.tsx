"use client";

import {
  Shield,
  Plus,
  Trash2,
  Power,
  RefreshCw,
  AlertTriangle,
  Globe,
  Lock,
  Unlock,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface FirewallRule {
  number: number;
  to: string;
  action: string;
  from: string;
  port?: string;
  protocol?: string;
  comment?: string;
}

interface FirewallData {
  status: {
    active: boolean;
    defaultIncoming: string;
    defaultOutgoing: string;
    rules: FirewallRule[];
  };
  fail2ban: {
    running: boolean;
    jails: string[];
  };
}

export default function FirewallPage() {
  const [data, setData] = useState<FirewallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Add rule form
  const [ruleAction, setRuleAction] = useState<"allow" | "deny" | "reject">("allow");
  const [port, setPort] = useState("");
  const [protocol, setProtocol] = useState<"tcp" | "udp" | "any">("tcp");
  const [from, setFrom] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/firewall");
      if (res.ok) setData(await res.json());
    } catch {
      // silently fail for demo
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action: string, extra?: Record<string, any>) => {
    setSubmitting(true);
    try {
      await fetch("/api/firewall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAction("add-rule", {
      ruleAction,
      port,
      protocol,
      from: from || "Anywhere",
      comment,
    });
    setShowAdd(false);
    setPort("");
    setComment("");
    setFrom("");
  };

  // Mock data for UI display when API is not available
  const mockRules: FirewallRule[] = [
    { number: 1, to: "22/tcp", action: "ALLOW", from: "Anywhere", port: "22", protocol: "tcp", comment: "SSH" },
    { number: 2, to: "80/tcp", action: "ALLOW", from: "Anywhere", port: "80", protocol: "tcp", comment: "HTTP" },
    { number: 3, to: "443/tcp", action: "ALLOW", from: "Anywhere", port: "443", protocol: "tcp", comment: "HTTPS" },
    { number: 4, to: "7080/tcp", action: "ALLOW", from: "Anywhere", port: "7080", protocol: "tcp", comment: "OLS Admin" },
    { number: 5, to: "3306/tcp", action: "DENY", from: "Anywhere", port: "3306", protocol: "tcp", comment: "MariaDB" },
    { number: 6, to: "5432/tcp", action: "DENY", from: "Anywhere", port: "5432", protocol: "tcp", comment: "PostgreSQL" },
  ];

  const rules = data?.status?.rules || mockRules;
  const isActive = data?.status?.active ?? true;
  const fail2banRunning = data?.fail2ban?.running ?? true;
  const fail2banJails = data?.fail2ban?.jails || ["sshd", "nginx-http-auth"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Firewall</h2>
          <p className="text-sm text-[#555]">
            UFW rules · {rules.length} active rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 rounded-md border border-[#222] bg-[#141414] px-4 py-2.5 text-sm text-[#999] hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brandlight transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-[#222] bg-[#141414] p-4 flex items-center gap-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${isActive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{isActive ? "Active" : "Inactive"}</p>
            <p className="text-xs text-[#555]">UFW Status</p>
          </div>
          <button
            onClick={() => handleAction(isActive ? "disable" : "enable")}
            disabled={submitting}
            className="ml-auto p-2 rounded-md text-[#555] hover:text-white hover:bg-[#111] transition-colors"
            title={isActive ? "Disable firewall" : "Enable firewall"}
          >
            <Power className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-md border border-[#222] bg-[#141414] p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{rules.length}</p>
            <p className="text-xs text-[#555]">Active Rules</p>
          </div>
        </div>

        <div className="rounded-md border border-[#222] bg-[#141414] p-4 flex items-center gap-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${fail2banRunning ? "bg-success/15 text-success" : "bg-[#333]/15 text-[#555]"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{fail2banRunning ? "Active" : "Off"}</p>
            <p className="text-xs text-[#555]">Fail2ban · {fail2banJails.length} jails</p>
          </div>
        </div>
      </div>

      {/* Default policies */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-[#555]">Default policies:</span>
        <span className="flex items-center gap-1.5 text-danger">
          <Lock className="h-3 w-3" /> Incoming: Deny
        </span>
        <span className="flex items-center gap-1.5 text-success">
          <Unlock className="h-3 w-3" /> Outgoing: Allow
        </span>
      </div>

      {/* Add Rule Modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg border border-[#222] bg-[#141414] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Add Firewall Rule</h3>
              <form onSubmit={handleAddRule} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#555]">Action</label>
                    <select
                      value={ruleAction}
                      onChange={(e) => setRuleAction(e.target.value as any)}
                      className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand"
                    >
                      <option value="allow">Allow</option>
                      <option value="deny">Deny</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#555]">Protocol</label>
                    <select
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value as any)}
                      className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-brand"
                    >
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                      <option value="any">Any</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#555]">Port</label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="e.g. 8080 or 3000:3100"
                    required
                    className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder:text-[#444] outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#555]">From (optional)</label>
                  <input
                    type="text"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="IP or CIDR, e.g. 192.168.1.0/24"
                    className="w-full rounded-md border border-[#222] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder:text-[#444] outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#555]">Comment (optional)</label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. API server"
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
                    Add Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Rules table */}
      <div className="rounded-md border border-[#222] bg-[#141414] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">#</th>
                <th className="text-left">To</th>
                <th className="text-center">Action</th>
                <th className="text-left">From</th>
                <th className="text-left">Comment</th>
                <th className="text-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.number}>
                  <td className="text-sm text-[#555]">{rule.number}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-brand flex-shrink-0" />
                      <span className="text-sm font-medium text-white">{rule.to}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      rule.action === "ALLOW"
                        ? "bg-success/15 text-success"
                        : rule.action === "DENY"
                        ? "bg-danger/15 text-danger"
                        : "bg-warning/15 text-warning"
                    }`}>
                      {rule.action}
                    </span>
                  </td>
                  <td className="text-sm text-[#999]">{rule.from}</td>
                  <td className="text-sm text-[#555]">{rule.comment || "—"}</td>
                  <td className="text-center">
                    <button
                      onClick={() => handleAction("delete-rule", { ruleNumber: rule.number })}
                      className="p-1.5 rounded text-[#555] hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#555]">
            <Shield className="h-8 w-8 mb-3 opacity-50" />
            <p className="text-sm">No firewall rules configured</p>
          </div>
        )}
      </div>

      {/* Fail2ban section */}
      {fail2banRunning && (
        <div className="rounded-md border border-[#222] bg-[#141414] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Fail2ban Jails</h3>
          <div className="flex flex-wrap gap-2">
            {fail2banJails.map((jail) => (
              <span
                key={jail}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#222] bg-[#111] px-3 py-1.5 text-xs font-medium text-[#999]"
              >
                <span className="status-dot active" />
                {jail}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
