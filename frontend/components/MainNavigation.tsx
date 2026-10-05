"use client";

import { useContext, useRef, useState } from "react";
import Link from "next/link";
import { WagmiContext } from "wagmi";
import { SquidPotDashboard } from "@/components/SquidPotDashboard";
import { shortAddress, formatPiggy } from "@/lib/format";
import { useSquidPot } from "@/lib/use-squidpot";

function WalletIcon({ className = "icon" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      <circle cx="17.5" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function GearIcon({ className = "icon" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function HeaderBalancePill() {
  const hasWagmi = Boolean(useContext(WagmiContext));
  if (!hasWagmi) {
    return (
      <Link
        href="/"
        aria-current="page"
        aria-label="เล่นเกม"
        className="player-balance-pill"
        title="ยอดเงินของคุณ"
      >
        <span className="balance-label">ยอดเงินของคุณ:</span>
        <strong className="balance-value">0 $PIGGY</strong>
      </Link>
    );
  }
  return <ConnectedHeaderBalancePill />;
}

function ConnectedHeaderBalancePill() {
  const pot = useSquidPot();
  return (
    <Link
      href="/"
      aria-current="page"
      aria-label="เล่นเกม"
      className="player-balance-pill"
      title={pot.isConnected ? `ยอดเงินของคุณ: ${formatPiggy(pot.tokenBalance)}` : "ยังไม่ได้เชื่อมต่อกระเป๋า"}
    >
      <span className="balance-label">ยอดเงินของคุณ:</span>
      <strong className="balance-value">{formatPiggy(pot.tokenBalance)}</strong>
    </Link>
  );
}

function HeaderWalletAction({ onOpenWallet }: { onOpenWallet: () => void }) {
  const hasWagmi = Boolean(useContext(WagmiContext));
  if (!hasWagmi) {
    return null;
  }
  return <ConnectedHeaderWalletAction onOpenWallet={onOpenWallet} />;
}

function ConnectedHeaderWalletAction({ onOpenWallet }: { onOpenWallet: () => void }) {
  const pot = useSquidPot();
  if (!pot.isConnected) {
    return null;
  }
  return (
    <button
      type="button"
      className="header-account-pill"
      onClick={onOpenWallet}
      title={pot.address}
    >
      <span className="account-dot" aria-hidden="true" />
      <span className="account-address">{shortAddress(pot.address)}</span>
    </button>
  );
}

export function MainNavigation() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [panel, setPanel] = useState<"wallet" | "how" | null>(null);

  const open = (nextPanel: "wallet" | "how") => {
    setPanel(nextPanel);
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  };

  const close = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else {
      dialog.removeAttribute("open");
      setPanel(null);
    }
  };

  return (
    <>
      <nav aria-label="เมนูหลัก" className="main-nav">
        <HeaderBalancePill />
        <button
          type="button"
          aria-haspopup="dialog"
          className="nav-link wallet-nav-btn"
          onClick={() => open("wallet")}
          aria-label="กระเป๋าเงิน (Wallet)"
          title="กระเป๋าเงิน (Wallet)"
        >
          <span className="wallet-nav-icon" aria-hidden="true"><WalletIcon /></span>
        </button>
        <a
          href="/architecture"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link nav-info-btn"
          aria-label="เอกสารสถาปัตยกรรมระบบ (Technical Architecture)"
          title="เอกสารสถาปัตยกรรมระบบ (Technical Architecture)"
        >
          <span className="info-icon" aria-hidden="true"><InfoIcon /></span>
        </a>
        <button
          type="button"
          aria-haspopup="dialog"
          className="nav-link settings-nav-btn"
          onClick={() => open("how")}
          aria-label="วิธีใช้งาน"
          title="คู่มือกติกา (Settings)"
        >
          <span className="gear-icon" aria-hidden="true"><GearIcon /></span>
          <span>คู่มือกติกา</span>
        </button>
        <HeaderWalletAction onOpenWallet={() => open("wallet")} />
      </nav>
      <dialog aria-labelledby="menu-dialog-title" className="glass-dialog" ref={dialogRef} onClose={() => setPanel(null)} onClick={(event) => { if (event.target === dialogRef.current) close(); }}>
        <div className="dialog-heading">
          <div><p className="eyebrow">SquidPot · {panel === "wallet" ? "กระเป๋า" : "คู่มือ"}</p><h2 id="menu-dialog-title">{panel === "wallet" ? "กระเป๋าและรางวัล" : "วิธีเล่นใน 5 ขั้นตอน"}</h2></div>
          <button type="button" aria-label="ปิดหน้าต่าง" className="dialog-close" onClick={close}>×</button>
        </div>
        <div className="dialog-content">{panel === "wallet" ? <SquidPotDashboard walletPage /> : panel === "how" ? (
          <div className="page-stack how-page">
            <p className="muted">เล่นครั้งละ 10 PIGGY บน BNB Smart Chain Testnet ต้องมี PIGGY สำหรับค่าเล่นและ tBNB สำหรับค่าธรรมเนียม</p>
            <section className="card"><h2>เล่นตาม 5 ขั้นตอน</h2><ol className="how-steps">
              <li><strong>เชื่อมต่อกระเป๋า</strong><span>เลือกกระเป๋าที่ติดตั้งไว้ เช่น MetaMask</span></li>
              <li><strong>เลือกเครือข่ายทดลอง</strong><span>เปลี่ยนเป็น BNB Smart Chain Testnet</span></li>
              <li><strong>กดหมุน หมุนชิงช้า (10 $PIGGY)</strong><span>ยืนยันรายการและรอเครือข่ายบันทึก</span></li>
              <li><strong>รอผลสุ่มและกด Stop &amp; Reveal</strong><span>Chainlink VRF ส่งผลกลับแล้วกด Stop &amp; Reveal เพื่อดูรางวัลและรับ PIGGY</span></li>
            </ol><p className="inline-warning">PIGGY ใช้บนเครือข่ายทดลองและไม่มีมูลค่าเงินจริง</p></section>
          </div>
        ) : null}</div>
      </dialog>
    </>
  );
}
