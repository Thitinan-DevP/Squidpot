"use client";

import { formatPiggy } from "@/lib/format";

type Claim = { label: string; amount?: bigint; action: "claim-slot" | "claim-previous" | "claim-prize" };
type Props = { slot?: bigint; previous?: bigint; prize?: bigint; busy: boolean; onClaim: (action: Claim["action"]) => void };

export function ClaimsPanel({ slot, previous, prize, busy, onClaim }: Props) {
  const claims: Claim[] = [
    { label: "Slot rewards", amount: slot, action: "claim-slot" },
    { label: "Previous-player rewards", amount: previous, action: "claim-previous" },
    { label: "Prize", amount: prize, action: "claim-prize" },
  ];
  return (
    <section className="card" aria-labelledby="claims-heading">
      <div className="section-heading"><div><p className="eyebrow">Pull payments</p><h2 id="claims-heading">Your pending claims</h2></div></div>
      <div className="claim-list">
        {claims.map((claim) => (
          <div className="claim-row" key={claim.action}>
            <div><span>{claim.label}</span><strong>{formatPiggy(claim.amount)}</strong></div>
            <button
              className="button button-secondary"
              disabled={busy || claim.amount === undefined || claim.amount === BigInt(0)}
              onClick={() => onClaim(claim.action)}
            >Claim</button>
          </div>
        ))}
      </div>
      <p className="muted">Claim values remain unchanged until the matching transaction receipt confirms.</p>
    </section>
  );
}
