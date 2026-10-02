"use client";

import { frontendConfig } from "@/lib/config";
import type { RequestView } from "@/lib/use-squidpot";
import type { SessionActivity } from "@/lib/format";
import { activityStatusText, requestStatusText } from "@/lib/ui-state";

const actionLabel: Record<SessionActivity["action"], string> = {
  play: "เล่นเกม",
  approve: "อนุมัติใช้ PIGGY",
  settle: "ปิดรอบ",
  "claim-slot": "รับรางวัลจากการสุ่ม",
  "claim-previous": "รับส่วนแบ่งผู้เล่นก่อนหน้า",
  "claim-prize": "รับรางวัลประจำรอบ",
};

export function SessionActivityList({ activity, requests }: { activity: SessionActivity[]; requests: RequestView[] }) {
  return (
    <section className="card" aria-labelledby="session-activity-heading">
      <div className="section-heading"><div><p className="eyebrow">เฉพาะอุปกรณ์นี้</p><h2 id="session-activity-heading">รายการล่าสุด</h2></div></div>
      <p className="muted">แสดงเฉพาะรายการที่หน้านี้เห็นระหว่างเปิดใช้งาน ประวัตินี้ไม่ถาวร</p>
      {activity.length === 0 ? <p>ยังไม่มีรายการ</p> : (
        <ul className="activity-list">
          {activity.map((entry) => {
            const request = entry.requestId ? requests.find((item) => item.id === entry.requestId) : undefined;
            const href = frontendConfig?.chainId === 97 && entry.hash ? `https://testnet.bscscan.com/tx/${entry.hash}` : undefined;
            return (
              <li key={entry.id}>
                <div>
                  <strong>{actionLabel[entry.action]}</strong>
                  <span>{activityStatusText(entry.status)}{entry.requestId ? ` · คำขอสุ่ม ${entry.requestId} · ${requestStatusText(request?.status ?? "")}` : ""}</span>
                </div>
                {entry.hash && (href
                  ? <a href={href} target="_blank" rel="noreferrer">ดูรายการบน BscScan</a>
                  : <code title={entry.hash}>{entry.hash.slice(0, 10)}…{entry.hash.slice(-8)}</code>)}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
