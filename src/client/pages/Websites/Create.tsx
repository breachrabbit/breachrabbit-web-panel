import { FormEvent, useMemo, useState } from 'react';
import { CreateSitePayload, SiteType, createSite } from '../../services/sitesApi';

const initialForm: CreateSitePayload = {
  domain: '',
  siteType: 'php',
  phpVersion: '8.2',
  rootPath: '/var/www/html',
  proxyTarget: '',
  sslEnabled: true
};

export function WebsitesCreatePage(): JSX.Element {
  const [form, setForm] = useState<CreateSitePayload>(initialForm);
  const [status, setStatus] = useState<string>('');
  const isProxy = useMemo(() => form.siteType === 'proxy', [form.siteType]);
  const isPhp = useMemo(() => form.siteType === 'php', [form.siteType]);

  const setSiteType = (siteType: SiteType) => setForm((prev) => ({ ...prev, siteType }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('Creating...');

    try {
      await createSite(form);
      setStatus('Site created successfully');
      setForm(initialForm);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create site');
    }
  };

  return (
    <section>
      <h1>Websites → Create</h1>
      <form onSubmit={onSubmit}>
        <label>
          Domain
          <input value={form.domain} onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))} required />
        </label>

        <label>
          Site Type
          <select value={form.siteType} onChange={(e) => setSiteType(e.target.value as SiteType)}>
            <option value="php">PHP</option>
            <option value="static">Static</option>
            <option value="proxy">Reverse Proxy</option>
          </select>
        </label>

        {isPhp && (
          <label>
            PHP Version
            <input value={form.phpVersion ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, phpVersion: e.target.value }))} required />
          </label>
        )}

        {!isProxy && (
          <label>
            Document Root
            <input value={form.rootPath ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, rootPath: e.target.value }))} required />
          </label>
        )}

        {isProxy && (
          <label>
            Proxy Target
            <input value={form.proxyTarget ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, proxyTarget: e.target.value }))} placeholder="http://127.0.0.1:3000" required />
          </label>
        )}

        <label>
          <input
            type="checkbox"
            checked={form.sslEnabled}
            onChange={(e) => setForm((prev) => ({ ...prev, sslEnabled: e.target.checked }))}
          />
          Enable SSL
        </label>

        <button type="submit">Create Site</button>
      </form>

      {status && <p>{status}</p>}
    </section>
  );
}

export default WebsitesCreatePage;
