import { DashboardShell } from "@/components/dashboard-shell";

// CRITICAL: prevents Next.js from statically generating these pages
// useSession() requires runtime (browser) — cannot run during build
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
