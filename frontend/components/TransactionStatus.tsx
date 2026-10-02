"use client";

import type { UiState } from "@/lib/ui-state";
import { uiStateMessages } from "@/lib/ui-state";

type Props = { state: UiState; hash?: string; error?: string; confirmedMessage?: string; description?: string };

export function TransactionStatus({ state, hash, error, confirmedMessage, description }: Props) {
  return (
    <section className="card transaction-card" aria-label="Transaction status" aria-labelledby="transaction-status-heading" aria-live="polite" aria-atomic="true">
      <p className="eyebrow">Transaction status</p>
      <h2 id="transaction-status-heading">{state.replaceAll("_", " ")}</h2>
      <p>{description ?? uiStateMessages[state]}</p>
      {confirmedMessage && <p className="confirmed-message" role="status">{confirmedMessage}</p>}
      {hash && <p className="hash-line">Transaction: <code>{hash}</code></p>}
      {error && <details className="error-details"><summary>Transaction details</summary><p>{error}</p></details>}
    </section>
  );
}
