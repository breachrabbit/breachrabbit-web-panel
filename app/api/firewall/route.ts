import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { firewallService } from "@/lib/services/firewall-service";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [status, fail2ban] = await Promise.all([
      firewallService.getStatus(),
      firewallService.getFail2banStatus(),
    ]);

    return NextResponse.json({ status, fail2ban });
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
      case "enable":
        await firewallService.enableFirewall();
        break;
      case "disable":
        await firewallService.disableFirewall();
        break;
      case "add-rule":
        await firewallService.addRule({
          action: body.ruleAction,
          port: body.port,
          protocol: body.protocol,
          from: body.from,
          comment: body.comment,
        });
        break;
      case "delete-rule":
        await firewallService.deleteRule(body.ruleNumber);
        break;
      case "set-default":
        await firewallService.setDefault(body.direction, body.policy);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
