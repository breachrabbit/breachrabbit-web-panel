import Database from 'better-sqlite3';

const db = new Database('data.db');

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,
  issuer TEXT NOT NULL,
  not_before TEXT NOT NULL,
  not_after TEXT NOT NULL,
  auto_renew INTEGER NOT NULL DEFAULT 0,
  last_renew_status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export function listCertificates() {
  return db.prepare(`
    SELECT id, domain, issuer, not_before, not_after, auto_renew, last_renew_status
    FROM certificates
    ORDER BY datetime(not_after) ASC
  `).all().map((row) => ({ ...row, auto_renew: Boolean(row.auto_renew) }));
}

export function issueCertificate({ domain, issuer, notBefore, notAfter, autoRenew = false }) {
  const stmt = db.prepare(`
    INSERT INTO certificates (domain, issuer, not_before, not_after, auto_renew, last_renew_status, updated_at)
    VALUES (@domain, @issuer, @notBefore, @notAfter, @autoRenew, @lastRenewStatus, datetime('now'))
  `);

  const info = stmt.run({
    domain,
    issuer,
    notBefore,
    notAfter,
    autoRenew: autoRenew ? 1 : 0,
    lastRenewStatus: 'issued'
  });

  return getCertificateById(info.lastInsertRowid);
}

export function getCertificateById(id) {
  const row = db.prepare(`
    SELECT id, domain, issuer, not_before, not_after, auto_renew, last_renew_status
    FROM certificates
    WHERE id = ?
  `).get(id);

  if (!row) return null;
  return { ...row, auto_renew: Boolean(row.auto_renew) };
}

export function renewCertificate(id) {
  const cert = getCertificateById(id);
  if (!cert) return null;

  const currentExpiry = new Date(cert.not_after);
  const now = new Date();
  const baseDate = currentExpiry > now ? currentExpiry : now;
  const newNotBefore = now.toISOString();
  const newNotAfter = new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    UPDATE certificates
    SET not_before = @notBefore,
        not_after = @notAfter,
        last_renew_status = @status,
        updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id,
    notBefore: newNotBefore,
    notAfter: newNotAfter,
    status: 'success'
  });

  return getCertificateById(id);
}

export function setAutoRenew(id, autoRenew) {
  const info = db.prepare(`
    UPDATE certificates
    SET auto_renew = @autoRenew,
        updated_at = datetime('now')
    WHERE id = @id
  `).run({ id, autoRenew: autoRenew ? 1 : 0 });

  if (info.changes === 0) return null;
  return getCertificateById(id);
}

export function findExpiringCertificates(days = 30) {
  return db.prepare(`
    SELECT id, domain, issuer, not_before, not_after, auto_renew, last_renew_status
    FROM certificates
    WHERE datetime(not_after) <= datetime('now', '+' || ? || ' days')
    ORDER BY datetime(not_after) ASC
  `).all(days).map((row) => ({ ...row, auto_renew: Boolean(row.auto_renew) }));
}

export function markRenewStatus(id, status) {
  db.prepare(`
    UPDATE certificates
    SET last_renew_status = @status,
        updated_at = datetime('now')
    WHERE id = @id
  `).run({ id, status });
}
