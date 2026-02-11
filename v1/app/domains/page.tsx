export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { readDomainRegistry } from '@/app/lib/domain-registry';

function formatDate(input: string | null) {
  if (!input) {
    return '—';
  }

  return new Date(input).toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function ageInDays(isoDate: string | null) {
  if (!isoDate) {
    return '—';
  }

  const diff = Date.now() - new Date(isoDate).getTime();
  return `${Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))} days`;
}

export default async function DomainsPage() {
  const domains = await readDomainRegistry();

  return (
    <main className="container">
      <section className="hero">
        <p className="label">BreachRabbit</p>
        <h1>Domains and certificates</h1>
        <p>Registry of configured domains, certificate status, issue date, and certificate age.</p>
        <p>
          <Link className="button" href="/">
            Back to panel
          </Link>
        </p>
      </section>

      <section className="card">
        <h2>Managed domains</h2>

        {domains.length === 0 ? (
          <p className="status">No domains found in registry yet.</p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Target</th>
                  <th>Certificate</th>
                  <th>Issued at</th>
                  <th>Age</th>
                  <th>Expires at</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((item) => (
                  <tr key={item.domain}>
                    <td>{item.domain}</td>
                    <td>{item.attachedToPanel ? 'Panel' : 'Static site'}</td>
                    <td>{item.certStatus}</td>
                    <td>{formatDate(item.certIssuedAt)}</td>
                    <td>{ageInDays(item.certIssuedAt)}</td>
                    <td>{formatDate(item.certExpiresAt)}</td>
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
