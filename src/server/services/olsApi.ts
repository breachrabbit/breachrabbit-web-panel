import { CreateSiteInput } from '../types/site';

export class OlsApiService {
  constructor(private readonly baseUrl: string, private readonly token?: string) {}

  async createVirtualHost(input: CreateSiteInput): Promise<void> {
    const response = await fetch(`${this.baseUrl}/virtual-hosts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      },
      body: JSON.stringify({
        domain: input.domain,
        type: input.siteType,
        phpVersion: input.phpVersion,
        rootPath: input.rootPath
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OLS createVirtualHost failed: ${response.status} ${body}`);
    }
  }

  async deleteVirtualHost(domain: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/virtual-hosts/${domain}`, {
      method: 'DELETE',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined
    });

    if (!response.ok && response.status !== 404) {
      const body = await response.text();
      throw new Error(`OLS deleteVirtualHost failed: ${response.status} ${body}`);
    }
  }
}
