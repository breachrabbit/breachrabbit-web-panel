/**
 * OpenLiteSpeed REST API Client
 * Connects to OLS WebAdmin API at port 7080
 */

interface OLSConfig {
  baseUrl: string;
  username: string;
  password: string;
}

interface OLSVHost {
  name: string;
  docRoot: string;
  domain: string;
  enabled: boolean;
}

interface OLSListener {
  name: string;
  address: string;
  port: number;
  secure: boolean;
}

interface OLSStatus {
  uptime: number;
  version: string;
  pid: number;
  running: boolean;
  connections: number;
  requests: number;
  bandwidth: number;
}

class OLSApiClient {
  private config: OLSConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.OLS_API_URL || 'https://localhost:7080',
      username: process.env.OLS_API_USER || 'admin',
      password: process.env.OLS_API_PASS || '',
    };
  }

  private async request(endpoint: string, method = 'GET', body?: any): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        // OLS uses self-signed certs
        // @ts-ignore
        rejectUnauthorized: false,
      });

      if (!res.ok) {
        throw new Error(`OLS API error: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error(`[OLS API] ${method} ${endpoint} failed:`, error);
      throw error;
    }
  }

  // ===== Server Status =====
  async getStatus(): Promise<OLSStatus> {
    try {
      const data = await this.request('/status');
      return {
        uptime: data.uptime || 0,
        version: data.version || 'unknown',
        pid: data.pid || 0,
        running: true,
        connections: data.connections || 0,
        requests: data.requests || 0,
        bandwidth: data.bw_in || 0,
      };
    } catch {
      return { uptime: 0, version: 'unknown', pid: 0, running: false, connections: 0, requests: 0, bandwidth: 0 };
    }
  }

  async restart(): Promise<boolean> {
    try {
      await this.request('/restart', 'POST');
      return true;
    } catch {
      return false;
    }
  }

  // ===== Virtual Hosts =====
  async listVHosts(): Promise<OLSVHost[]> {
    try {
      const data = await this.request('/vhosts');
      return data.vhosts || [];
    } catch {
      return [];
    }
  }

  async createVHost(config: {
    name: string;
    domain: string;
    docRoot: string;
    phpVersion?: string;
  }): Promise<boolean> {
    try {
      await this.request('/vhosts', 'POST', {
        name: config.name,
        docRoot: config.docRoot,
        domain: config.domain,
        phpVersion: config.phpVersion || '83',
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteVHost(name: string): Promise<boolean> {
    try {
      await this.request(`/vhosts/${name}`, 'DELETE');
      return true;
    } catch {
      return false;
    }
  }

  // ===== Listeners =====
  async listListeners(): Promise<OLSListener[]> {
    try {
      const data = await this.request('/listeners');
      return data.listeners || [];
    } catch {
      return [];
    }
  }

  // ===== Config Management =====
  async applyChanges(): Promise<boolean> {
    try {
      await this.request('/apply', 'POST');
      return true;
    } catch {
      return false;
    }
  }

  // ===== Health Check =====
  async isAvailable(): Promise<boolean> {
    try {
      await this.getStatus();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton
const globalForOLS = globalThis as unknown as { olsApi: OLSApiClient | undefined };
export const olsApi = globalForOLS.olsApi ?? new OLSApiClient();
if (process.env.NODE_ENV !== 'production') globalForOLS.olsApi = olsApi;

export default olsApi;
export type { OLSConfig, OLSVHost, OLSListener, OLSStatus };
