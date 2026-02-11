export const dynamic = 'force-dynamic';

import { PanelActions } from './components/panel-actions';

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'REDIS_URL',
  'NEXTAUTH_SECRET'
] as const;

function envStatus() {
  return requiredEnvVars.map((name) => ({
    name,
    configured: Boolean(process.env[name])
  }));
}

export default function Home() {
  const checks = envStatus();
  const configuredCount = checks.filter((item) => item.configured).length;

  return (
    <main className="container">
      <section className="hero">
        <p className="label">BreachRabbit</p>
        <h1>Next.js panel bootstrap is running</h1>
        <p>
          This is the first deployable panel step after installer completion. Configure your
          environment values and use controls below to validate server operations.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Environment readiness</h2>
          <p>
            {configuredCount}/{checks.length} required variables are configured.
          </p>
          <ul>
            {checks.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <strong className={item.configured ? 'ok' : 'missing'}>
                  {item.configured ? 'OK' : 'MISSING'}
                </strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Health check endpoint</h2>
          <p>
            Probe <code>/api/health</code> from nginx, uptime checks, or orchestration scripts to
            verify that Next.js responds.
          </p>
        </article>

        <PanelActions />
      </section>
    </main>
  );
}
