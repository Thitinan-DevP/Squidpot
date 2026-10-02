"use client";

import { formatPiggy } from "@/lib/format";

type Claim = { label: string; amount?: bigint; action: "claim-slot" | "claim-previous" | "claim-prize" };
type Props = { slot?: bigint; previous?: bigint; prize?: bigint; busy: boolean; onClaim: (action: Claim["action"]) => void };

export function ClaimsPanel({ slot, previous, prize, busy, onClaim }: Props) {
  const claims: Claim[] = [
    { label: "รางวัลจากการสุ่ม", amount: slot, action: "claim-slot" },
    { label: "ส่วนแบ่งผู้เล่นก่อนหน้า", amount: previous, action: "claim-previous" },
    { label: "รางวัลประจำรอบ", amount: prize, action: "claim-prize" },
  ];
  return (
    <section className="card" aria-labelledby="claims-heading">
      <div className="section-heading"><div><p className="eyebrow">ยอดที่รับได้</p><h2 id="claims-heading">รางวัลของฉัน</h2></div></div>
      <div className="claim-list">
        {claims.map((claim) => (
          <div className="claim-row" key={claim.action}>
            <div><span>{claim.label}</span><strong>{formatPiggy(claim.amount)}</strong></div>
            <button
              className="button button-secondary"
              disabled={busy || claim.amount === undefined || claim.amount === BigInt(0)}
              onClick={() => onClaim(claim.action)}
            >{claim.amount === undefined ? "กำลังอ่าน" : claim.amount === BigInt(0) ? "ยังไม่มี" : "รับ PIGGY"}</button>
          </div>
        ))}
      </div>
      <p className="muted">ยอดรางวัลจะเปลี่ยนหลังเครือข่ายยืนยันรายการรับแล้วเท่านั้น</p>
    </section>
  );
}
