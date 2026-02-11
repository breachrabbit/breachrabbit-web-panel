export const dynamic = 'force-dynamic';

import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { NextRequest, NextResponse } from 'next/server';

const execFileAsync = promisify(execFile);

type LogSection = 'ols' | 'nginx' | 'php' | 'system' | 'auth';
type LogLevel = 'info' | 'warning' | 'error';

type ParsedLogEntry = {
  source: string;
  line: string;
  level: LogLevel;
};

const BASE_LOG_SOURCES: Record<Exclude<LogSection, 'php'>, string[]> = {
  ols: ['/usr/local/lsws/logs/access.log', '/usr/local/lsws/logs/error.log'],
  nginx: ['/var/log/nginx/access.log', '/var/log/nginx/error.log'],
  system: ['/var/log/syslog'],
  auth: ['/var/log/auth.log']
};

const SUPPORTED_SECTIONS: LogSection[] = ['ols', 'nginx', 'php', 'system', 'auth'];

function normalizeSection(value: string | null): LogSection {
  if (value && SUPPORTED_SECTIONS.includes(value as LogSection)) {
    return value as LogSection;
  }

  return 'ols';
}

function normalizeLevel(value: string | null): LogLevel | 'all' {
  if (value === 'info' || value === 'warning' || value === 'error') {
    return value;
  }

  return 'all';
}

function normalizeLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? '250', 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 250;
  }

  return Math.min(parsed, 1000);
}

function detectLevel(line: string): LogLevel {
  if (/\b(error|crit|alert|emerg|fatal|failed|failure)\b/i.test(line)) {
    return 'error';
  }

  if (/\b(warn|warning|deprecated|retry)\b/i.test(line)) {
    return 'warning';
  }

  return 'info';
}

async function resolvePhpLogs() {
  const candidates: string[] = [];

  try {
    const files = await readdir('/var/log');
    for (const file of files) {
      if (/^php[\d.\-]*fpm\.log$/i.test(file)) {
        candidates.push(`/var/log/${file}`);
      }
    }
  } catch {
    // noop: keep fallback below
  }

  if (candidates.length > 0) {
    return candidates;
  }

  return ['/var/log/php-fpm.log', '/var/log/php8.1-fpm.log', '/var/log/php8.2-fpm.log'];
}

async function resolveSources(section: LogSection) {
  if (section === 'php') {
    return resolvePhpLogs();
  }

  return BASE_LOG_SOURCES[section as Exclude<LogSection, 'php'>];
}

async function tailFile(path: string, lines: number) {
  try {
    const { stdout } = await execFileAsync('tail', ['-n', String(lines), path]);
    return stdout;
  } catch {
    return '';
  }
}

function normalizeRawLines(rawText: string) {
  return rawText
    .split(/\n|\\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.toLowerCase() !== 'level\tsource\tmessage');
}

function parsePossiblyStructuredLine(source: string, line: string): ParsedLogEntry {
  const parts = line.split('\t');

  if (parts.length >= 3) {
    const possibleLevel = parts[0].trim().toLowerCase();
    const possibleSource = parts[1].trim();
    const possibleMessage = parts.slice(2).join('\t').trim();

    if (
      (possibleLevel === 'info' || possibleLevel === 'warning' || possibleLevel === 'error') &&
      possibleSource.length > 0 &&
      possibleMessage.length > 0
    ) {
      return {
        source: possibleSource,
        line: possibleMessage,
        level: possibleLevel
      };
    }
  }

  return {
    source,
    line,
    level: detectLevel(line)
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const section = normalizeSection(params.get('section'));
  const levelFilter = normalizeLevel(params.get('level'));
  const search = (params.get('search') ?? '').trim().toLowerCase();
  const limit = normalizeLimit(params.get('limit'));

  const sources = await resolveSources(section);
  const rawLogs = await Promise.all(sources.map(async (source) => ({ source, text: await tailFile(source, limit) })));

  const entries = rawLogs
    .flatMap(({ source, text }) =>
      normalizeRawLines(text).map((line) => parsePossiblyStructuredLine(source, line))
    )
    .filter((entry) => (levelFilter === 'all' ? true : entry.level === levelFilter))
    .filter((entry) => {
      if (!search) {
        return true;
      }

      return `${entry.source} ${entry.line}`.toLowerCase().includes(search);
    })
    .slice(-limit)
    .reverse();

  return NextResponse.json({
    status: 'ok',
    section,
    total: entries.length,
    level: levelFilter,
    search,
    limit,
    sources,
    entries,
    unavailableSources: rawLogs.filter((item) => item.text.length === 0).map((item) => item.source),
    generatedAt: new Date().toISOString()
  });
}
