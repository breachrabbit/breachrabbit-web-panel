import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export class SystemService {
  async reloadNginx(): Promise<void> {
    await execFileAsync('nginx', ['-s', 'reload']);
  }

  async reloadOls(): Promise<void> {
    await execFileAsync('systemctl', ['reload', 'lsws']);
  }

  async healthcheck(domain: string): Promise<{ ok: boolean; status?: number; error?: string }> {
    try {
      const response = await fetch(`http://${domain}`, { method: 'GET' });
      return { ok: response.ok, status: response.status };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
