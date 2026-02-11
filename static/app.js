const dbBody = document.getElementById('db-body');
const auditBody = document.getElementById('audit-body');
const statusNode = document.getElementById('status');

function setStatus(msg, isError = false) {
  statusNode.textContent = msg;
  statusNode.style.color = isError ? '#ba2d2d' : '#1a7f37';
}

async function loadDatabases() {
  const response = await fetch('/api/databases');
  const payload = await response.json();

  dbBody.innerHTML = '';
  payload.items.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.db_name}</td>
      <td>${item.db_user}</td>
      <td>${item.created_at}</td>
      <td>
        <button data-action="rotate" data-db="${item.db_name}" class="secondary">Change password</button>
        <button data-action="adminer" data-db="${item.db_name}" class="secondary">Open Adminer</button>
        <button data-action="delete" data-db="${item.db_name}" class="danger">Delete</button>
      </td>
    `;
    dbBody.appendChild(tr);
  });
}

async function loadAuditLogs() {
  const response = await fetch('/api/audit-logs');
  const payload = await response.json();

  auditBody.innerHTML = '';
  payload.items.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.action}</td>
      <td>${item.db_name}</td>
      <td>${item.db_user ?? ''}</td>
      <td>${item.details ?? ''}</td>
      <td>${item.created_at}</td>
    `;
    auditBody.appendChild(tr);
  });
}

async function refresh() {
  await loadDatabases();
  await loadAuditLogs();
}

document.getElementById('create-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch('/api/databases', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    setStatus(data.detail ?? 'Failed to create database', true);
    return;
  }

  event.target.reset();
  setStatus('Database created');
  await refresh();
});

dbBody.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const dbName = target.dataset.db;
  const action = target.dataset.action;

  if (!dbName || !action) {
    return;
  }

  if (action === 'delete') {
    const response = await fetch(`/api/databases/${dbName}`, {method: 'DELETE'});
    if (!response.ok) {
      const data = await response.json();
      setStatus(data.detail ?? 'Delete failed', true);
      return;
    }
    setStatus(`Database ${dbName} deleted`);
    await refresh();
    return;
  }

  if (action === 'rotate') {
    const password = window.prompt(`New password for ${dbName}:`);
    if (!password) {
      return;
    }

    const response = await fetch(`/api/databases/${dbName}/password`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({new_password: password}),
    });

    if (!response.ok) {
      const data = await response.json();
      setStatus(data.detail ?? 'Password rotation failed', true);
      return;
    }

    setStatus(`Password for ${dbName} updated`);
    await refresh();
    return;
  }

  if (action === 'adminer') {
    const response = await fetch(`/api/databases/${dbName}/adminer-token`, {method: 'POST'});
    if (!response.ok) {
      const data = await response.json();
      setStatus(data.detail ?? 'Could not issue admin token', true);
      return;
    }

    const data = await response.json();
    window.open(data.url, '_blank');
    setStatus(`Admin token for ${dbName} issued`);
    await refresh();
  }
});

refresh();
