'use client';

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
  const [restartState, setRestartState] = useState<string>('Idle');
  const [domainState, setDomainState] = useState<string>('Idle');
  const [busy, setBusy] = useState<'restart' | 'domain' | null>(null);

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
        body: JSON.stringify({ domain, createDemoSite })
      });

      setDomainState(`${data.status.toUpperCase()}: ${data.message}`);
      setDomain('');
    } catch (error) {
      setDomainState(error instanceof Error ? error.message : 'Domain creation failed');
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
        <h2>Add domain</h2>
        <p>Create domain config and an optional demo site to verify deployment.</p>

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
              checked={createDemoSite}
              onChange={(event) => setCreateDemoSite(event.target.checked)}
            />
            Create demo website for smoke test
          </label>

          <button className="button" type="submit" disabled={disabled}>
            {busy === 'domain' ? 'Creating…' : 'Add domain'}
          </button>
        </form>

        <p className="status">{domainState}</p>
      </article>
    </>
  );
}
