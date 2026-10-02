"use client";

import { formatChainTimestamp, formatCountdown, formatPiggy } from "@/lib/format";
import { frontendConfig } from "@/lib/config";
import { requestStatusText, roundPhaseText, type UiState } from "@/lib/ui-state";
import { useSquidPot } from "@/lib/use-squidpot";
import { ClaimsPanel } from "@/components/ClaimsPanel";
import { PiggyBankTransactionFeedback } from "@/components/PiggyBankTransactionFeedback";
import { SessionActivityList } from "@/components/SessionActivity";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletConnection } from "@/components/WalletConnection";

const actionNames: Record<string, string> = {
  play: "เล่นเกม",
  approve: "อนุมัติใช้ PIGGY",
  settle: "ปิดรอบ",
  "claim-slot": "รับรางวัลจากการสุ่ม",
  "claim-previous": "รับส่วนแบ่งผู้เล่นก่อนหน้า",
  "claim-prize": "รับรางวัลประจำรอบ",
};

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
  const claim = (action: "claim-slot" | "claim-previous" | "claim-prize") => {
    const functionName = action === "claim-slot" ? "claimSlotRewards"
      : action === "claim-previous" ? "claimPreviousRewards" : "claimPrize";
    void pot.executeWrite(action, functionName);
  };

  const displayedState: UiState = pot.readyState;
  const confirmedMessage = pot.confirmedAction
    ? `ยืนยัน${actionNames[pot.confirmedAction] ?? "รายการ"}บนเครือข่ายแล้ว`
    : undefined;
  const stateDescription = !readsReady
    ? "กำลังอ่านข้อมูลจากสัญญา ปุ่มทำรายการจะใช้ได้เมื่ออ่านข้อมูลครบ"
    : readsReady && pot.isConnected && !balanceSufficient
      ? "ยอด PIGGY ของคุณยังไม่ถึง 10 PIGGY ซึ่งเป็นค่าเล่นต่อครั้ง"
      : undefined;
  const requestMessage = pot.latestRequest
    ? `คำขอสุ่ม ${pot.latestRequest.id}: ${requestStatusText(pot.latestRequest.status)}${pot.latestRequest.status === "FULFILLED" ? ` · ได้รับ ${formatPiggy(pot.latestRequest.reward)}` : pot.latestRequest.status === "EXPIRED" ? " · ระบบไม่ได้คืนค่าเล่น" : " · ยังไม่แสดงรางวัลจนกว่าจะสุ่มเสร็จ"}`
    : undefined;

  return (
    <div className={`page-stack dashboard ${walletPage ? "dashboard-wallet" : "dashboard-play"}`}>
      <section className="page-intro">
        <div className="intro-copy">
          <p className="eyebrow">เครือข่ายทดลอง BNB <span aria-hidden="true">·</span> สุ่มผลด้วย Chainlink</p>
          <h1>{walletPage ? "กระเป๋าของฉัน" : "ทดลองเล่นด้วย PIGGY"}</h1>
          <p>{walletPage
            ? "ดูยอด PIGGY และกดรับรางวัลที่เป็นของคุณ ข้อมูลอ่านจากสัญญาบนเครือข่ายโดยตรง"
            : "เชื่อมต่อกระเป๋า แล้วทำตามขั้นตอนที่ระบบแสดง ค่าเล่นครั้งละ 10 PIGGY และต้องรอเครือข่ายยืนยันผล"}</p>
        </div>
        {frontendConfig && !walletPage && (
          <div className="intro-stamp" aria-label="เครือข่ายที่ใช้งาน">
            <span className="stamp-label">เครือข่ายที่ใช้งาน</span>
            <strong>เครือข่ายทดลอง BNB Smart Chain</strong>
            <span>รหัสเครือข่าย {frontendConfig.chainId}</span>
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

      <TransactionStatus state={displayedState} hash={pot.transactionHash} error={pot.transactionError}
        description={stateDescription}
        confirmedMessage={confirmedMessage}
        secondaryMessage={requestMessage && (displayedState === "VRF_WAITING" || displayedState === "VRF_FULFILLED" || displayedState === "VRF_EXPIRED") ? requestMessage : undefined} />

      {walletPage ? (
        <>
          <section className="card" aria-labelledby="wallet-values-heading">
            <p className="eyebrow">ข้อมูลจากกระเป๋า</p>
            <h2 id="wallet-values-heading">ยอด PIGGY ของฉัน</h2>
            <dl className="metric-grid two-column">
              <div><dt>ที่อยู่กระเป๋า</dt><dd title={pot.address}>{pot.address ?? "ยังไม่ได้เชื่อมต่อ"}</dd></div>
              <div><dt>ยอดคงเหลือ</dt><dd>{pot.isConnected && pot.tokenBalance === undefined ? "กำลังอ่านยอด…" : formatPiggy(pot.tokenBalance)}</dd></div>
              <div><dt>ยอดที่อนุมัติให้สัญญาใช้</dt><dd>{formatPiggy(pot.allowance)}</dd></div>
              <div><dt>เครือข่าย</dt><dd>{pot.correctNetwork ? "เครือข่ายทดลอง BNB Smart Chain" : "ยังไม่ได้เชื่อมต่อเครือข่ายทดลอง"}</dd></div>
            </dl>
            {approvalNeeded && <button className="button button-primary" disabled={!pot.correctNetwork || isActive} onClick={() => void pot.executeWrite("approve", "approve")}>อนุมัติใช้ 10 PIGGY</button>}
            {pot.isConnected && !pot.correctNetwork && <p className="muted">เปลี่ยนเครือข่ายในกระเป๋าเป็น BNB Smart Chain Testnet ก่อนทำรายการ</p>}
          </section>
          <ClaimsPanel slot={pot.pendingSlotRewards} previous={pot.pendingPreviousRewards} prize={pot.pendingPrize} busy={isActive || !pot.correctNetwork} onClaim={claim} />
          <SessionActivityList activity={pot.activity} requests={pot.requests} />
        </>
      ) : (
        <>
          <section className="card play-controls-card" aria-labelledby="play-controls-heading">
            <div className="section-heading">
              <div><p className="eyebrow">เริ่มเล่น</p><h2 id="play-controls-heading">เล่นรอบนี้</h2></div>
              <span className="entry-amount">10 <small>PIGGY / ครั้ง</small></span>
            </div>
            <div className="balance-summary">
              <span>ยอด PIGGY ของคุณ</span>
              <strong>{pot.isConnected ? pot.tokenBalance === undefined ? "กำลังอ่านยอด…" : formatPiggy(pot.tokenBalance) : "เชื่อมต่อกระเป๋าเพื่อดูยอด"}</strong>
            </div>
            {approvalNeeded && (
              <div className="next-action">
                <p>ก่อนเล่น ต้องอนุมัติให้สัญญาใช้ 10 PIGGY</p>
                <button className="button button-secondary" disabled={!pot.correctNetwork || isActive} onClick={() => void pot.executeWrite("approve", "approve")}>อนุมัติใช้ 10 PIGGY</button>
              </div>
            )}
            <div className="button-row play-actions">
              <button className="button button-primary play-button" disabled={!canPlay} onClick={() => void pot.executeWrite("play", "play")}>
                เล่นเลย · 10 PIGGY
              </button>
              {pot.roundPhase === "Expired" && <button className="button button-secondary" disabled={!canSettle} onClick={() => void pot.executeWrite("settle", "settleRound")}>ปิดรอบ</button>}
            </div>
            {!pot.isConnected && <p className="muted">เริ่มจากเชื่อมต่อกระเป๋าด้านบน แล้วระบบจะแสดงปุ่มที่ต้องกดต่อ</p>}
            {pot.isConnected && !pot.correctNetwork && <p className="inline-warning">เปลี่ยนเครือข่ายเป็นเครือข่ายทดลอง BNB Smart Chain ก่อนเล่น</p>}
            {readsReady && pot.isConnected && !balanceSufficient && <p className="inline-warning" role="status">ยอดของคุณยังไม่ถึง 10 PIGGY ซึ่งเป็นค่าเล่นต่อครั้ง</p>}
            {readsReady && pot.isConnected && !balanceSufficient && <p className="muted">หากยังไม่มี PIGGY โปรดขอรับจากผู้ดูแลการทดลองให้โอนบนเครือข่ายทดลอง</p>}
            {pot.readError && <p className="inline-error" role="alert">อ่านข้อมูลจากสัญญาไม่สำเร็จ ตรวจสอบการเชื่อมต่อเครือข่ายแล้วลองใหม่</p>}
          </section>

          <section className="card round-summary-card" aria-labelledby="round-summary-heading">
            <div className="section-heading">
              <div><p className="eyebrow">ข้อมูลจากสัญญาบนเครือข่าย</p><h2 id="round-summary-heading">สถานะรอบปัจจุบัน</h2></div>
              <span className={`status-pill ${pot.roundPhase === "Open" ? "status-ok" : "status-neutral"}`}>{roundPhaseText(pot.roundPhase)}</span>
            </div>
            <dl className="metric-grid two-column round-highlights">
              <div><dt>รางวัลประจำรอบ</dt><dd>{formatPiggy(pot.currentPrizePool)}</dd></div>
              <div><dt>{pot.roundPhase === "Waiting" ? "สถานะเวลา" : "เวลาที่เหลือ"}</dt><dd>{pot.roundPhase === "Waiting" ? "รอผู้เล่นเริ่มรอบ" : countdown ?? "กำลังอ่านข้อมูล"}</dd></div>
            </dl>
            <details className="advanced-rules round-details">
              <summary>ดูข้อมูลรอบเพิ่มเติม</summary>
              <dl className="metric-grid two-column">
                <div><dt>หมายเลขรอบ</dt><dd>{pot.currentRoundId?.toString() ?? "—"}</dd></div>
                <div><dt>ยอดสำรองรางวัลสุ่ม</dt><dd>{formatPiggy(pot.availableSlotReserve)}</dd></div>
                <div><dt>คำขอสุ่มที่กำลังรอ</dt><dd>{waitCount}</dd></div>
                <div><dt>เวลาปิดรอบสูงสุด</dt><dd>{formatChainTimestamp(pot.hardDeadline)}</dd></div>
                <div><dt>สถานะระบบ</dt><dd>{pot.paused === undefined ? "กำลังอ่านข้อมูล" : pot.paused ? "พักการเล่น" : "เปิดใช้งาน"}</dd></div>
                <div><dt>ผู้เล่นคนล่าสุด</dt><dd title={pot.lastPlayer}>{pot.lastPlayer ?? "ยังไม่มี"}</dd></div>
              </dl>
            </details>
            {pot.roundPhase === "Expired" && <p className="inline-warning" role="status">หมดเวลารอบแล้ว ผู้เล่นคนสุดท้ายที่บันทึกไว้มีสิทธิ์รับรางวัล ใครก็ได้ช่วยกดปิดรอบได้</p>}
            {pot.roundPhase === "Open" && pot.deadline !== undefined && pot.chainTimestamp !== undefined && pot.deadline <= pot.chainTimestamp && <p className="muted">ถึงเวลาปิดรอบแล้ว กำลังรอข้อมูลยืนยันจากสัญญา</p>}
          </section>

          <div className="content-grid">
            <ClaimsPanel slot={pot.pendingSlotRewards} previous={pot.pendingPreviousRewards} prize={pot.pendingPrize} busy={isActive || !pot.correctNetwork} onClaim={claim} />
            <PiggyBankTransactionFeedback confirmedEventId={pot.confirmedPlayEvent} />
          </div>

          <SessionActivityList activity={pot.activity} requests={pot.requests} />
        </>
      )}
    </div>
  );
}
