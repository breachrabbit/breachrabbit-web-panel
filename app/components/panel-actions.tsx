'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';

type ApiResult = {
  status: string;
  message: string;
  [key: string]: unknown;
};

async function callApi(url: string, options?: RequestInit): Promise<ApiResult> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    }
  });

  const data = (await response.json()) as ApiResult;
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export function PanelActions() {
  const [domain, setDomain] = useState('');
  const [createDemoSite, setCreateDemoSite] = useState(true);
  const [bindToPanel, setBindToPanel] = useState(true);
  const [issueCertificate, setIssueCertificate] = useState(true);
  const [database, setDatabase] = useState('');

  const [restartState, setRestartState] = useState<string>('Idle');
  const [domainState, setDomainState] = useState<string>('Idle');
  const [databaseState, setDatabaseState] = useState<string>('Idle');
  const [busy, setBusy] = useState<'restart' | 'domain' | 'database' | null>(null);

  const disabled = useMemo(() => busy !== null, [busy]);

  const handleRestart = async () => {
    setBusy('restart');
    setRestartState('Restart in progress...');

    try {
      const data = await callApi('/api/server/restart', {
        method: 'POST'
      });
      setRestartState(`${data.status.toUpperCase()}: ${data.message}`);
    } catch (error) {
      setRestartState(error instanceof Error ? error.message : 'Restart failed');
    } finally {
      setBusy(null);
    }
  };

  const handleCreateDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy('domain');
    setDomainState('Domain creation in progress...');

    try {
      const data = await callApi('/api/domains/create', {
        method: 'POST',
        body: JSON.stringify({ domain, createDemoSite, bindToPanel, issueCertificate })
      });

      setDomainState(`${data.status.toUpperCase()}: ${data.message}`);
      setDomain('');
    } catch (error) {
      setDomainState(error instanceof Error ? error.message : 'Domain creation failed');
    } finally {
      setBusy(null);
    }
  };

  const handleCreateDatabase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy('database');
    setDatabaseState('Database creation in progress...');

    try {
      const data = await callApi('/api/databases/create', {
        method: 'POST',
        body: JSON.stringify({ database })
      });

      setDatabaseState(`${data.status.toUpperCase()}: ${data.message}`);
      setDatabase('');
    } catch (error) {
      setDatabaseState(error instanceof Error ? error.message : 'Database creation failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <article className="card">
        <h2>Server actions</h2>
        <p>Run the configured restart command directly from the panel.</p>
        <button className="button" type="button" onClick={handleRestart} disabled={disabled}>
          {busy === 'restart' ? 'Restarting…' : 'Restart server'}
        </button>
        <p className="status">{restartState}</p>
      </article>

      <article className="card">
        <h2>Database management</h2>
        <p>Create database for a new project directly from panel.</p>

        <form onSubmit={handleCreateDatabase} className="stack">
          <label htmlFor="database" className="label-inline">
            Database name
          </label>
          <input
            id="database"
            value={database}
            onChange={(event) => setDatabase(event.target.value)}
            placeholder="project_db"
            className="input"
            required
          />

          <button className="button" type="submit" disabled={disabled}>
            {busy === 'database' ? 'Creating…' : 'Create database'}
          </button>
        </form>

        <p className="status">{databaseState}</p>
      </article>

      <article className="card">
        <h2>Add domain</h2>
        <p>
          Create domain config, optionally bind to panel with automatic certificate, and track it in
          domains registry.
        </p>

        <form onSubmit={handleCreateDomain} className="stack">
          <label htmlFor="domain" className="label-inline">
            Domain
          </label>
          <input
            id="domain"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="example.com"
            className="input"
            required
          />

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={bindToPanel}
              onChange={(event) => setBindToPanel(event.target.checked)}
            />
            Bind domain to panel (reverse proxy to panel)
          </label>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={issueCertificate}
              onChange={(event) => setIssueCertificate(event.target.checked)}
            />
            Issue Let&apos;s Encrypt certificate automatically
          </label>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={createDemoSite}
              onChange={(event) => setCreateDemoSite(event.target.checked)}
            />
            Create demo website for smoke test (for static mode)
          </label>

          <button className="button" type="submit" disabled={disabled}>
            {busy === 'domain' ? 'Creating…' : 'Add domain'}
          </button>
        </form>

        <p className="status">{domainState}</p>
        <p>
          <Link href="/domains" prefetch={false} className="linkInline">
            Open domains and certificates page →
          </Link>
        </p>
      </article>
    </>
  );
}
