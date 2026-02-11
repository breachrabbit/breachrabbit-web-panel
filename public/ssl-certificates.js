const rows = document.getElementById('certRows');
const expiringSoonCheckbox = document.getElementById('expiringSoon');

function daysUntil(dateString) {
  const now = new Date();
  const target = new Date(dateString);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function render(data) {
  const onlyExpiringSoon = expiringSoonCheckbox.checked;
  const filtered = onlyExpiringSoon
    ? data.filter((cert) => daysUntil(cert.not_after) < 30)
    : data;

  rows.innerHTML = filtered
    .map((cert) => {
      const days = daysUntil(cert.not_after);
      const badgeClass = days < 30 ? 'soon' : 'ok';
      return `
        <tr>
          <td>${cert.domain}</td>
          <td>${cert.issuer}</td>
          <td>${new Date(cert.not_before).toLocaleString()}</td>
          <td>${new Date(cert.not_after).toLocaleString()} <span class="badge ${badgeClass}">${days} days</span></td>
          <td>${cert.auto_renew ? 'On' : 'Off'}</td>
          <td>${cert.last_renew_status ?? ''}</td>
        </tr>
      `;
    })
    .join('');
}

async function loadCertificates() {
  const response = await fetch('/api/certificates');
  const data = await response.json();
  render(data);
}

expiringSoonCheckbox.addEventListener('change', loadCertificates);
loadCertificates();
