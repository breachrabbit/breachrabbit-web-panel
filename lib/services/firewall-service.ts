import { shellExec, shellSudo } from "@/lib/shell";
import prisma from "@/lib/prisma";

export interface FirewallStatus {
  active: boolean;
  defaultIncoming: string;
  defaultOutgoing: string;
  rules: FirewallRuleInfo[];
}

export interface FirewallRuleInfo {
  number: number;
  to: string;
  action: string;
  from: string;
  port?: string;
  protocol?: string;
  comment?: string;
}

function parseUfwStatus(output: string): FirewallStatus {
  const lines = output.split("\n");
  const active = output.includes("Status: active");
  const defaultMatch = output.match(/Default:\s+(\w+)\s+\(incoming\),\s+(\w+)\s+\(outgoing\)/);
  const rules: FirewallRuleInfo[] = [];
  let ruleSection = false;

  for (const line of lines) {
    if (line.startsWith("--")) { ruleSection = true; continue; }
    if (!ruleSection || !line.trim()) continue;
    const parts = line.trim().split(/\s{2,}/);
    if (parts.length >= 3) {
      const [to, action, from] = parts;
      const portMatch = to.match(/^(\d+)(?:\/(\w+))?/);
      rules.push({
        number: rules.length + 1,
        to, action, from,
        port: portMatch?.[1],
        protocol: portMatch?.[2] || "any",
        comment: parts[3] || undefined,
      });
    }
  }

  return {
    active,
    defaultIncoming: defaultMatch?.[1] || "deny",
    defaultOutgoing: defaultMatch?.[2] || "allow",
    rules,
  };
}

export async function getStatus(): Promise<FirewallStatus> {
  const result = await shellSudo("ufw status verbose");
  if (result.exitCode !== 0) throw new Error(`Failed to get UFW status: ${result.stderr}`);
  return parseUfwStatus(result.stdout);
}

export async function enableFirewall(): Promise<void> {
  const result = await shellSudo("ufw --force enable");
  if (result.exitCode !== 0) throw new Error(`Failed to enable UFW: ${result.stderr}`);
}

export async function disableFirewall(): Promise<void> {
  const result = await shellSudo("ufw --force disable");
  if (result.exitCode !== 0) throw new Error(`Failed to disable UFW: ${result.stderr}`);
}

export async function addRule(params: {
  action: "allow" | "deny" | "reject";
  port: string;
  protocol?: "tcp" | "udp" | "any";
  from?: string;
  comment?: string;
}): Promise<void> {
  const { action, port, protocol = "any", from, comment } = params;

  let cmd = `ufw ${action}`;
  if (from && from !== "Anywhere") cmd += ` from ${from}`;
  cmd += ` to any port ${port}`;
  if (protocol !== "any") cmd += ` proto ${protocol}`;
  if (comment) cmd += ` comment '${comment.replace(/'/g, "'\\''")}'`;

  const result = await shellSudo(cmd);
  if (result.exitCode !== 0) throw new Error(`Failed to add rule: ${result.stderr}`);

  // FirewallRule schema fields: name, action, protocol, port (String), sourceIp, isEnabled
  await prisma.firewallRule.create({
    data: {
      name: comment || `${action} port ${port}`,
      description: comment || null,
      action,
      protocol: protocol === "any" ? "tcp" : protocol,
      port: port,
      sourceIp: from && from !== "Anywhere" ? from : null,
      isEnabled: true,
    },
  });
}

export async function deleteRule(ruleNumber: number): Promise<void> {
  const result = await shellSudo(`ufw --force delete ${ruleNumber}`);
  if (result.exitCode !== 0) throw new Error(`Failed to delete rule: ${result.stderr}`);
}

export async function setDefault(
  direction: "incoming" | "outgoing",
  policy: "allow" | "deny" | "reject"
): Promise<void> {
  const result = await shellSudo(`ufw default ${policy} ${direction}`);
  if (result.exitCode !== 0) throw new Error(`Failed to set default: ${result.stderr}`);
}

export async function getFail2banStatus(): Promise<{ running: boolean; jails: string[] }> {
  const result = await shellSudo("fail2ban-client status");
  if (result.exitCode !== 0) return { running: false, jails: [] };
  const jailMatch = result.stdout.match(/Jail list:\s+(.+)/);
  const jails = jailMatch ? jailMatch[1].split(",").map((j) => j.trim()) : [];
  return { running: true, jails };
}

export async function getJailStatus(jail: string): Promise<{
  currentlyBanned: number;
  totalBanned: number;
  bannedIPs: string[];
}> {
  const result = await shellSudo(`fail2ban-client status ${jail}`);
  if (result.exitCode !== 0) return { currentlyBanned: 0, totalBanned: 0, bannedIPs: [] };
  const currentMatch = result.stdout.match(/Currently banned:\s+(\d+)/);
  const totalMatch = result.stdout.match(/Total banned:\s+(\d+)/);
  const ipsMatch = result.stdout.match(/Banned IP list:\s+(.+)/);
  return {
    currentlyBanned: parseInt(currentMatch?.[1] || "0"),
    totalBanned: parseInt(totalMatch?.[1] || "0"),
    bannedIPs: ipsMatch ? ipsMatch[1].split(/\s+/).filter(Boolean) : [],
  };
}

export const firewallService = {
  getStatus, enableFirewall, disableFirewall, addRule, deleteRule, setDefault,
  getFail2banStatus, getJailStatus,
};
