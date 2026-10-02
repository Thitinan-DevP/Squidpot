"use client";

import { frontendConfig } from "@/lib/config";
import type { RequestView } from "@/lib/use-squidpot";
import type { SessionActivity } from "@/lib/format";

const actionLabel: Record<SessionActivity["action"], string> = {
  play: "Play",
  approve: "Token approval",
  settle: "Round settlement",
  "claim-slot": "Slot reward claim",
  "claim-previous": "Previous-player claim",
  "claim-prize": "Prize claim",
};

export function SessionActivityList({ activity, requests }: { activity: SessionActivity[]; requests: RequestView[] }) {
  return (
    <section className="card" aria-labelledby="session-activity-heading">
      <div className="section-heading"><div><p className="eyebrow">This browser session only</p><h2 id="session-activity-heading">Session activity</h2></div></div>
      <p className="muted">Only transactions and request IDs observed in this browser session are listed. This is not a complete or permanent history.</p>
      {activity.length === 0 ? <p>No activity has been observed in this browser session.</p> : (
        <ul className="activity-list">
          {activity.map((entry) => {
            const request = entry.requestId ? requests.find((item) => item.id === entry.requestId) : undefined;
            const href = frontendConfig?.chainId === 97 && entry.hash ? `https://testnet.bscscan.com/tx/${entry.hash}` : undefined;
            return (
              <li key={entry.id}>
                <div>
                  <strong>{actionLabel[entry.action]}</strong>
                  <span>{entry.status}{entry.requestId ? ` · Request ${entry.requestId} · ${request?.status ?? "Reading contract status"}` : ""}</span>
                </div>
                {entry.hash && (href
                  ? <a href={href} target="_blank" rel="noreferrer">View transaction</a>
                  : <code title={entry.hash}>{entry.hash.slice(0, 10)}…{entry.hash.slice(-8)}</code>)}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
