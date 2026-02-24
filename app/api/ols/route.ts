import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { olsApi } from "@/lib/integrations/ols-api";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resource = req.nextUrl.searchParams.get("resource");
  const name = req.nextUrl.searchParams.get("name");

  try {
    switch (resource) {
      case "status":
        return NextResponse.json(await olsApi.getServerStatus());
      case "vhosts":
        if (name) return NextResponse.json(await olsApi.getVHost(name));
        return NextResponse.json(await olsApi.listVHosts());
      case "listeners":
        if (name) return NextResponse.json(await olsApi.getListener(name));
        return NextResponse.json(await olsApi.listListeners());
      case "php":
        if (name) return NextResponse.json(await olsApi.getPHPConfig(name));
        return NextResponse.json(await olsApi.listPHPVersions());
      case "lscache":
        return NextResponse.json(await olsApi.getLSCacheStats());
      case "opcache":
        return NextResponse.json(await olsApi.getOPCacheStats());
      default:
        return NextResponse.json(await olsApi.getServerStatus());
    }
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
      case "restart":
        return NextResponse.json(await olsApi.restartServer());
      case "graceful-restart":
        return NextResponse.json(await olsApi.gracefulRestart());
      case "reload":
        return NextResponse.json(await olsApi.reloadConfig());
      case "create-vhost":
        return NextResponse.json(await olsApi.createVHost(body.config));
      case "update-vhost":
        return NextResponse.json(await olsApi.updateVHost(body.name, body.config));
      case "delete-vhost":
        return NextResponse.json(await olsApi.deleteVHost(body.name));
      case "enable-vhost":
        return NextResponse.json(await olsApi.enableVHost(body.name));
      case "disable-vhost":
        return NextResponse.json(await olsApi.disableVHost(body.name));
      case "create-listener":
        return NextResponse.json(await olsApi.createListener(body.config));
      case "delete-listener":
        return NextResponse.json(await olsApi.deleteListener(body.name));
      case "flush-lscache":
        return NextResponse.json(await olsApi.flushLSCache());
      case "flush-opcache":
        return NextResponse.json(await olsApi.flushOPCache());
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
