import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { SITE_ROOT } from '@/app/lib/panel-config';

type FileItem = {
  name: string;
  relativePath: string;
  kind: 'file' | 'directory';
  size: number;
  updatedAt: string;
};

export const dynamic = 'force-dynamic';

function safeRelativePath(input: string) {
  return input.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '');
}

function resolveInsideRoot(relativePath: string) {
  const root = resolve(SITE_ROOT);
  const requestedPath = resolve(root, relativePath || '.');

  if (requestedPath !== root && !requestedPath.startsWith(`${root}${sep}`)) {
    throw new Error('Path escapes the allowed root directory.');
  }

  return { root, requestedPath };
}

export async function GET(request: NextRequest) {
  const relativePath = safeRelativePath(request.nextUrl.searchParams.get('path') ?? '');
  const download = request.nextUrl.searchParams.get('download') === '1';

  let root: string;
  let requestedPath: string;

  try {
    ({ root, requestedPath } = resolveInsideRoot(relativePath));
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Invalid path.'
      },
      { status: 400 }
    );
  }

  try {
    const info = await stat(requestedPath);

    if (download) {
      if (!info.isFile()) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Download is supported for files only.'
          },
          { status: 400 }
        );
      }

      const data = await readFile(requestedPath);
      const filename = requestedPath.split(sep).pop() ?? 'file.bin';

      return new NextResponse(data, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    if (!info.isDirectory()) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Target path is not a directory.'
        },
        { status: 400 }
      );
    }

    const entries = await readdir(requestedPath, { withFileTypes: true });
    const items: FileItem[] = [];

    for (const entry of entries) {
      const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const childPath = resolve(root, childRelativePath);
      const childStat = await stat(childPath);

      items.push({
        name: entry.name,
        relativePath: childRelativePath,
        kind: entry.isDirectory() ? 'directory' : 'file',
        size: childStat.size,
        updatedAt: childStat.mtime.toISOString()
      });
    }

    items.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      status: 'ok',
      root,
      currentPath: relativePath,
      count: items.length,
      items
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to read files.'
      },
      { status: 500 }
    );
  }
}
