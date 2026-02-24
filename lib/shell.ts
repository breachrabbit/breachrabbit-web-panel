import { exec, execFile, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Blocked commands that should never be executed
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\/(?!\w)/, // rm -rf /
  /mkfs\./,
  /dd\s+if=.*of=\/dev/,
  /:(){ :\|:& };:/,  // fork bomb
  />\s*\/dev\/sd/,
  /chmod\s+-R\s+777\s+\//,
];

function validateCommand(command: string): void {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`Blocked dangerous command pattern: ${command}`);
    }
  }
}

/**
 * Execute a shell command safely with timeout
 */
export async function shellExec(
  command: string,
  options: {
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
  } = {}
): Promise<ShellResult> {
  validateCommand(command);

  const { timeout = 30000, cwd, env } = options;

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      cwd,
      env: env ? { ...process.env, ...env } : process.env,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.trim() || "",
      stderr: error.stderr?.trim() || error.message,
      exitCode: error.code ?? 1,
    };
  }
}

/**
 * Execute a command with arguments (safer, no shell interpolation)
 */
export async function shellExecFile(
  file: string,
  args: string[] = [],
  options: {
    timeout?: number;
    cwd?: string;
  } = {}
): Promise<ShellResult> {
  const { timeout = 30000, cwd } = options;

  try {
    const { stdout, stderr } = await execFileAsync(file, args, {
      timeout,
      cwd,
      maxBuffer: 10 * 1024 * 1024,
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.trim() || "",
      stderr: error.stderr?.trim() || error.message,
      exitCode: error.code ?? 1,
    };
  }
}

/**
 * Stream command output via callback (for live terminal, install progress, etc.)
 */
export function shellStream(
  command: string,
  args: string[] = [],
  onData: (data: string) => void,
  options: {
    cwd?: string;
    env?: Record<string, string>;
  } = {}
): { kill: () => void; exitPromise: Promise<number> } {
  const proc = spawn(command, args, {
    cwd: options.cwd,
    env: options.env ? { ...process.env, ...options.env } : process.env,
    shell: false,
  });

  proc.stdout?.on("data", (chunk) => onData(chunk.toString()));
  proc.stderr?.on("data", (chunk) => onData(chunk.toString()));

  const exitPromise = new Promise<number>((resolve) => {
    proc.on("close", (code) => resolve(code ?? 1));
    proc.on("error", () => resolve(1));
  });

  return {
    kill: () => proc.kill("SIGTERM"),
    exitPromise,
  };
}

/**
 * Run a command as sudo (for system operations)
 */
export async function shellSudo(
  command: string,
  options: { timeout?: number } = {}
): Promise<ShellResult> {
  return shellExec(`sudo ${command}`, options);
}
