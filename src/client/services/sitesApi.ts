export type SiteType = 'php' | 'static' | 'proxy';

export interface CreateSitePayload {
  domain: string;
  siteType: SiteType;
  phpVersion?: string;
  rootPath?: string;
  proxyTarget?: string;
  sslEnabled: boolean;
}

export async function createSite(payload: CreateSitePayload): Promise<void> {
  const response = await fetch('/api/sites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? 'Failed to create site');
  }
}
