export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { readdir, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { SITE_ROOT } from '@/app/lib/panel-config';

type Item = {
  name: string;
  relativePath: string;
  kind: 'file' | 'directory';
  size: number;
  updatedAt: string;
};

function cleanPath(input: string | string[] | undefined) {
  const raw = Array.isArray(input) ? input[0] : input ?? '';
  return raw.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '');
}

function resolveSafePath(relativePath: string) {
  const root = resolve(SITE_ROOT);
  const requestedPath = resolve(root, relativePath || '.');

  if (requestedPath !== root && !requestedPath.startsWith(`${root}${sep}`)) {
    throw new Error('Invalid path');
  }

  return { root, requestedPath };
}

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parentPath(path: string) {
  if (!path) {
    return '';
  }

  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
}

export default async function FilesPage({
  searchParams
}: {
  searchParams?: { path?: string };
}) {
  const currentPath = cleanPath(searchParams?.path);

  let root = resolve(SITE_ROOT);
  let items: Item[] = [];
  let error: string | null = null;

  try {
    const resolved = resolveSafePath(currentPath);
    root = resolved.root;

    const targetStat = await stat(resolved.requestedPath);
    if (!targetStat.isDirectory()) {
      throw new Error('Выбранный путь не является директорией.');
    }

    const entries = await readdir(resolved.requestedPath, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      const childPath = resolve(root, relativePath);
      const childStat = await stat(childPath);

      items.push({
        name: entry.name,
        relativePath,
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
  } catch (e) {
    error = e instanceof Error ? e.message : 'Не удалось открыть директорию.';
  }

  return (
    <main className="container">
      <section className="hero">
        <p className="label">BreachRabbit</p>
        <h1>Файловый менеджер</h1>
        <p>Встроенный просмотр файлов в корневой папке сайтов панели.</p>
        <p>
          <Link className="button" href="/">
            ← Назад в панель
          </Link>
        </p>
      </section>

      <section className="card">
        <h2>Текущий путь</h2>
        <p>
          <code>{root}</code>
          {currentPath ? ` / ${currentPath}` : ''}
        </p>
        {currentPath ? (
          <p>
            <Link className="linkInline" href={`/files?path=${encodeURIComponent(parentPath(currentPath))}`}>
              ↑ На уровень выше
            </Link>
          </p>
        ) : null}
      </section>

      <section className="card">
        <h2>Содержимое</h2>

        {error ? (
          <p className="status">Ошибка: {error}</p>
        ) : items.length === 0 ? (
          <p className="status">Папка пустая.</p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Тип</th>
                  <th>Размер</th>
                  <th>Изменен</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.relativePath}>
                    <td>{item.name}</td>
                    <td>{item.kind === 'directory' ? 'Папка' : 'Файл'}</td>
                    <td>{item.kind === 'directory' ? '—' : formatSize(item.size)}</td>
                    <td>{formatDate(item.updatedAt)}</td>
                    <td>
                      {item.kind === 'directory' ? (
                        <Link className="linkInline" href={`/files?path=${encodeURIComponent(item.relativePath)}`}>
                          Открыть
                        </Link>
                      ) : (
                        <a
                          className="linkInline"
                          href={`/api/files?path=${encodeURIComponent(item.relativePath)}&download=1`}
                        >
                          Скачать
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
