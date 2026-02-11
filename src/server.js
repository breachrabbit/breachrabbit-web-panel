import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  issueCertificate,
  listCertificates,
  renewCertificate,
  setAutoRenew,
  getCertificateById
} from './db.js';
import { runAutoRenewJob, startCertificateCron } from './certificateJobs.js';

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/certificates', (req, res) => {
  res.json(listCertificates());
});

app.post('/api/certificates/issue', (req, res) => {
  const { domain, issuer, not_before: notBefore, not_after: notAfter, auto_renew: autoRenew } = req.body;

  if (!domain || !issuer || !notBefore || !notAfter) {
    return res.status(400).json({ error: 'domain, issuer, not_before, not_after are required' });
  }

  try {
    const cert = issueCertificate({ domain, issuer, notBefore, notAfter, autoRenew: Boolean(autoRenew) });
    return res.status(201).json(cert);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/api/certificates/renew', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const cert = renewCertificate(id);
  if (!cert) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  return res.json(cert);
});

app.patch('/api/certificates/:id/auto-renew', (req, res) => {
  const { id } = req.params;
  const { auto_renew: autoRenew } = req.body;

  if (typeof autoRenew !== 'boolean') {
    return res.status(400).json({ error: 'auto_renew boolean is required' });
  }

  const cert = setAutoRenew(id, autoRenew);
  if (!cert) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  return res.json(cert);
});

app.post('/api/certificates/auto-renew/run', (req, res) => {
  const totalChecked = runAutoRenewJob();
  res.json({ checked: totalChecked });
});

app.get('/ssl-certificates', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'ssl-certificates.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sample: getCertificateById(1) ?? null });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  startCertificateCron();
  console.log(`Server listening on port ${port}`);
});
