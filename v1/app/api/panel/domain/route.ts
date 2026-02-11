import { readFile, symlink, writeFile } from 'node:fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import {
  DOMAIN_PATTERN,
  NGINX_RELOAD_COMMAND,
  PANEL_CERTBOT_EMAIL,
  PANEL_MAIN_SITE_CONFIG_PATH,
  PANEL_MAIN_SITE_ENABLED_PATH,
  PANEL_TARGET_URL,
  SYSTEM_CHANGES_ALLOWED,
  normalizeDomain
} from '@/app/lib/panel-config';
import { runSystemCommand } from '@/app/lib/system-command';

function ensureSnippets(config: string) {
  let nextConfig = config;

  if (!nextConfig.includes('include /etc/nginx/snippets/adminer.conf;')) {
    nextConfig = nextConfig.replace(
      /server_name\s+[^;]+;/,
      (match) => `${match}\n\n    include /etc/nginx/snippets/adminer.conf;`
    );
  }

  if (!nextConfig.includes('include /etc/nginx/snippets/filebrowser.conf;')) {
    nextConfig = nextConfig.replace(
      /server_name\s+[^;]+;/,
      (match) => `${match}\n    include /etc/nginx/snippets/filebrowser.conf;`
    );
  }

  if (!nextConfig.includes('location / {')) {
    nextConfig = `${nextConfig.trim()}\n\n    location / {\n        proxy_pass ${PANEL_TARGET_URL};\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n`;
  }

  return nextConfig;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        domain?: string;
        issueCertificate?: boolean;
      }
    | null;

  const domain = normalizeDomain(body?.domain ?? '');
  const issueCertificate = body?.issueCertificate !== false;

  if (!domain || !DOMAIN_PATTERN.test(domain)) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Invalid domain format. Expected value like panel.example.com.'
      },
      { status: 400 }
    );
  }

  if (!SYSTEM_CHANGES_ALLOWED) {
    return NextResponse.json({
      status: 'dry-run',
      message:
        'System actions are disabled. Set PANEL_ALLOW_SYSTEM_CHANGES=true to configure nginx and certificates.',
      domain
    });
  }

  let config = await readFile(PANEL_MAIN_SITE_CONFIG_PATH, 'utf8').catch(() => '');

  if (!config.trim()) {
    config = `server {\n    listen 80;\n    server_name _;\n\n    include /etc/nginx/snippets/adminer.conf;\n    include /etc/nginx/snippets/filebrowser.conf;\n\n    location / {\n        proxy_pass ${PANEL_TARGET_URL};\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection \"upgrade\";\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n}\n`;
  }

  const updatedConfig = ensureSnippets(config).replace(/server_name\s+[^;]+;/, `server_name ${domain};`);

  await writeFile(PANEL_MAIN_SITE_CONFIG_PATH, updatedConfig, 'utf8');

  try {
    await symlink(PANEL_MAIN_SITE_CONFIG_PATH, PANEL_MAIN_SITE_ENABLED_PATH);
  } catch {
    // ignore when symlink already exists
  }

  try {
    await runSystemCommand(NGINX_RELOAD_COMMAND);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to validate/reload Nginx after panel domain update'
      },
      { status: 500 }
    );
  }

  let certificateStatus: 'active' | 'failed' | 'none' = 'none';

  if (issueCertificate) {
    try {
      await runSystemCommand(
        `certbot --nginx -d ${domain} --non-interactive --agree-tos --redirect -m ${PANEL_CERTBOT_EMAIL}`,
        180_000
      );
      certificateStatus = 'active';
    } catch {
      certificateStatus = 'failed';
    }
  }

  return NextResponse.json({
    status: 'ok',
    message:
      certificateStatus === 'failed'
        ? 'Panel domain updated, but certificate issuance failed. Check DNS and certbot logs.'
        : 'Panel domain updated successfully.',
    domain,
    certificate: {
      status: certificateStatus,
      provider: issueCertificate ? 'letsencrypt' : 'n/a'
    }
  });
}
