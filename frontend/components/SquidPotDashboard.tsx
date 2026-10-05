"use client";

import { formatPiggy } from "@/lib/format";
import { frontendConfig } from "@/lib/config";
import { requestStatusText, type UiState } from "@/lib/ui-state";
import { useSquidPot } from "@/lib/use-squidpot";
import { ClaimsPanel } from "@/components/ClaimsPanel";
import { RewardWheel } from "@/components/RewardWheel";
import { SessionActivityList } from "@/components/SessionActivity";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletConnection } from "@/components/WalletConnection";

const actionNames: Record<string, string> = {
  play: "หมุนวงล้อ",
  approve: "อนุมัติใช้ PIGGY",
  settle: "ปิดรอบ",
  "claim-slot": "รับรางวัลจากการสุ่ม",
  "claim-previous": "รับส่วนแบ่งผู้เล่นก่อนหน้า",
  "claim-prize": "รับรางวัลประจำรอบ",
};

export function SquidPotDashboard({ walletPage = false }: { walletPage?: boolean }) {
  const pot = useSquidPot();
  const chainReadsReady = pot.fundingInitialized !== undefined && pot.entryFee !== undefined && pot.roundPhase !== "Unavailable";
  const walletReadsReady = !pot.isConnected || (pot.tokenBalance !== undefined && pot.allowance !== undefined);
  const readsReady = chainReadsReady && walletReadsReady;
  const balanceSufficient = pot.isConnected && pot.tokenBalance !== undefined && pot.entryFee !== undefined && pot.tokenBalance >= pot.entryFee;
  const isActive = pot.transactionState !== undefined;

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
      {walletPage ? (
        <>
          <section className="page-intro">
            <div className="intro-copy">
              <p className="eyebrow">เครือข่ายทดลอง BNB <span aria-hidden="true">·</span> สุ่มผลด้วย Chainlink VRF v2.5</p>
              <h1>กระเป๋าของฉัน</h1>
              <p>ดูยอด PIGGY และกดรับรางวัลที่เป็นของคุณ ข้อมูลอ่านจากสัญญาบนเครือข่ายโดยตรง</p>
            </div>
            {frontendConfig && (
              <div className="intro-stamp" aria-label="เครือข่ายที่ใช้งาน">
                <span className="stamp-label">เครือข่ายที่ใช้งาน</span>
                <strong>เครือข่ายทดลอง BNB Smart Chain</strong>
                <span>รหัสเครือข่าย {frontendConfig.chainId}</span>
              </div>
            )}
          </section>

          {/* รางวัลของฉัน — แสดงก่อนเสมอ */}
          <ClaimsPanel slot={pot.pendingSlotRewards} previous={pot.pendingPreviousRewards} prize={pot.pendingPrize} busy={isActive || !pot.correctNetwork} onClaim={claim} compact />

          <WalletConnection
            address={pot.address}
            chainId={pot.chainId}
            isConnected={pot.isConnected}
            correctNetwork={pot.correctNetwork}
            connect={pot.connectWallet}
            disconnect={pot.disconnect}
            switchNetwork={pot.switchToConfiguredChain}
          />

          {(pot.transactionState || pot.transactionError || !pot.isConnected || !pot.correctNetwork) && (
            <TransactionStatus
              state={displayedState}
              hash={pot.transactionHash}
              error={pot.transactionError}
              description={stateDescription}
              confirmedMessage={confirmedMessage}
              secondaryMessage={requestMessage && (displayedState === "VRF_WAITING" || displayedState === "VRF_EXPIRED") ? requestMessage : undefined}
            />
          )}



          <SessionActivityList activity={pot.activity} requests={pot.requests} />
        </>
      ) : (
        <>
          {/* Main 100vh Single-Screen Play Interface */}
          <RewardWheel
            canSpin={pot.canSpin}
            approvalNeeded={pot.approvalNeeded}
            isActionBusy={isActive}
            transactionState={pot.transactionState}
            latestRequest={pot.latestRequest}
            onSpin={() => void pot.spinForTenPiggy()}
            onClaimReward={() => claim("claim-slot")}
            tokenBalance={pot.tokenBalance}
            entryFee={pot.entryFee}
            errorMessage={pot.transactionError}
            pendingRewards={pot.pendingSlotRewards}
            recentResults={
              pot.requests
                .filter((r) => r.status === "FULFILLED")
                .slice(0, 4)
                .map((r) => formatPiggy(r.reward))
                .length > 0
                ? pot.requests
                    .filter((r) => r.status === "FULFILLED")
                    .slice(0, 4)
                    .map((r) => formatPiggy(r.reward))
                : ["0 $PIGGY", "10 $PIGGY", "20 $PIGGY"]
            }
            isConnected={pot.isConnected}
            correctNetwork={pot.correctNetwork}
            onConnect={pot.connectWallet}
            onSwitchNetwork={pot.switchToConfiguredChain}
          />
        </>
      )}
    </div>
  );
}
