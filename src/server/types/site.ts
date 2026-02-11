export type SiteType = 'php' | 'static' | 'proxy';

export interface CreateSiteInput {
  domain: string;
  siteType: SiteType;
  phpVersion?: string;
  rootPath?: string;
  proxyTarget?: string;
  sslEnabled: boolean;
}

export interface CreateSiteResult {
  domain: string;
  sslEnabled: boolean;
  healthcheck: {
    ok: boolean;
    status?: number;
    error?: string;
  };
}

export interface SiteCreationStepContext {
  input: CreateSiteInput;
  nginxConfigPath?: string;
  certPath?: string;
  keyPath?: string;
}
