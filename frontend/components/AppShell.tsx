import Link from "next/link";
import type { ReactNode } from "react";
import { frontendConfig } from "@/lib/config";
import { MainNavigation } from "@/components/MainNavigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="site-header">
        <div className="shell header-inner">
          <Link className="brand" href="/" aria-label="SquidPot home">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="12" fill="currentColor" />
                <path d="M10 18.4c0-4.5 3.2-7.3 8-7.3s8 2.8 8 7.3c0 4.3-3.2 7-8 7s-8-2.7-8-7Z" fill="#F2C96D" />
                <path d="m13.1 12.1-2.8-3.3 5.8 1.6m6.8 1.7 2.8-3.3-5.8 1.6" stroke="#F2C96D" strokeWidth="2.2" strokeLinejoin="round" />
                <circle cx="15.2" cy="17.5" r=".8" fill="#26343B" />
                <circle cx="20.8" cy="17.5" r=".8" fill="#26343B" />
                <path d="M16.2 20.1h3.6" stroke="#26343B" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </span>
            <span className="brand-copy"><strong>SquidPot</strong><small>ACADEMIC PROTOTYPE</small></span>
          </Link>
          <div className="header-right">
            <span className="network-pill">
              <span className="network-dot" aria-hidden="true" />
              {frontendConfig?.chain.name ?? "Configuration needed"}
            </span>
            <MainNavigation />
          </div>
        </div>
      </header>
      <div className="academic-notice" role="note">
        <span className="notice-label">TESTNET ONLY</span>
        <span>Testnet Academic Prototype — Tokens Have No Real-World Value</span>
      </div>
      <main className="shell main-content">{children}</main>
      <footer className="shell footer-note">
        <span>Built for academic research on test networks.</span>
        <span>PIGGY has no real-world value.</span>
      </footer>
    </div>
  );
}
