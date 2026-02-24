import { shellExec, shellSudo } from "@/lib/shell";
import prisma from "@/lib/prisma";

export interface CronEntry {
  id?: string;
  expression: string;
  command: string;
  user: string;
  enabled: boolean;
  description?: string;
}

/**
 * Parse crontab -l output into structured entries
 */
function parseCrontab(output: string, user: string): CronEntry[] {
  const entries: CronEntry[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#DISABLED#")) {
      // Check for disabled entries
      if (trimmed.startsWith("#DISABLED#")) {
        const rest = trimmed.replace("#DISABLED#", "").trim();
        const match = rest.match(/^([\S]+\s+[\S]+\s+[\S]+\s+[\S]+\s+[\S]+)\s+(.+)$/);
        if (match) {
          entries.push({
            expression: match[1],
            command: match[2],
            user,
            enabled: false,
          });
        }
      }
      continue;
    }
    if (trimmed.startsWith("#")) continue;

    // Standard cron: min hour dom month dow command
    const match = trimmed.match(
      /^([\S]+\s+[\S]+\s+[\S]+\s+[\S]+\s+[\S]+)\s+(.+)$/
    );
    if (match) {
      entries.push({
        expression: match[1],
        command: match[2],
        user,
        enabled: true,
      });
    }
  }

  return entries;
}

// ─── Public API ─────────────────────────────────────────────────

export async function listJobs(user = "root"): Promise<CronEntry[]> {
  const result = await shellSudo(`crontab -u ${user} -l`);
  if (result.exitCode !== 0) {
    // No crontab for user is not an error
    if (result.stderr.includes("no crontab")) return [];
    throw new Error(`Failed to list cron jobs: ${result.stderr}`);
  }
  return parseCrontab(result.stdout, user);
}

export async function addJob(params: {
  expression: string;
  command: string;
  user?: string;
  description?: string;
}): Promise<void> {
  const { expression, command, user = "root", description } = params;

  // Validate cron expression (5 fields)
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Invalid cron expression: must have exactly 5 fields");
  }

  // Get existing crontab
  const existing = await shellSudo(`crontab -u ${user} -l`);
  const currentTab =
    existing.exitCode === 0 ? existing.stdout : "";

  // Append new job
  const comment = description ? `# ${description}\n` : "";
  const newTab = `${currentTab}\n${comment}${expression} ${command}`.trim();

  const result = await shellSudo(
    `echo '${newTab.replace(/'/g, "'\\''")}' | crontab -u ${user} -`
  );
  if (result.exitCode !== 0) {
    throw new Error(`Failed to add cron job: ${result.stderr}`);
  }

  // Save to DB
  await prisma.cronJob.create({
    data: {
      name: description || command.slice(0, 50),
      expression,
      command,
      user,
      enabled: true,
      description: description || null,
    },
  });
}

export async function removeJob(params: {
  expression: string;
  command: string;
  user?: string;
}): Promise<void> {
  const { expression, command, user = "root" } = params;

  const existing = await shellSudo(`crontab -u ${user} -l`);
  if (existing.exitCode !== 0) return;

  const lineToRemove = `${expression} ${command}`;
  const filtered = existing.stdout
    .split("\n")
    .filter((line) => line.trim() !== lineToRemove)
    .join("\n")
    .trim();

  const result = await shellSudo(
    `echo '${filtered.replace(/'/g, "'\\''")}' | crontab -u ${user} -`
  );
  if (result.exitCode !== 0) {
    throw new Error(`Failed to remove cron job: ${result.stderr}`);
  }

  // Remove from DB
  await prisma.cronJob.deleteMany({
    where: { expression, command },
  });
}

export async function toggleJob(params: {
  expression: string;
  command: string;
  enabled: boolean;
  user?: string;
}): Promise<void> {
  const { expression, command, enabled, user = "root" } = params;

  const existing = await shellSudo(`crontab -u ${user} -l`);
  if (existing.exitCode !== 0) return;

  const targetLine = `${expression} ${command}`;
  const disabledLine = `#DISABLED#${expression} ${command}`;

  const lines = existing.stdout.split("\n").map((line) => {
    const trimmed = line.trim();
    if (enabled && trimmed === disabledLine) {
      return targetLine;
    }
    if (!enabled && trimmed === targetLine) {
      return `#DISABLED#${targetLine}`;
    }
    return line;
  });

  const result = await shellSudo(
    `echo '${lines.join("\n").replace(/'/g, "'\\''")}' | crontab -u ${user} -`
  );
  if (result.exitCode !== 0) {
    throw new Error(`Failed to toggle cron job: ${result.stderr}`);
  }

  await prisma.cronJob.updateMany({
    where: { expression, command },
    data: { enabled },
  });
}

export async function getSystemUsers(): Promise<string[]> {
  const result = await shellExec(
    "awk -F: '$3 >= 1000 || $1 == \"root\" {print $1}' /etc/passwd"
  );
  if (result.exitCode !== 0) return ["root"];
  return result.stdout.split("\n").filter(Boolean);
}

export const cronService = {
  listJobs,
  addJob,
  removeJob,
  toggleJob,
  getSystemUsers,
};
