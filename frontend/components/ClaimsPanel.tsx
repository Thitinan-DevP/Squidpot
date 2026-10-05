"use client";

import { formatPiggy } from "@/lib/format";

type Props = { slot?: bigint; previous?: bigint; prize?: bigint; busy: boolean; onClaim: (action: "claim-slot" | "claim-previous" | "claim-prize") => void };

export function ClaimsPanel({ slot, busy, onClaim }: Props) {
  const hasReward = slot !== undefined && slot > BigInt(0);
  return (
    <section className="card" aria-labelledby="claims-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ยอดที่รับได้</p>
          <h2 id="claims-heading">รางวัลของฉัน</h2>
        </div>
      </div>
      <div className="claim-list">
        <div className="claim-row">
          <div>
            <span>รางวัลจากการสุ่มวงล้อ</span>
            <strong>{formatPiggy(slot)}</strong>
          </div>
          <button
            className="button button-primary"
            disabled={busy || !hasReward}
            onClick={() => onClaim("claim-slot")}
          >
            {slot === undefined ? "กำลังอ่าน..." : hasReward ? "ถอนรางวัล" : "ยังไม่มีรางวัล"}
          </button>
        </div>
      </div>
    </section>
  );
}
