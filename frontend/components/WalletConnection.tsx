"use client";

import { useState } from "react";
import { shortAddress } from "@/lib/format";
import { friendlyWalletError } from "@/lib/ui-state";

type Props = {
  address?: string;
  chainId?: number;
  isConnected: boolean;
  correctNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
};

export function WalletConnection({ address, chainId, isConnected, correctNetwork, connect, disconnect, switchNetwork }: Props) {
  const [error, setError] = useState<string>();
  const runWalletAction = async (action: () => Promise<void>) => {
    setError(undefined);
    try {
      await action();
    } catch (cause) {
      setError(friendlyWalletError(cause));
    }
  };

  return (
    <section className="card wallet-card" aria-labelledby="wallet-connection-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ขั้นตอนที่ 1</p>
          <h2 id="wallet-connection-heading">เชื่อมต่อกระเป๋า</h2>
        </div>
        <span className={`status-pill ${isConnected && correctNetwork ? "status-ok" : "status-neutral"}`}>
          {isConnected ? (correctNetwork ? "เชื่อมต่อแล้ว" : "เครือข่ายไม่ตรง") : "ยังไม่เชื่อมต่อ"}
        </span>
      </div>
      <dl className="wallet-details">
        <div><dt>ที่อยู่กระเป๋า</dt><dd title={address}>{shortAddress(address)}</dd></div>
        <div><dt>เครือข่ายในกระเป๋า</dt><dd>{chainId === 97 ? "เครือข่ายทดลอง BNB Smart Chain" : chainId ? `เครือข่ายอื่น (รหัส ${chainId})` : "ยังไม่เชื่อมต่อ"}</dd></div>
      </dl>
      <div className="button-row">
        {!isConnected ? <button className="button button-primary" onClick={() => void runWalletAction(connect)}>เชื่อมต่อกระเป๋า</button> : (
          <>
            {!correctNetwork && <button className="button button-secondary" onClick={() => void runWalletAction(switchNetwork)}>เปลี่ยนเป็นเครือข่ายทดลอง BNB</button>}
            <button className="button button-quiet" onClick={disconnect}>ยกเลิกการเชื่อมต่อ</button>
          </>
        )}
      </div>
      {!isConnected && <p className="muted">ใช้กระเป๋าอย่าง MetaMask และเลือกเครือข่ายทดลอง BNB Smart Chain</p>}
      {isConnected && !correctNetwork && <p className="inline-warning" role="alert">ต้องเปลี่ยนเครือข่ายเป็นเครือข่ายทดลอง BNB Smart Chain (รหัสเครือข่าย {process.env.NEXT_PUBLIC_CHAIN_ID || "97"}) ก่อนทำรายการ</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
  );
}
