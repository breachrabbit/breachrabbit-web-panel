import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "HostPanel Pro — Server Management",
  description: "WordPress-optimized hosting control panel built with OpenLiteSpeed",
  robots: "noindex, nofollow", // FIX: Prevent search engine indexing of admin panel
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
