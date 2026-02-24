import { shellExec, shellExecFile } from "@/lib/shell";
import { promises as fs } from "fs";
import path from "path";

// Safety: restrict operations to these base dirs
const ALLOWED_ROOTS = [
  "/var/www",
  "/usr/local/lsws",
  "/etc/letsencrypt",
  "/tmp",
];

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory" | "symlink";
  size: number;
  modified: string;
  permissions: string;
  owner: string;
  group: string;
}

export interface FileContent {
  content: string;
  encoding: string;
  size: number;
  mimeType: string;
}

/**
 * Validate that a path is within allowed roots
 */
function validatePath(filePath: string): string {
  const resolved = path.resolve(filePath);

  // Block obvious dangerous paths
  if (resolved === "/" || resolved === "/etc" || resolved === "/root") {
    throw new Error("Access denied: restricted path");
  }

  const isAllowed = ALLOWED_ROOTS.some((root) => resolved.startsWith(root));
  if (!isAllowed) {
    throw new Error(
      `Access denied: ${resolved} is outside allowed directories`
    );
  }

  return resolved;
}

// ─── Public API ─────────────────────────────────────────────────

export async function listDirectory(dirPath: string): Promise<FileEntry[]> {
  const safePath = validatePath(dirPath);

  const result = await shellExec(
    `ls -la --time-style=long-iso "${safePath}" | tail -n +2`
  );
  if (result.exitCode !== 0) {
    throw new Error(`Failed to list directory: ${result.stderr}`);
  }

  const entries: FileEntry[] = [];
  for (const line of result.stdout.split("\n")) {
    if (!line.trim()) continue;

    // Parse ls -la output
    const parts = line.split(/\s+/);
    if (parts.length < 8) continue;

    const [permissions, , owner, group, sizeStr, date, time, ...nameParts] =
      parts;
    const name = nameParts.join(" ");
    if (name === "." || name === "..") continue;

    let type: "file" | "directory" | "symlink" = "file";
    if (permissions.startsWith("d")) type = "directory";
    if (permissions.startsWith("l")) type = "symlink";

    entries.push({
      name,
      path: path.join(safePath, name),
      type,
      size: parseInt(sizeStr) || 0,
      modified: `${date} ${time}`,
      permissions,
      owner,
      group,
    });
  }

  return entries;
}

export async function readFile(
  filePath: string,
  maxSize = 5 * 1024 * 1024
): Promise<FileContent> {
  const safePath = validatePath(filePath);

  const stats = await fs.stat(safePath);
  if (stats.size > maxSize) {
    throw new Error(
      `File too large: ${stats.size} bytes (max ${maxSize} bytes)`
    );
  }

  // Detect if binary
  const headResult = await shellExec(`file --mime-type "${safePath}"`);
  const mimeType =
    headResult.stdout.split(":").pop()?.trim() || "text/plain";
  const isBinary = !mimeType.startsWith("text/");

  if (isBinary) {
    return {
      content: "",
      encoding: "binary",
      size: stats.size,
      mimeType,
    };
  }

  const content = await fs.readFile(safePath, "utf-8");
  return {
    content,
    encoding: "utf-8",
    size: stats.size,
    mimeType,
  };
}

export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  const safePath = validatePath(filePath);
  await fs.writeFile(safePath, content, "utf-8");
}

export async function createDirectory(dirPath: string): Promise<void> {
  const safePath = validatePath(dirPath);
  await fs.mkdir(safePath, { recursive: true });
}

export async function deleteItem(itemPath: string): Promise<void> {
  const safePath = validatePath(itemPath);
  const stats = await fs.stat(safePath);

  if (stats.isDirectory()) {
    await fs.rm(safePath, { recursive: true });
  } else {
    await fs.unlink(safePath);
  }
}

export async function renameItem(
  oldPath: string,
  newPath: string
): Promise<void> {
  const safeOld = validatePath(oldPath);
  const safeNew = validatePath(newPath);
  await fs.rename(safeOld, safeNew);
}

export async function copyItem(
  srcPath: string,
  destPath: string
): Promise<void> {
  const safeSrc = validatePath(srcPath);
  const safeDest = validatePath(destPath);

  const stats = await fs.stat(safeSrc);
  if (stats.isDirectory()) {
    await shellExec(`cp -r "${safeSrc}" "${safeDest}"`);
  } else {
    await fs.copyFile(safeSrc, safeDest);
  }
}

export async function getPermissions(
  filePath: string
): Promise<{ numeric: string; symbolic: string }> {
  const safePath = validatePath(filePath);
  const result = await shellExec(`stat -c '%a %A' "${safePath}"`);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to get permissions: ${result.stderr}`);
  }

  const [numeric, symbolic] = result.stdout.split(" ");
  return { numeric, symbolic };
}

export async function setPermissions(
  filePath: string,
  mode: string,
  recursive = false
): Promise<void> {
  const safePath = validatePath(filePath);

  // Validate chmod mode
  if (!/^[0-7]{3,4}$/.test(mode)) {
    throw new Error(`Invalid chmod mode: ${mode}`);
  }

  const flag = recursive ? "-R" : "";
  const result = await shellExec(`chmod ${flag} ${mode} "${safePath}"`);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to set permissions: ${result.stderr}`);
  }
}

export async function setOwner(
  filePath: string,
  owner: string,
  group?: string,
  recursive = false
): Promise<void> {
  const safePath = validatePath(filePath);
  const ownerGroup = group ? `${owner}:${group}` : owner;
  const flag = recursive ? "-R" : "";

  const result = await shellSudo(`chown ${flag} ${ownerGroup} "${safePath}"`);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to set owner: ${result.stderr}`);
  }
}

async function shellSudo(cmd: string) {
  return shellExec(`sudo ${cmd}`);
}

export async function createZip(
  items: string[],
  outputPath: string
): Promise<string> {
  const safeItems = items.map(validatePath);
  const safeOutput = validatePath(outputPath);

  const result = await shellExec(
    `zip -r "${safeOutput}" ${safeItems.map((i) => `"${i}"`).join(" ")}`
  );
  if (result.exitCode !== 0) {
    throw new Error(`Failed to create zip: ${result.stderr}`);
  }
  return safeOutput;
}

export async function extractZip(
  zipPath: string,
  destPath: string
): Promise<void> {
  const safeZip = validatePath(zipPath);
  const safeDest = validatePath(destPath);

  const result = await shellExec(`unzip -o "${safeZip}" -d "${safeDest}"`);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to extract zip: ${result.stderr}`);
  }
}

export async function getDiskUsage(
  dirPath: string
): Promise<{ used: string; available: string; percentage: string }> {
  const safePath = validatePath(dirPath);
  const result = await shellExec(`df -h "${safePath}" | tail -1`);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to get disk usage: ${result.stderr}`);
  }

  const parts = result.stdout.split(/\s+/);
  return {
    used: parts[2] || "0",
    available: parts[3] || "0",
    percentage: parts[4] || "0%",
  };
}

export const fileManager = {
  listDirectory,
  readFile,
  writeFile,
  createDirectory,
  deleteItem,
  renameItem,
  copyItem,
  getPermissions,
  setPermissions,
  setOwner,
  createZip,
  extractZip,
  getDiskUsage,
};
