import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { cronService } from "@/lib/services/cron-service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = req.nextUrl.searchParams.get("user") || "root";

  try {
    const [jobs, users] = await Promise.all([
      cronService.listJobs(user),
      cronService.getSystemUsers(),
    ]);

    return NextResponse.json({ jobs, users });
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
      case "add":
        await cronService.addJob({
          expression: body.expression,
          command: body.command,
          user: body.user,
          description: body.description,
        });
        break;
      case "remove":
        await cronService.removeJob({
          expression: body.expression,
          command: body.command,
          user: body.user,
        });
        break;
      case "toggle":
        await cronService.toggleJob({
          expression: body.expression,
          command: body.command,
          enabled: body.enabled,
          user: body.user,
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
