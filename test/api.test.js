import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';

const PORT = 3131;
const BASE_URL = `http://127.0.0.1:${PORT}`;
let server;

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) return;
    } catch {
      // Retry until server starts.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Server did not start');
}

test.before(async () => {
  if (fs.existsSync('data.db')) fs.unlinkSync('data.db');
  server = spawn('node', ['src/server.js'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  server.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  await waitForServer();
});

test.after(async () => {
  server.kill('SIGTERM');
  await once(server, 'exit');
});

test('issues, lists, renews and toggles auto-renew certificates', async () => {
  const issueResponse = await fetch(`${BASE_URL}/api/certificates/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain: 'example.com',
      issuer: 'LetsEncrypt',
      not_before: new Date().toISOString(),
      not_after: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      auto_renew: false
    })
  });

  assert.equal(issueResponse.status, 201);
  const issued = await issueResponse.json();
  assert.equal(issued.domain, 'example.com');

  const listResponse = await fetch(`${BASE_URL}/api/certificates`);
  assert.equal(listResponse.status, 200);
  const list = await listResponse.json();
  assert.equal(list.length, 1);

  const renewResponse = await fetch(`${BASE_URL}/api/certificates/renew`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: issued.id })
  });
  assert.equal(renewResponse.status, 200);
  const renewed = await renewResponse.json();
  assert.equal(renewed.last_renew_status, 'success');

  const autoRenewResponse = await fetch(`${BASE_URL}/api/certificates/${issued.id}/auto-renew`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auto_renew: true })
  });
  assert.equal(autoRenewResponse.status, 200);
  const updated = await autoRenewResponse.json();
  assert.equal(updated.auto_renew, true);
});
