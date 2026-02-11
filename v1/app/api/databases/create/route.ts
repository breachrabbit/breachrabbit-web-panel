import { NextRequest, NextResponse } from 'next/server';
import { DATABASE_PATTERN, SYSTEM_CHANGES_ALLOWED } from '@/app/lib/panel-config';
import { runMysqlCli } from '@/app/lib/mysql-cli';

function normalizeDbName(input: string) {
  return input.trim();
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        database?: string;
        password?: string;
      }
    | null;
  const database = normalizeDbName(body?.database ?? '');

  if (!DATABASE_PATTERN.test(database)) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Invalid database name. Use letters, numbers and underscores, max 63 chars.'
      },
      { status: 400 }
    );
  }

  if (!SYSTEM_CHANGES_ALLOWED) {
    return NextResponse.json({
      status: 'dry-run',
      message:
        'System actions are disabled. Set PANEL_ALLOW_SYSTEM_CHANGES=true to execute SQL changes.',
      sql: `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    });
  }

  const dbHost = process.env.DB_HOST ?? '127.0.0.1';
  const dbPort = process.env.DB_PORT ?? '3306';
  const dbUser = process.env.DB_USER ?? 'root';
  const dbPassword = (body?.password ?? process.env.DB_PASSWORD ?? '').trim();

  const sql = `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;

  try {
    await runMysqlCli(
      ['-h', dbHost, '-P', dbPort, '-u', dbUser, ...(dbPassword ? [`-p${dbPassword}`] : []), '-e', sql],
      30_000
    );

    return NextResponse.json({
      status: 'ok',
      message: `Database ${database} created or already exists.`,
      database,
      authMode: 'tcp'
    });
  } catch (error) {
    if (dbUser === 'root') {
      try {
        await runMysqlCli(
          ['--protocol=socket', '-u', 'root', ...(dbPassword ? [`-p${dbPassword}`] : []), '-e', sql],
          30_000
        );

        return NextResponse.json({
          status: 'ok',
          message: `Database ${database} created using socket auth fallback.`,
          database,
          authMode: 'socket'
        });
      } catch (fallbackError) {
        return NextResponse.json(
          {
            status: 'error',
            message: fallbackError instanceof Error ? fallbackError.message : 'Database creation failed'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Database creation failed'
      },
      { status: 500 }
    );
  }
}
