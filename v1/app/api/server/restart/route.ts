import { NextResponse } from 'next/server';
import { RESTART_COMMAND, SYSTEM_CHANGES_ALLOWED } from '@/app/lib/panel-config';
import { runSystemCommand } from '@/app/lib/system-command';

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
    const { stdout, stderr } = await runSystemCommand(RESTART_COMMAND, 60_000);

    return NextResponse.json({
      status: 'ok',
      command: RESTART_COMMAND,
      stdout,
      stderr,
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
