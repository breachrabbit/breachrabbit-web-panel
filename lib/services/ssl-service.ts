import { shellExec, shellSudo } from "@/lib/shell";
import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

const CERT_BASE_DIR = "/etc/letsencrypt/live";
const CUSTOM_CERT_DIR = "/etc/ssl/hostpanel";

export interface CertificateInfo {
  domain: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysLeft: number;
  serialNumber: string;
  altNames: string[];
  isAutoRenew: boolean;
  type: "letsencrypt" | "custom";
}

/**
 * Parse openssl x509 output
 */
function parseCertInfo(
  output: string,
  domain: string,
  type: "letsencrypt" | "custom"
): CertificateInfo {
  const issuerMatch = output.match(/Issuer:.*?CN\s*=\s*(.+)/);
  const fromMatch = output.match(/Not Before:\s*(.+)/);
  const toMatch = output.match(/Not After\s*:\s*(.+)/);
  const serialMatch = output.match(/Serial Number:\s*\n?\s*(.+)/);
  const sanMatch = output.match(
    /X509v3 Subject Alternative Name:\s*\n\s*(.+)/
  );

  const validTo = toMatch ? new Date(toMatch[1].trim()) : new Date();
  const daysLeft = Math.ceil(
    (validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const altNames = sanMatch
    ? sanMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/^DNS:/, ""))
        .filter(Boolean)
    : [domain];

  return {
    domain,
    issuer: issuerMatch?.[1]?.trim() || "Unknown",
    validFrom: fromMatch?.[1]?.trim() || "",
    validTo: toMatch?.[1]?.trim() || "",
    daysLeft: Math.max(0, daysLeft),
    serialNumber: serialMatch?.[1]?.trim() || "",
    altNames,
    isAutoRenew: type === "letsencrypt",
    type,
  };
}

// ─── Public API ─────────────────────────────────────────────────

export async function listCertificates(): Promise<CertificateInfo[]> {
  const certs: CertificateInfo[] = [];

  // List Let's Encrypt certs
  const leResult = await shellExec(`ls "${CERT_BASE_DIR}" 2>/dev/null`);
  if (leResult.exitCode === 0 && leResult.stdout) {
    for (const domain of leResult.stdout.split("\n").filter(Boolean)) {
      const certPath = path.join(CERT_BASE_DIR, domain, "cert.pem");
      const info = await getCertificateDetails(certPath, domain, "letsencrypt");
      if (info) certs.push(info);
    }
  }

  // List custom certs from DB
  const customCerts = await prisma.sslCertificate.findMany({
    where: { type: "custom" },
  });
  for (const cert of customCerts) {
    const certPath = path.join(CUSTOM_CERT_DIR, cert.domain, "cert.pem");
    const info = await getCertificateDetails(certPath, cert.domain, "custom");
    if (info) certs.push(info);
  }

  return certs;
}

async function getCertificateDetails(
  certPath: string,
  domain: string,
  type: "letsencrypt" | "custom"
): Promise<CertificateInfo | null> {
  const result = await shellExec(
    `openssl x509 -in "${certPath}" -text -noout 2>/dev/null`
  );
  if (result.exitCode !== 0) return null;
  return parseCertInfo(result.stdout, domain, type);
}

export async function getCertificate(
  domain: string
): Promise<CertificateInfo | null> {
  // Check Let's Encrypt first
  const lePath = path.join(CERT_BASE_DIR, domain, "cert.pem");
  const leInfo = await getCertificateDetails(lePath, domain, "letsencrypt");
  if (leInfo) return leInfo;

  // Check custom
  const customPath = path.join(CUSTOM_CERT_DIR, domain, "cert.pem");
  return getCertificateDetails(customPath, domain, "custom");
}

export async function requestLetsEncrypt(params: {
  domain: string;
  email: string;
  webroot?: string;
}): Promise<void> {
  const { domain, email, webroot = `/var/www/${domain}/html` } = params;

  const result = await shellSudo(
    `certbot certonly --webroot -w "${webroot}" -d "${domain}" --email "${email}" --agree-tos --non-interactive`
  );

  if (result.exitCode !== 0) {
    throw new Error(`Certbot failed: ${result.stderr}`);
  }

  // Save to DB
  const certInfo = await getCertificate(domain);
  await prisma.sslCertificate.upsert({
    where: { domain },
    create: {
      domain,
      type: "letsencrypt",
      autoRenew: true,
      issuedAt: certInfo ? new Date(certInfo.validFrom) : new Date(),
      expiresAt: certInfo ? new Date(certInfo.validTo) : new Date(),
      status: "active",
    },
    update: {
      type: "letsencrypt",
      autoRenew: true,
      issuedAt: certInfo ? new Date(certInfo.validFrom) : new Date(),
      expiresAt: certInfo ? new Date(certInfo.validTo) : new Date(),
      status: "active",
    },
  });
}

export async function uploadCustomCert(params: {
  domain: string;
  certificate: string;
  privateKey: string;
  chainCert?: string;
}): Promise<void> {
  const { domain, certificate, privateKey, chainCert } = params;

  // Validate cert
  const validateResult = await shellExec(
    `echo '${certificate}' | openssl x509 -noout -text 2>&1`
  );
  if (validateResult.exitCode !== 0) {
    throw new Error("Invalid certificate format");
  }

  // Create directory
  const certDir = path.join(CUSTOM_CERT_DIR, domain);
  await shellSudo(`mkdir -p "${certDir}"`);

  // Write files
  await shellSudo(
    `echo '${certificate}' > "${path.join(certDir, "cert.pem")}"`
  );
  await shellSudo(
    `echo '${privateKey}' > "${path.join(certDir, "privkey.pem")}"`
  );
  if (chainCert) {
    await shellSudo(
      `echo '${chainCert}' > "${path.join(certDir, "chain.pem")}"`
    );
    // Create fullchain
    await shellSudo(
      `cat "${path.join(certDir, "cert.pem")}" "${path.join(certDir, "chain.pem")}" > "${path.join(certDir, "fullchain.pem")}"`
    );
  }

  // Set permissions
  await shellSudo(`chmod 600 "${path.join(certDir, "privkey.pem")}"`);
  await shellSudo(`chmod 644 "${path.join(certDir, "cert.pem")}"`);

  // Parse cert dates
  const certInfo = await getCertificateDetails(
    path.join(certDir, "cert.pem"),
    domain,
    "custom"
  );

  // Save to DB
  await prisma.sslCertificate.upsert({
    where: { domain },
    create: {
      domain,
      type: "custom",
      autoRenew: false,
      issuedAt: certInfo ? new Date(certInfo.validFrom) : new Date(),
      expiresAt: certInfo ? new Date(certInfo.validTo) : new Date(),
      status: "active",
    },
    update: {
      type: "custom",
      autoRenew: false,
      issuedAt: certInfo ? new Date(certInfo.validFrom) : new Date(),
      expiresAt: certInfo ? new Date(certInfo.validTo) : new Date(),
      status: "active",
    },
  });
}

export async function deleteCertificate(domain: string): Promise<void> {
  // Remove custom cert files
  const certDir = path.join(CUSTOM_CERT_DIR, domain);
  await shellSudo(`rm -rf "${certDir}"`);

  // Revoke Let's Encrypt if exists
  const lePath = path.join(CERT_BASE_DIR, domain, "cert.pem");
  const leExists = await shellExec(`test -f "${lePath}" && echo "exists"`);
  if (leExists.stdout.includes("exists")) {
    await shellSudo(`certbot revoke --cert-path "${lePath}" --non-interactive`);
    await shellSudo(`certbot delete --cert-name "${domain}" --non-interactive`);
  }

  await prisma.sslCertificate.deleteMany({ where: { domain } });
}

export async function renewCertificate(domain: string): Promise<void> {
  const result = await shellSudo(
    `certbot renew --cert-name "${domain}" --non-interactive`
  );
  if (result.exitCode !== 0) {
    throw new Error(`Renewal failed: ${result.stderr}`);
  }

  // Update DB
  const certInfo = await getCertificate(domain);
  if (certInfo) {
    await prisma.sslCertificate.updateMany({
      where: { domain },
      data: {
        issuedAt: new Date(certInfo.validFrom),
        expiresAt: new Date(certInfo.validTo),
      },
    });
  }
}

export const sslService = {
  listCertificates,
  getCertificate,
  requestLetsEncrypt,
  uploadCustomCert,
  deleteCertificate,
  renewCertificate,
};
