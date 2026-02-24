import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sslService } from "@/lib/services/ssl-service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const domain = req.nextUrl.searchParams.get("domain");

  try {
    if (domain) {
      const cert = await sslService.getCertificate(domain);
      if (!cert) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
      }
      return NextResponse.json(cert);
    }

    const certs = await sslService.listCertificates();
    return NextResponse.json({ certificates: certs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "request-le":
        await sslService.requestLetsEncrypt({
          domain: body.domain,
          email: body.email,
          webroot: body.webroot,
        });
        break;
      case "upload-custom":
        await sslService.uploadCustomCert({
          domain: body.domain,
          certificate: body.certificate,
          privateKey: body.privateKey,
          chainCert: body.chainCert,
        });
        break;
      case "delete":
        await sslService.deleteCertificate(body.domain);
        break;
      case "renew":
        await sslService.renewCertificate(body.domain);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
