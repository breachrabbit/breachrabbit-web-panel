import { CertificateService } from '../services/certificateService';
import { NginxService } from '../services/nginxService';
import { OlsApiService } from '../services/olsApi';
import { SystemService } from '../services/systemService';
import { CreateSiteInput, CreateSiteResult, SiteCreationStepContext } from '../types/site';
import { validateCreateSiteInput } from '../utils/validation';

export class CreateSiteOrchestrator {
  constructor(
    private readonly olsApiService: OlsApiService,
    private readonly nginxService: NginxService,
    private readonly certificateService: CertificateService,
    private readonly systemService: SystemService
  ) {}

  async execute(input: CreateSiteInput): Promise<CreateSiteResult> {
    const validationErrors = validateCreateSiteInput(input);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const context: SiteCreationStepContext = { input };
    const rollbacks: Array<() => Promise<void>> = [];

    try {
      await this.olsApiService.createVirtualHost(input);
      rollbacks.push(async () => this.olsApiService.deleteVirtualHost(input.domain));

      context.nginxConfigPath = await this.nginxService.writeServerBlock(input);
      rollbacks.push(async () => {
        if (context.nginxConfigPath) {
          await this.nginxService.removeServerBlock(context.nginxConfigPath);
        }
      });

      if (input.sslEnabled) {
        const cert = await this.certificateService.issueCertificate(input.domain);
        context.certPath = cert.certPath;
        context.keyPath = cert.keyPath;
        rollbacks.push(async () => this.certificateService.revokeCertificate(input.domain));
      }

      await this.systemService.reloadOls();
      await this.systemService.reloadNginx();

      const healthcheck = await this.systemService.healthcheck(input.domain);
      if (!healthcheck.ok) {
        throw new Error(`Healthcheck failed: ${healthcheck.error ?? `status ${healthcheck.status}`}`);
      }

      return {
        domain: input.domain,
        sslEnabled: input.sslEnabled,
        healthcheck
      };
    } catch (error) {
      for (const rollback of rollbacks.reverse()) {
        await rollback().catch(() => undefined);
      }
      throw error;
    }
  }
}
