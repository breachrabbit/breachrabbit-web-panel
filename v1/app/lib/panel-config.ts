export const SYSTEM_CHANGES_ALLOWED = process.env.PANEL_ALLOW_SYSTEM_CHANGES === 'true';

export const RESTART_COMMAND =
  process.env.PANEL_RESTART_COMMAND ??
  'systemctl restart nginx openlitespeed breachrabbit-panel || systemctl restart nginx lshttpd breachrabbit-panel';
export const NGINX_RELOAD_COMMAND =
  process.env.PANEL_NGINX_RELOAD_COMMAND ?? 'nginx -t && systemctl reload nginx';

export const DOMAIN_ROOT = process.env.PANEL_DOMAINS_ROOT ?? '/etc/nginx/sites-available';
export const NGINX_ENABLED_ROOT = process.env.PANEL_NGINX_ENABLED_ROOT ?? '/etc/nginx/sites-enabled';
export const SITE_ROOT = process.env.PANEL_SITES_ROOT ?? '/var/www/breachrabbit';
export const DOMAIN_REGISTRY_PATH =
  process.env.PANEL_DOMAIN_REGISTRY_PATH ?? '/opt/breachrabbit/data/domain-registry.json';

export const PANEL_TARGET_URL = process.env.PANEL_TARGET_URL ?? 'http://127.0.0.1:3000';
export const PANEL_CERTBOT_EMAIL = process.env.PANEL_CERTBOT_EMAIL ?? 'admin@localhost';
export const PANEL_MAIN_SITE_CONFIG_PATH =
  process.env.PANEL_MAIN_SITE_CONFIG_PATH ?? '/etc/nginx/sites-available/breachrabbit-panel.conf';
export const PANEL_MAIN_SITE_ENABLED_PATH =
  process.env.PANEL_MAIN_SITE_ENABLED_PATH ?? '/etc/nginx/sites-enabled/breachrabbit-panel.conf';

export const DOMAIN_PATTERN = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/;
export const DATABASE_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{1,62}$/;

export function normalizeDomain(input: string) {
  return input.trim().toLowerCase();
}

export const PANEL_ENV_FILE_PATH = process.env.PANEL_ENV_FILE_PATH ?? '/opt/breachrabbit/config/.env';
