import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type SystemCommandResult = {
  stdout: string;
  stderr: string;
};

export async function runSystemCommand(command: string, timeout = 30_000): Promise<SystemCommandResult> {
  const { stdout, stderr } = await execFileAsync('bash', ['-lc', command], { timeout });

  return {
    stdout: stdout.trim(),
    stderr: stderr.trim()
  };
}
