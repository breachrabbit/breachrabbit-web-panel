import { Router } from 'express';
import { CreateSiteOrchestrator } from '../orchestrators/createSite';
import { CertificateService } from '../services/certificateService';
import { NginxService } from '../services/nginxService';
import { OlsApiService } from '../services/olsApi';
import { SystemService } from '../services/systemService';
import { CreateSiteInput } from '../types/site';

const router = Router();

const orchestrator = new CreateSiteOrchestrator(
  new OlsApiService(process.env.OLS_API_URL ?? 'http://127.0.0.1:8088/api', process.env.OLS_API_TOKEN),
  new NginxService(process.env.NGINX_SITES_DIR),
  new CertificateService((process.env.CERT_CLIENT as 'acme.sh' | 'certbot') ?? 'acme.sh'),
  new SystemService()
);

router.post('/api/sites', async (req, res) => {
  const payload = req.body as CreateSiteInput;

  try {
    const result = await orchestrator.execute(payload);
    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Unexpected error'
    });
  }
});

export default router;
