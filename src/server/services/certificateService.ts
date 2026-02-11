import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export class CertificateService {
  constructor(private readonly preferredClient: 'acme.sh' | 'certbot' = 'acme.sh') {}

  async issueCertificate(domain: string): Promise<{ certPath: string; keyPath: string }> {
    if (this.preferredClient === 'acme.sh') {
      await execFileAsync('acme.sh', ['--issue', '-d', domain, '--nginx']);
      return {
        certPath: `/root/.acme.sh/${domain}/fullchain.cer`,
        keyPath: `/root/.acme.sh/${domain}/${domain}.key`
      };
    }

    await execFileAsync('certbot', ['certonly', '--nginx', '-d', domain, '--non-interactive', '--agree-tos', '-m', `admin@${domain}`]);
    return {
      certPath: `/etc/letsencrypt/live/${domain}/fullchain.pem`,
      keyPath: `/etc/letsencrypt/live/${domain}/privkey.pem`
    };
  }

  async revokeCertificate(domain: string): Promise<void> {
    if (this.preferredClient === 'acme.sh') {
      await execFileAsync('acme.sh', ['--revoke', '-d', domain]).catch(() => undefined);
      return;
    }
    await execFileAsync('certbot', ['delete', '--cert-name', domain, '--non-interactive']).catch(() => undefined);
  }
}
