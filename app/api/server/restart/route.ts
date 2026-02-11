import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

const execFileAsync = promisify(execFile);

const RESTART_COMMAND = process.env.PANEL_RESTART_COMMAND ?? 'systemctl restart breachrabbit-panel';
const SYSTEM_CHANGES_ALLOWED = process.env.PANEL_ALLOW_SYSTEM_CHANGES === 'true';

function commandParts(command: string) {
  const parts = command.trim().split(/\s+/);
  return {
    bin: parts[0],
    args: parts.slice(1)
  };
}

export async function POST() {
  if (!SYSTEM_CHANGES_ALLOWED) {
    return NextResponse.json({
      status: 'dry-run',
      message:
        'System actions are disabled. Set PANEL_ALLOW_SYSTEM_CHANGES=true to execute restart commands.',
      command: RESTART_COMMAND
    });
  }

  try {
    const { bin, args } = commandParts(RESTART_COMMAND);
    const { stdout, stderr } = await execFileAsync(bin, args, { timeout: 30_000 });

    return NextResponse.json({
      status: 'ok',
      command: RESTART_COMMAND,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      message: 'Server restart command executed.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown restart error';
    return NextResponse.json(
      {
        status: 'error',
        command: RESTART_COMMAND,
        message
      },
      { status: 500 }
    );
  }
}
