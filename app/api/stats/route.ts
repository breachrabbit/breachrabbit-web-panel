import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDashboardData } from "@/lib/services/monitor-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[stats] error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
