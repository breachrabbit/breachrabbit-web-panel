import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Terminal API — REST endpoint for basic command execution.
 *
 * Full interactive terminal uses WebSocket + node-pty via
 * a custom server (see server/terminal-ws.ts).
 * This route handles single-shot command execution.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { command } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 }
      );
    }

    // Dynamic import to avoid bundling issues
    const { shellExec } = await import("@/lib/shell");
    const result = await shellExec(command, { timeout: 15000 });

    return NextResponse.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
