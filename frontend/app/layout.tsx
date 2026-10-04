import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Mitr } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const mitr = Mitr({
  weight: ["200", "300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-mitr",
});

export const metadata: Metadata = {
  title: "SquidPot — ทดลองเล่นด้วย PIGGY",
  description: "เกมทดลองบนเครือข่าย BNB สำหรับการศึกษาเท่านั้น",
  icons: {
    icon: "/piggy_icon2.png",
    shortcut: "/piggy_icon2.png",
    apple: "/piggy_icon2.png",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="th" className={mitr.variable}>
      <body className={mitr.className}><Providers>{children}</Providers></body>
    </html>
  );
}
