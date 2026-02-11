import { CreateSiteInput } from '../types/site';

const DOMAIN_RE = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;
const URL_RE = /^https?:\/\/[\w.-]+(?::\d+)?(?:\/.*)?$/;

export function validateCreateSiteInput(input: CreateSiteInput): string[] {
  const errors: string[] = [];

  if (!input.domain || !DOMAIN_RE.test(input.domain)) {
    errors.push('Invalid domain');
  }

  if (!['php', 'static', 'proxy'].includes(input.siteType)) {
    errors.push('Invalid siteType');
  }

  if (input.siteType === 'php' && !input.phpVersion) {
    errors.push('phpVersion is required for php site type');
  }

  if (input.siteType !== 'proxy' && !input.rootPath) {
    errors.push('rootPath is required for non-proxy site types');
  }

  if (input.rootPath && !input.rootPath.startsWith('/')) {
    errors.push('rootPath must be absolute');
  }

  if (input.siteType === 'proxy') {
    if (!input.proxyTarget) {
      errors.push('proxyTarget is required for proxy site type');
    } else if (!URL_RE.test(input.proxyTarget)) {
      errors.push('proxyTarget must be a valid URL');
    }
  }

  return errors;
}
