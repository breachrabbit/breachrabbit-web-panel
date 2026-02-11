import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CreateSiteInput } from '../types/site';

export class NginxService {
  constructor(private readonly sitesDir = '/etc/nginx/sites-enabled') {}

  buildServerBlock(input: CreateSiteInput): string {
    if (input.siteType === 'proxy') {
      return `server {
  listen 80;
  server_name ${input.domain};

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass ${input.proxyTarget};
  }
}`;
    }

    return `server {
  listen 80;
  server_name ${input.domain};
  root ${input.rootPath};
  index index.php index.html;

  location / {
    try_files $uri $uri/ /index.php?$query_string;
  }
}`;
  }

  async writeServerBlock(input: CreateSiteInput): Promise<string> {
    await fs.mkdir(this.sitesDir, { recursive: true });
    const configPath = path.join(this.sitesDir, `${input.domain}.conf`);
    await fs.writeFile(configPath, this.buildServerBlock(input), 'utf-8');
    return configPath;
  }

  async removeServerBlock(configPath: string): Promise<void> {
    await fs.rm(configPath, { force: true });
  }
}
