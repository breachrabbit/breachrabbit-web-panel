import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_CHANGES_ALLOWED } from '@/app/lib/panel-config';

const execFileAsync = promisify(execFile);

function parseRedisDatabase(input: string) {
  if (!/^\d+$/.test(input)) {
    return null;
  }

  const parsed = Number.parseInt(input, 10);
  if (parsed < 0 || parsed > 15) {
    return null;
  }

  return parsed;
}

function parseTtlSeconds(input: string) {
  const raw = input.trim();
  if (!raw) {
    return null;
  }

  if (!/^\d+$/.test(raw)) {
    return Number.NaN;
  }

  const parsed = Number.parseInt(raw, 10);
  if (parsed <= 0) {
    return Number.NaN;
  }

  return parsed;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { database?: string; key?: string; value?: string; ttlSeconds?: string }
    | null;

  const redisDb = parseRedisDatabase((body?.database ?? '0').trim());
  const key = (body?.key ?? '').trim();
  const value = body?.value ?? '';
  const ttlSeconds = parseTtlSeconds(body?.ttlSeconds ?? '');

  if (redisDb === null) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Redis database index must be a number from 0 to 15.'
      },
      { status: 400 }
    );
  }

  if (!key) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Redis key is required.'
      },
      { status: 400 }
    );
  }

  if (Number.isNaN(ttlSeconds)) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'TTL must be a positive integer number of seconds.'
      },
      { status: 400 }
    );
  }

  const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379/0';

  if (!SYSTEM_CHANGES_ALLOWED) {
    return NextResponse.json({
      status: 'dry-run',
      message:
        'System actions are disabled. Set PANEL_ALLOW_SYSTEM_CHANGES=true to execute Redis writes.',
      command:
        ttlSeconds === null
          ? `redis-cli -n ${redisDb} SET ${JSON.stringify(key)} ${JSON.stringify(value)}`
          : `redis-cli -n ${redisDb} SET ${JSON.stringify(key)} ${JSON.stringify(value)} EX ${ttlSeconds}`
    });
  }

  try {
    const parsed = new URL(redisUrl);
    if (!['redis:', 'rediss:'].includes(parsed.protocol)) {
      throw new Error('REDIS_URL must use redis:// or rediss:// protocol.');
    }

    const args = ['-h', parsed.hostname || '127.0.0.1', '-p', parsed.port || '6379'];

    if (parsed.password) {
      args.push('-a', parsed.password);
    }

    args.push('-n', String(redisDb), 'SET', key, value);

    if (ttlSeconds !== null) {
      args.push('EX', String(ttlSeconds));
    }

    const { stdout } = await execFileAsync('redis-cli', args, { timeout: 30_000 });

    return NextResponse.json({
      status: 'ok',
      message:
        ttlSeconds === null
          ? `Redis key ${key} saved in DB${redisDb}.`
          : `Redis key ${key} saved in DB${redisDb} with TTL ${ttlSeconds}s.`,
      output: stdout.trim()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Redis key write failed'
      },
      { status: 500 }
    );
  }
}
