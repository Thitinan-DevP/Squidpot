import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SquidPot — ทดลองเล่นด้วย PIGGY",
  description: "เกมทดลองบนเครือข่าย BNB สำหรับการศึกษาเท่านั้น",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="th">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
