import cron from 'node-cron';
import { findExpiringCertificates, markRenewStatus, renewCertificate } from './db.js';

export function runAutoRenewJob() {
  const expiring = findExpiringCertificates(30);

  for (const cert of expiring) {
    if (!cert.auto_renew) continue;

    try {
      const renewed = renewCertificate(cert.id);
      if (!renewed) {
        markRenewStatus(cert.id, 'failed:not-found');
        continue;
      }
      markRenewStatus(cert.id, 'success:auto-renewed');
    } catch (error) {
      markRenewStatus(cert.id, `failed:${error.message}`);
    }
  }

  return expiring.length;
}

export function startCertificateCron() {
  // Every hour check expiring certificates and auto-renew.
  return cron.schedule('0 * * * *', runAutoRenewJob, { scheduled: true });
}
