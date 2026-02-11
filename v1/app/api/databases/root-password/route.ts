import { readFile, writeFile } from 'node:fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { PANEL_ENV_FILE_PATH, SYSTEM_CHANGES_ALLOWED } from '@/app/lib/panel-config';
import { runMysqlCli } from '@/app/lib/mysql-cli';

function escapeSqlString(input: string) {
  return input.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function updateEnvDbPassword(password: string) {
  const existing = await readFile(PANEL_ENV_FILE_PATH, 'utf8').catch(() => '');

  if (!existing.trim()) {
    return;
  }

  const hasDbPassword = /^DB_PASSWORD=/m.test(existing);
  const next = hasDbPassword
    ? existing.replace(/^DB_PASSWORD=.*$/m, `DB_PASSWORD=${password}`)
    : `${existing.trimEnd()}\nDB_PASSWORD=${password}\n`;

  await writeFile(PANEL_ENV_FILE_PATH, next, 'utf8');
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = (body?.password ?? '').trim();

  if (password.length < 8) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Password must be at least 8 characters.'
      },
      { status: 400 }
    );
  }

  if (!SYSTEM_CHANGES_ALLOWED) {
    return NextResponse.json({
      status: 'dry-run',
      message:
        'System actions are disabled. Set PANEL_ALLOW_SYSTEM_CHANGES=true to update MariaDB/MySQL users.',
      sql: "ALTER USER 'root'@'localhost' IDENTIFIED BY '********'; FLUSH PRIVILEGES;"
    });
  }

  const dbHost = process.env.DB_HOST ?? '127.0.0.1';
  const dbPort = process.env.DB_PORT ?? '3306';
  const dbUser = process.env.DB_USER ?? 'root';
  const dbPassword = process.env.DB_PASSWORD ?? '';

  const escapedPassword = escapeSqlString(password);
  const sql = `ALTER USER 'root'@'localhost' IDENTIFIED BY '${escapedPassword}'; FLUSH PRIVILEGES;`;

  try {
    await runMysqlCli(
      ['-h', dbHost, '-P', dbPort, '-u', dbUser, ...(dbPassword ? [`-p${dbPassword}`] : []), '-e', sql],
      30_000
    );

    await updateEnvDbPassword(password);

    return NextResponse.json({
      status: 'ok',
      message: 'MySQL root password updated for root@localhost and synced to panel .env.',
      authMode: 'tcp'
    });
  } catch {
    try {
      await runMysqlCli(['--protocol=socket', '-u', 'root', '-e', sql], 30_000);
      await updateEnvDbPassword(password);

      return NextResponse.json({
        status: 'ok',
        message: 'MySQL root password updated via socket auth and synced to panel .env.',
        authMode: 'socket'
      });
    } catch (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: error instanceof Error ? error.message : 'Root password update failed'
        },
        { status: 500 }
      );
    }
  }
}
