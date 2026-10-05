import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MainNavigation } from "@/components/MainNavigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen app-shell-root">
      <header className="site-header">
        <div className="shell header-inner">
          <Link className="brand" href="/" aria-label="SquidPot หน้าหลัก">
            <span className="brand-mark" aria-hidden="true">
              <Image
                src="/piggy_icon2.png"
                alt="PIGGY Logo"
                width={48}
                height={48}
                className="brand-logo-img"
                priority
              />
            </span>
            <span className="brand-copy"><strong>วงล้อเสี่ยงโชค</strong><small>Lucky Carnival Wheel · SquidPot</small></span>
          </Link>
          <div className="header-right">
            <MainNavigation />
          </div>
        </div>
      </header>
      <main className="shell main-content">{children}</main>
      <footer className="shell footer-note">
        <span>สร้างขึ้นเพื่อการศึกษาและทดลองระบบบล็อกเชน</span>
        <span className="footer-subnote">วงล้อสุ่มผลบนเครือข่าย · Chainlink VRF v2.5</span>
      </footer>
    </div>
  );
}
