'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type LogSection = 'ols' | 'nginx' | 'php' | 'system' | 'auth';
type LevelFilter = 'all' | 'info' | 'warning' | 'error';

type LogEntry = {
  source: string;
  line: string;
  level: 'info' | 'warning' | 'error';
};

type LogsResponse = {
  status: string;
  total: number;
  generatedAt: string;
  entries: LogEntry[];
  unavailableSources: string[];
};

const sections: { value: LogSection; label: string }[] = [
  { value: 'ols', label: 'OLS access/error' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'php', label: 'PHP' },
  { value: 'system', label: 'System' },
  { value: 'auth', label: 'Auth' }
];

export function LogsExplorer() {
  const [section, setSection] = useState<LogSection>('ols');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [limit, setLimit] = useState('250');

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [generatedAt, setGeneratedAt] = useState('');
  const [unavailableSources, setUnavailableSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({
      section,
      level,
      limit
    });

    if (search.trim()) {
      params.set('search', search.trim());
    }

    return params.toString();
  }, [limit, level, search, section]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/logs?${query}`, { cache: 'no-store' });
      const data = (await response.json()) as LogsResponse;

      if (!response.ok) {
        throw new Error('Failed to load logs.');
      }

      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
      setGeneratedAt(data.generatedAt ?? '');
      setUnavailableSources(data.unavailableSources ?? []);
    } catch (fetchError) {
      setEntries([]);
      setTotal(0);
      setUnavailableSources([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return (
    <article className="card logsCard">
      <h2>Logs</h2>
      <p>Use sections, search and level filter to quickly diagnose runtime issues.</p>

      <div className="logSectionTabs">
        {sections.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`tabButton ${section === item.value ? 'active' : ''}`}
            onClick={() => setSection(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="logsToolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search in log message or file"
          className="input"
        />

        <select className="input" value={level} onChange={(event) => setLevel(event.target.value as LevelFilter)}>
          <option value="all">All levels</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        <select className="input" value={limit} onChange={(event) => setLimit(event.target.value)}>
          <option value="100">100 lines</option>
          <option value="250">250 lines</option>
          <option value="500">500 lines</option>
        </select>

        <button className="button" type="button" onClick={() => void fetchLogs()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error ? <p className="status">{error}</p> : null}
      {!error && unavailableSources.length > 0 ? (
        <p className="status">Unavailable sources: {unavailableSources.join(', ')}</p>
      ) : null}

      <p className="status">
        Found: {total} {generatedAt ? `• Updated: ${new Date(generatedAt).toLocaleString()}` : ''}
      </p>

      <div className="tableWrap logsTableWrap">
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th>Source</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={3}>No log lines for selected filters.</td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr key={`${entry.source}-${index}`}>
                  <td>
                    <span className={`logLevel logLevel-${entry.level}`}>{entry.level}</span>
                  </td>
                  <td>{entry.source}</td>
                  <td className="logMessage">{entry.line}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
