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

type DbTab = 'mysql' | 'redis';

export function PanelActions() {
  const [activeDbTab, setActiveDbTab] = useState<DbTab>('mysql');

  const [domain, setDomain] = useState('');
  const [createDemoSite, setCreateDemoSite] = useState(true);
  const [bindToPanel, setBindToPanel] = useState(false);
  const [issueCertificate, setIssueCertificate] = useState(true);
  const [panelDomain, setPanelDomain] = useState('');
  const [panelDomainCertificate, setPanelDomainCertificate] = useState(true);

  const [database, setDatabase] = useState('');
  const [databasePassword, setDatabasePassword] = useState('');
  const [mysqlRootPassword, setMysqlRootPassword] = useState('');

  const [redisDb, setRedisDb] = useState('0');
  const [redisKey, setRedisKey] = useState('');
  const [redisValue, setRedisValue] = useState('');
  const [redisTtl, setRedisTtl] = useState('');

  const [restartState, setRestartState] = useState<string>('Idle');
  const [domainState, setDomainState] = useState<string>('Idle');
  const [panelDomainState, setPanelDomainState] = useState<string>('Idle');
  const [databaseState, setDatabaseState] = useState<string>('Idle');
  const [rootPasswordState, setRootPasswordState] = useState<string>('Idle');
  const [redisState, setRedisState] = useState<string>('Idle');
  const [busy, setBusy] = useState<
    'restart' | 'domain' | 'panel-domain' | 'database' | 'root-password' | 'redis' | null
  >(null);

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

  const handleConfigurePanelDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy('panel-domain');
    setPanelDomainState('Panel domain setup in progress...');

    try {
      const data = await callApi('/api/panel/domain', {
        method: 'POST',
        body: JSON.stringify({ domain: panelDomain, issueCertificate: panelDomainCertificate })
      });

      setPanelDomainState(`${data.status.toUpperCase()}: ${data.message}`);
    } catch (error) {
      setPanelDomainState(error instanceof Error ? error.message : 'Panel domain setup failed');
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
        body: JSON.stringify({ database, password: databasePassword })
      });

      setDatabaseState(`${data.status.toUpperCase()}: ${data.message}`);
      setDatabase('');
    } catch (error) {
      setDatabaseState(error instanceof Error ? error.message : 'Database creation failed');
    } finally {
      setBusy(null);
    }
  };

  const handleChangeRootPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy('root-password');
    setRootPasswordState('Root password update in progress...');

    try {
      const data = await callApi('/api/databases/root-password', {
        method: 'POST',
        body: JSON.stringify({ password: mysqlRootPassword })
      });

      setRootPasswordState(`${data.status.toUpperCase()}: ${data.message}`);
      setMysqlRootPassword('');
    } catch (error) {
      setRootPasswordState(error instanceof Error ? error.message : 'Root password update failed');
    } finally {
      setBusy(null);
    }
  };

  const handleSetRedisKey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy('redis');
    setRedisState('Redis key update in progress...');

    try {
      const data = await callApi('/api/redis/keys', {
        method: 'POST',
        body: JSON.stringify({
          database: redisDb,
          key: redisKey,
          value: redisValue,
          ttlSeconds: redisTtl
        })
      });

      setRedisState(`${data.status.toUpperCase()}: ${data.message}`);
      setRedisKey('');
      setRedisValue('');
      setRedisTtl('');
    } catch (error) {
      setRedisState(error instanceof Error ? error.message : 'Redis key update failed');
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

      <article className="card dbCard">
        <h2>Database management</h2>
        <p>Create MySQL databases or manage Redis keys from dedicated tabs.</p>

        <div className="tabRow" role="tablist" aria-label="Database manager tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeDbTab === 'mysql'}
            className={`tabButton ${activeDbTab === 'mysql' ? 'active' : ''}`}
            onClick={() => setActiveDbTab('mysql')}
          >
            MySQL
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeDbTab === 'redis'}
            className={`tabButton ${activeDbTab === 'redis' ? 'active' : ''}`}
            onClick={() => setActiveDbTab('redis')}
          >
            Redis
          </button>
        </div>

        {activeDbTab === 'mysql' ? (
          <div className="stack">
            <div className="toolbarRow">
              <a className="button" href="/adminer/" target="_blank" rel="noreferrer">
                Open Adminer
              </a>
            </div>

            <form onSubmit={handleCreateDatabase} className="stack tabPanel">
              <h3>Create MySQL database</h3>
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

              <label htmlFor="database-password" className="label-inline">
                MySQL password (optional override)
              </label>
              <input
                id="database-password"
                type="password"
                value={databasePassword}
                onChange={(event) => setDatabasePassword(event.target.value)}
                placeholder="Use current DB_PASSWORD if empty"
                className="input"
              />

              <button className="button" type="submit" disabled={disabled}>
                {busy === 'database' ? 'Creating…' : 'Add DB'}
              </button>
              <p className="status">{databaseState}</p>
            </form>

            <form onSubmit={handleChangeRootPassword} className="stack tabPanel">
              <h3>MySQL root password</h3>
              <label htmlFor="mysql-root-password" className="label-inline">
                New root password
              </label>
              <input
                id="mysql-root-password"
                type="text"
                value={mysqlRootPassword}
                onChange={(event) => setMysqlRootPassword(event.target.value)}
                placeholder="Enter new password"
                className="input"
                required
              />

              <button className="button" type="submit" disabled={disabled}>
                {busy === 'root-password' ? 'Updating…' : 'Change root password'}
              </button>
              <p className="status">{rootPasswordState}</p>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSetRedisKey} className="stack tabPanel">
            <h3>Redis key manager</h3>
            <label htmlFor="redis-db" className="label-inline">
              Redis DB index
            </label>
            <input
              id="redis-db"
              value={redisDb}
              onChange={(event) => setRedisDb(event.target.value)}
              placeholder="0"
              className="input"
              required
            />

            <label htmlFor="redis-key" className="label-inline">
              Key
            </label>
            <input
              id="redis-key"
              value={redisKey}
              onChange={(event) => setRedisKey(event.target.value)}
              placeholder="session:token"
              className="input"
              required
            />

            <label htmlFor="redis-value" className="label-inline">
              Value
            </label>
            <input
              id="redis-value"
              value={redisValue}
              onChange={(event) => setRedisValue(event.target.value)}
              placeholder="payload"
              className="input"
              required
            />

            <label htmlFor="redis-ttl" className="label-inline">
              TTL in seconds (optional)
            </label>
            <input
              id="redis-ttl"
              value={redisTtl}
              onChange={(event) => setRedisTtl(event.target.value)}
              placeholder="3600"
              className="input"
            />

            <button className="button" type="submit" disabled={disabled}>
              {busy === 'redis' ? 'Saving…' : 'Add key'}
            </button>
            <p className="status">{redisState}</p>
          </form>
        )}
      </article>

      <article className="card dbCard">
        <h2>Tools embedded in panel</h2>
        <p>
          Open Adminer and FileBrowser directly inside panel via iframe. If one panel domain returns
          404 for direct links, use panel domain setup below.
        </p>
        <div className="toolGrid">
          <section className="stack">
            <h3>Adminer</h3>
            <iframe title="Adminer" src="/adminer/" className="toolFrame" loading="lazy" />
          </section>
          <section className="stack">
            <h3>FileBrowser</h3>
            <iframe title="FileBrowser" src="/files/" className="toolFrame" loading="lazy" />
          </section>
        </div>
      </article>

      <article className="card">
        <h2>Panel domain access</h2>
        <p>
          Configure the main panel domain separately (nginx server_name + optional Let&apos;s Encrypt).
        </p>

        <form onSubmit={handleConfigurePanelDomain} className="stack">
          <label htmlFor="panel-domain" className="label-inline">
            Panel domain
          </label>
          <input
            id="panel-domain"
            value={panelDomain}
            onChange={(event) => setPanelDomain(event.target.value)}
            placeholder="panel.example.com"
            className="input"
            required
          />

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={panelDomainCertificate}
              onChange={(event) => setPanelDomainCertificate(event.target.checked)}
            />
            Issue Let&apos;s Encrypt certificate for panel domain
          </label>

          <button className="button" type="submit" disabled={disabled}>
            {busy === 'panel-domain' ? 'Applying…' : 'Save panel domain'}
          </button>
        </form>

        <p className="status">{panelDomainState}</p>
      </article>

      <article className="card">
        <h2>Add domain</h2>
        <p>
          Create domain config, create a test site folder by default, optionally bind domain to the
          panel, and track certificate status in registry.
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
