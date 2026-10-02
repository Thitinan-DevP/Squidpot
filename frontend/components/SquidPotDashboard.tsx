"use client";

import { formatChainTimestamp, formatCountdown, formatPiggy } from "@/lib/format";
import { frontendConfig } from "@/lib/config";
import { uiStateMessages, type UiState } from "@/lib/ui-state";
import { useSquidPot } from "@/lib/use-squidpot";
import { ClaimsPanel } from "@/components/ClaimsPanel";
import { PiggyBankTransactionFeedback } from "@/components/PiggyBankTransactionFeedback";
import { SessionActivityList } from "@/components/SessionActivity";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletConnection } from "@/components/WalletConnection";

export function SquidPotDashboard({ walletPage = false }: { walletPage?: boolean }) {
  const pot = useSquidPot();
  const waitCount = pot.activePendingRequests !== undefined && pot.maxRequests !== undefined
    ? `${pot.activePendingRequests.toString()} / ${pot.maxRequests.toString()}` : "—";
  const countdown = formatCountdown(pot.deadline, pot.chainTimestamp);
  const chainReadsReady = pot.fundingInitialized !== undefined && pot.entryFee !== undefined && pot.roundPhase !== "Unavailable";
  const walletReadsReady = !pot.isConnected || (pot.tokenBalance !== undefined && pot.allowance !== undefined);
  const readsReady = chainReadsReady && walletReadsReady;
  const balanceSufficient = pot.isConnected && pot.tokenBalance !== undefined && pot.entryFee !== undefined && pot.tokenBalance >= pot.entryFee;
  const approvalNeeded = pot.isConnected && pot.allowance !== undefined && pot.entryFee !== undefined && pot.allowance < pot.entryFee;
  const isActive = pot.transactionState !== undefined;
  const canPlay = readsReady && pot.isConnected && pot.fundingInitialized && balanceSufficient && pot.readyState === "READY_TO_PLAY" && !isActive;
  const canSettle = pot.roundPhase === "Expired" && pot.correctNetwork && pot.isConnected && !isActive;
  const latestIsExpired = pot.latestRequest?.status === "EXPIRED";
  const claim = (action: "claim-slot" | "claim-previous" | "claim-prize") => {
    const functionName = action === "claim-slot" ? "claimSlotRewards"
      : action === "claim-previous" ? "claimPreviousRewards" : "claimPrize";
    void pot.executeWrite(action, functionName);
  };

  const displayedState: UiState = pot.readyState;
  const confirmedMessage = pot.confirmedAction
    ? `${pot.confirmedAction === "play" ? "Play" : pot.confirmedAction.replaceAll("-", " ")} transaction confirmed on-chain.`
    : undefined;

  return (
    <div className={`page-stack dashboard ${walletPage ? "dashboard-wallet" : "dashboard-play"}`}>
      <section className="page-intro">
        <div className="intro-copy">
          <p className="eyebrow">{frontendConfig?.chain.name ?? "Academic Web3 prototype"} <span aria-hidden="true">·</span> VRF v2.5</p>
          <h1>{walletPage ? "Your wallet" : "Play with PIGGY"}</h1>
          <p>{walletPage ? "Balances and claimable amounts are read directly from the deployed contracts." : "A transparent research game. Follow the round, make a play, and track every confirmed on-chain step."}</p>
        </div>
        {frontendConfig && !walletPage && (
          <div className="intro-stamp" aria-label="Deployment network">
            <span className="stamp-label">LIVE CONTRACT DATA</span>
            <strong>{frontendConfig.chain.name}</strong>
            <span>Chain ID {frontendConfig.chainId}</span>
          </div>
        )}
      </section>

      <WalletConnection
        address={pot.address}
        chainId={pot.chainId}
        isConnected={pot.isConnected}
        correctNetwork={pot.correctNetwork}
        connect={pot.connectWallet}
        disconnect={pot.disconnect}
        switchNetwork={pot.switchToConfiguredChain}
      />

      {walletPage ? (
        <>
          <section className="card" aria-labelledby="wallet-values-heading">
            <p className="eyebrow">Direct contract reads</p><h2 id="wallet-values-heading">Wallet values</h2>
            <dl className="metric-grid two-column">
              <div><dt>Wallet address</dt><dd title={pot.address}>{pot.address ?? "Not connected"}</dd></div>
              <div><dt>PIGGY balance</dt><dd>{formatPiggy(pot.tokenBalance)}</dd></div>
              <div><dt>PIGGY allowance</dt><dd>{formatPiggy(pot.allowance)}</dd></div>
              <div><dt>Network</dt><dd>{pot.correctNetwork ? (frontendConfig?.chain.name ?? "Configured network") : "Not on configured network"}</dd></div>
              <div><dt>Chain ID</dt><dd>{pot.chainId ?? "—"}</dd></div>
            </dl>
            {approvalNeeded && <button className="button button-primary" disabled={!pot.correctNetwork || isActive} onClick={() => void pot.executeWrite("approve", "approve")}>Approve exactly 10 PIGGY</button>}
          </section>
          <ClaimsPanel slot={pot.pendingSlotRewards} previous={pot.pendingPreviousRewards} prize={pot.pendingPrize} busy={isActive || !pot.correctNetwork} onClaim={claim} />
          <SessionActivityList activity={pot.activity} requests={pot.requests} />
        </>
      ) : (
        <>
          <section className="card round-summary-card" aria-labelledby="round-summary-heading">
            <div className="section-heading"><div><p className="eyebrow">Confirmed contract state</p><h2 id="round-summary-heading">Current round</h2></div><span className={`status-pill ${pot.roundPhase === "Open" ? "status-ok" : "status-neutral"}`}>{pot.roundPhase}</span></div>
            <dl className="metric-grid">
              <div><dt>Current prize pool</dt><dd>{formatPiggy(pot.currentPrizePool)}</dd></div>
              <div><dt>Round ID</dt><dd>{pot.currentRoundId?.toString() ?? "—"}</dd></div>
              <div><dt>Countdown</dt><dd>{pot.roundPhase === "Waiting" ? "No countdown while waiting" : countdown ?? "Reading latest block"}</dd></div>
              <div><dt>Available Slot Reserve</dt><dd>{formatPiggy(pot.availableSlotReserve)}</dd></div>
              <div><dt>Active pending requests</dt><dd>{waitCount}</dd></div>
              <div><dt>Hard deadline</dt><dd>{formatChainTimestamp(pot.hardDeadline)}</dd></div>
              <div><dt>Pause status</dt><dd>{pot.paused === undefined ? "Reading contract" : pot.paused ? "Paused" : "Not paused"}</dd></div>
              <div><dt>Recorded last player</dt><dd>{pot.lastPlayer ?? "—"}</dd></div>
            </dl>
            {pot.roundPhase === "Expired" && <p className="inline-warning" role="status">Round expired — settlement required. The recorded last player receives the prize, not necessarily the caller.</p>}
            {pot.roundPhase === "Open" && pot.deadline !== undefined && pot.chainTimestamp !== undefined && pot.deadline <= pot.chainTimestamp && <p className="muted">The latest block has reached the deadline; waiting for the contract’s next confirmed round-status read.</p>}
          </section>

          <section className="card play-controls-card" aria-labelledby="play-controls-heading">
            <div className="section-heading"><div><p className="eyebrow">Entry</p><h2 id="play-controls-heading">Play the round</h2></div><span className="entry-amount">10 <small>PIGGY</small></span></div>
            <dl className="metric-grid two-column">
              <div><dt>Your PIGGY balance</dt><dd>{pot.isConnected ? formatPiggy(pot.tokenBalance) : "Connect wallet to view"}</dd></div>
              <div><dt>Your PIGGY allowance</dt><dd>{pot.isConnected ? formatPiggy(pot.allowance) : "Connect wallet to view"}</dd></div>
            </dl>
            {approvalNeeded && <button className="button button-secondary" disabled={!pot.correctNetwork || isActive} onClick={() => void pot.executeWrite("approve", "approve")}>Approve exactly 10 PIGGY</button>}
            <div className="button-row play-actions">
              <button className="button button-primary play-button" disabled={!canPlay} onClick={() => void pot.executeWrite("play", "play")}>
                Play · 10 PIGGY
              </button>
              <button className="button button-secondary" disabled={!canSettle} onClick={() => void pot.executeWrite("settle", "settleRound")}>Settle round</button>
            </div>
            {!chainReadsReady && pot.isConnected && pot.correctNetwork && <p className="muted" role="status">Reading confirmed contract state. Actions remain disabled until required values are available.</p>}
            {chainReadsReady && !pot.isConnected && <p className="muted" role="status">Round values are live from the contract. Connect a wallet to view your balance or play.</p>}
            {pot.isConnected && chainReadsReady && !walletReadsReady && <p className="muted" role="status">Reading your wallet values from the configured contracts.</p>}
            {readsReady && pot.isConnected && !balanceSufficient && <p className="inline-warning" role="status">Your confirmed PIGGY balance is below the 10 PIGGY entry.</p>}
            {pot.readError && <p className="inline-error" role="alert">Contract reads failed. Retry or check the configured RPC; values are not substituted.</p>}
          </section>

          <div className="content-grid">
            <ClaimsPanel slot={pot.pendingSlotRewards} previous={pot.pendingPreviousRewards} prize={pot.pendingPrize} busy={isActive || !pot.correctNetwork} onClaim={claim} />
            <PiggyBankTransactionFeedback confirmedEventId={pot.confirmedPlayEvent} />
          </div>

          <TransactionStatus state={displayedState} hash={pot.transactionHash} error={pot.transactionError}
            description={!readsReady ? "Reading confirmed contract state. No gameplay values are substituted." : readsReady && !balanceSufficient ? "Your confirmed PIGGY balance is below the 10 PIGGY entry; Play is disabled." : undefined}
            confirmedMessage={confirmedMessage ?? (pot.latestRequest ? `Request ${pot.latestRequest.id}: ${pot.latestRequest.status}${pot.latestRequest.status === "FULFILLED" ? ` · reward ${formatPiggy(pot.latestRequest.reward)}` : latestIsExpired ? " · entry fee is not refunded" : " · no reward displayed until fulfillment"}` : uiStateMessages[displayedState])} />

          <SessionActivityList activity={pot.activity} requests={pot.requests} />
        </>
      )}
    </div>
  );
}
