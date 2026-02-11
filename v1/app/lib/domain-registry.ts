import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DOMAIN_REGISTRY_PATH } from './panel-config';

export type DomainRegistryEntry = {
  domain: string;
  attachedToPanel: boolean;
  demoSite: boolean;
  certStatus: 'active' | 'pending' | 'failed' | 'none';
  certIssuedAt: string | null;
  certExpiresAt: string | null;
  certProvider: string;
  lastUpdatedAt: string;
};

type RegistryFile = {
  domains: DomainRegistryEntry[];
};

export async function readDomainRegistry(): Promise<DomainRegistryEntry[]> {
  try {
    const raw = await readFile(DOMAIN_REGISTRY_PATH, 'utf8');
    const parsed = JSON.parse(raw) as RegistryFile;
    return Array.isArray(parsed.domains) ? parsed.domains : [];
  } catch {
    return [];
  }
}

export async function upsertDomainRegistry(entry: DomainRegistryEntry) {
  const existing = await readDomainRegistry();
  const next = existing.filter((item) => item.domain !== entry.domain);
  next.push(entry);

  await mkdir(dirname(DOMAIN_REGISTRY_PATH), { recursive: true });
  await writeFile(
    DOMAIN_REGISTRY_PATH,
    JSON.stringify(
      {
        domains: next.sort((a, b) => a.domain.localeCompare(b.domain))
      },
      null,
      2
    ),
    'utf8'
  );
}
