"use client";

import type { UiState } from "@/lib/ui-state";
import { uiStateMessages, uiStateTitles } from "@/lib/ui-state";

type Props = { state: UiState; hash?: string; error?: string; confirmedMessage?: string; secondaryMessage?: string; description?: string };

export function TransactionStatus({ state, hash, error, confirmedMessage, secondaryMessage, description }: Props) {
  return (
    <section className="card transaction-card" aria-label="สถานะการใช้งาน" aria-labelledby="transaction-status-heading" aria-live="polite" aria-atomic="true">
      <p className="eyebrow">ขั้นตอนถัดไป</p>
      <h2 id="transaction-status-heading">{uiStateTitles[state]}</h2>
      <p>{description ?? uiStateMessages[state]}</p>
      {confirmedMessage && <p className="confirmed-message" role="status">{confirmedMessage}</p>}
      {secondaryMessage && <p className="muted">{secondaryMessage}</p>}
      {hash && <p className="hash-line">รหัสรายการ: <code>{hash}</code></p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
  );
}
