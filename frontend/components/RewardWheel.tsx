"use client";

import { useState, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import type { RequestView } from "@/lib/use-squidpot";
import type { UiState } from "@/lib/ui-state";

export const WHEEL_SEGMENTS = [
  { label: "No Reward", rewardValue: BigInt(0), angle: 0, color: "#8e0d16", textFill: "#ffffff" },
  { label: "10 PIGGY", rewardValue: BigInt(10) * BigInt(10 ** 18), angle: -90, color: "#8e0d16", textFill: "#ffffff" },
  { label: "20 PIGGY", rewardValue: BigInt(20) * BigInt(10 ** 18), angle: -180, color: "#8e0d16", textFill: "#ffffff" },
  { label: "50 PIGGY", rewardValue: BigInt(50) * BigInt(10 ** 18), angle: -270, color: "#8e0d16", textFill: "#ffffff" },
] as const;

export const CARNIVAL_SLICES = [
  { deg: 0, color: "#e60000", type: "zero" },
  { deg: 15, color: "#ffffff", type: "10" },
  { deg: 30, color: "#e60000", type: "zero" },
  { deg: 45, color: "#ffffff", type: "20" },
  { deg: 60, color: "#e60000", type: "zero" },
  { deg: 75, color: "#ffffff", type: "10" },
  { deg: 90, color: "#e60000", type: "zero" },
  { deg: 105, color: "#ffffff", type: "50" },
  { deg: 120, color: "#e60000", type: "zero" },
  { deg: 135, color: "#ffffff", type: "10" },
  { deg: 150, color: "#e60000", type: "zero" },
  { deg: 165, color: "#ffffff", type: "20" },
  { deg: 180, color: "#e60000", type: "zero" },
  { deg: 195, color: "#ffffff", type: "10" },
  { deg: 210, color: "#e60000", type: "zero" },
  { deg: 225, color: "#ffffff", type: "50" },
  { deg: 240, color: "#e60000", type: "zero" },
  { deg: 255, color: "#ffffff", type: "10" },
  { deg: 270, color: "#e60000", type: "zero" },
  { deg: 285, color: "#ffffff", type: "20" },
  { deg: 300, color: "#e60000", type: "zero" },
  { deg: 315, color: "#ffffff", type: "10" },
  { deg: 330, color: "#e60000", type: "zero" },
  { deg: 345, color: "#ffd000", type: "100" },
] as const;

export const CARNIVAL_BULBS = [
  { cx: 150.00, cy: 17.00, color: "#ffffff" },
  { cx: 184.42, cy: 21.53, color: "#f5b300" },
  { cx: 216.50, cy: 34.82, color: "#ffffff" },
  { cx: 244.05, cy: 55.95, color: "#f5b300" },
  { cx: 265.18, cy: 83.50, color: "#ffffff" },
  { cx: 278.47, cy: 115.58, color: "#f5b300" },
  { cx: 283.00, cy: 150.00, color: "#ffffff" },
  { cx: 278.47, cy: 184.42, color: "#f5b300" },
  { cx: 265.18, cy: 216.50, color: "#ffffff" },
  { cx: 244.05, cy: 244.05, color: "#f5b300" },
  { cx: 216.50, cy: 265.18, color: "#ffffff" },
  { cx: 184.42, cy: 278.47, color: "#f5b300" },
  { cx: 150.00, cy: 283.00, color: "#ffffff" },
  { cx: 115.58, cy: 278.47, color: "#f5b300" },
  { cx: 83.50, cy: 265.18, color: "#ffffff" },
  { cx: 55.95, cy: 244.05, color: "#f5b300" },
  { cx: 34.82, cy: 216.50, color: "#ffffff" },
  { cx: 21.53, cy: 184.42, color: "#f5b300" },
  { cx: 17.00, cy: 150.00, color: "#ffffff" },
  { cx: 21.53, cy: 115.58, color: "#f5b300" },
  { cx: 34.82, cy: 83.50, color: "#ffffff" },
  { cx: 55.95, cy: 55.95, color: "#f5b300" },
  { cx: 83.50, cy: 34.82, color: "#ffffff" },
  { cx: 115.58, cy: 21.53, color: "#f5b300" },
] as const;

export function rewardToSegmentIndex(reward?: bigint): number {
  if (reward === undefined || reward === BigInt(0)) return 0;
  if (reward === BigInt(10) * BigInt(10 ** 18)) return 1;
  if (reward === BigInt(20) * BigInt(10 ** 18)) return 2;
  if (reward === BigInt(50) * BigInt(10 ** 18)) return 3;
  if (reward === BigInt(100) * BigInt(10 ** 18)) return 4;
  return 0;
}

export function formatExactReward(reward?: bigint): "0 PIGGY" | "10 PIGGY" | "20 PIGGY" | "50 PIGGY" | "100 PIGGY" {
  if (reward === undefined || reward === BigInt(0)) return "0 PIGGY";
  if (reward === BigInt(10) * BigInt(10 ** 18)) return "10 PIGGY";
  if (reward === BigInt(20) * BigInt(10 ** 18)) return "20 PIGGY";
  if (reward === BigInt(50) * BigInt(10 ** 18)) return "50 PIGGY";
  if (reward === BigInt(100) * BigInt(10 ** 18)) return "100 PIGGY";
  return "0 PIGGY";
}

export function rewardToTargetRotation(reward?: bigint): number {
  if (reward === undefined || reward === BigInt(0)) return 0;
  if (reward === BigInt(10) * BigInt(10 ** 18)) return -15;
  if (reward === BigInt(20) * BigInt(10 ** 18)) return -45;
  if (reward === BigInt(50) * BigInt(10 ** 18)) return -105;
  if (reward === BigInt(100) * BigInt(10 ** 18)) return 15;
  return 0;
}

export function getRewardMultiplierText(reward?: bigint): string {
  if (reward === undefined || reward === BigInt(0)) return "x0";
  if (reward === BigInt(10) * BigInt(10 ** 18)) return "x1";
  if (reward === BigInt(20) * BigInt(10 ** 18)) return "x2";
  if (reward === BigInt(50) * BigInt(10 ** 18)) return "x5";
  if (reward === BigInt(100) * BigInt(10 ** 18)) return "x10 Jackpot";
  return "x0";
}

import { formatUnits } from "viem";



function HappyFaceIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="face-svg-icon">
      <circle cx="24" cy="24" r="22" fill="#FACC15" stroke="#EAB308" strokeWidth="2.5" />
      <circle cx="11" cy="28" r="4" fill="#F472B6" opacity="0.65" />
      <circle cx="37" cy="28" r="4" fill="#F472B6" opacity="0.65" />
      <path d="M14 19 Q 18.5 12, 23 19" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M25 19 Q 29.5 12, 34 19" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M15 26 Q 24 40, 33 26" fill="#991B1B" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19 32 Q 24 37, 29 32 Q 24 35, 19 32" fill="#F472B6" />
      <path d="M24 3 L 25.5 6.5 L 29 8 L 25.5 9.5 L 24 13 L 22.5 9.5 L 19 8 L 22.5 6.5 Z" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="0.8" />
    </svg>
  );
}

function SadFaceIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="face-svg-icon">
      <circle cx="24" cy="24" r="22" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2.5" />
      <path d="M14 16 Q 18.5 19.5, 22 17.5" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M26 17.5 Q 29.5 19.5, 34 16" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="18" cy="22.5" r="3" fill="#334155" />
      <circle cx="17.2" cy="21.5" r="1" fill="#FFFFFF" />
      <circle cx="30" cy="22.5" r="3" fill="#334155" />
      <circle cx="29.2" cy="21.5" r="1" fill="#FFFFFF" />
      <path d="M17 33 Q 24 26, 31 33" stroke="#475569" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M33.5 25.5 C 33.5 25.5, 35 28.5, 35 29.5 C 35 30.3, 34.3 31, 33.5 31 C 32.7 31, 32 30.3, 32 29.5 C 32 28.5, 33.5 25.5, 33.5 25.5 Z" fill="#60A5FA" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-3px", marginRight: "6px" }}>
      <circle cx="9" cy="9" r="7" fill="#FDE047" stroke="#B45309" strokeWidth="1.5" />
      <path d="M21 12c0 3.866-3.134 7-7 7" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="15" cy="15" r="6" fill="#FEF08A" stroke="#B45309" strokeWidth="1.5" />
    </svg>
  );
}

function ArrowReloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-3px", marginRight: "6px" }}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.8 1.03 6.43 2.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 1l12 12M13 1L1 13" />
    </svg>
  );
}

type Props = {
  canSpin: boolean;
  approvalNeeded: boolean;
  isActionBusy: boolean;
  transactionState?: UiState;
  latestRequest?: RequestView;
  onSpin: () => void | Promise<unknown>;
  onClaimReward: () => void | Promise<unknown>;
  tokenBalance?: bigint;
  entryFee?: bigint;
  errorMessage?: string;
  pendingRewards?: bigint;
  recentResults?: Array<string>;
  isConnected?: boolean;
  correctNetwork?: boolean;
  onConnect?: () => void | Promise<unknown>;
  onSwitchNetwork?: () => void | Promise<unknown>;
  isRoundExpired?: boolean;
  onSettleRound?: () => void | Promise<unknown>;
};

export function RewardWheel({
  canSpin,
  approvalNeeded,
  isActionBusy,
  transactionState,
  latestRequest,
  onSpin,
  onClaimReward,
  tokenBalance,
  entryFee,
  errorMessage,
  pendingRewards,
  isConnected = true,
  correctNetwork = true,
  onConnect,
  onSwitchNetwork,
  isRoundExpired = false,
  onSettleRound,
}: Props) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [revealedRequestId, setRevealedRequestId] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [dismissedModalRequestId, setDismissedModalRequestId] = useState<string | null>(null);

  const requestStatus = latestRequest?.status;
  const isRequested = requestStatus === "REQUESTED";
  const isFulfilled = requestStatus === "FULFILLED";
  const isExpired = requestStatus === "EXPIRED";
  const isUnknownOrInvalid = Boolean(requestStatus && !["NONE", "REQUESTED", "FULFILLED", "EXPIRED"].includes(requestStatus));

  // isRevealed is strictly scoped to the current requestId
  const isRevealed = Boolean(latestRequest?.id && revealedRequestId === latestRequest.id);

  // The wheel spins continuously while VRF request is REQUESTED
  // AND continues spinning when FULFILLED until the player clicks Stop & Reveal!
  const isSpinning = (isRequested || (isFulfilled && !isRevealed)) && !prefersReducedMotion;

  // Target rotation is determined strictly by the confirmed on-chain reward.
  // In full-motion mode, adding 1440deg (4 full rotations) gives realistic deceleration momentum before settling.
  const baseTargetRotation = rewardToTargetRotation(latestRequest?.reward);
  const targetRotation = isRevealed
    ? prefersReducedMotion
      ? baseTargetRotation
      : 1440 + baseTargetRotation
    : 0;

  const exactRewardText = isFulfilled ? formatExactReward(latestRequest?.reward) : undefined;
  const hasClaimableReward = isFulfilled && isRevealed && latestRequest?.reward !== undefined && latestRequest.reward > BigInt(0);

  const displayPendingAmount = pendingRewards ?? (hasClaimableReward && latestRequest?.reward ? latestRequest.reward : BigInt(0));
  const displayPendingText =
    displayPendingAmount && displayPendingAmount > BigInt(0)
      ? `${formatUnits(displayPendingAmount, 18)} $PIGGY`
      : "- $PIGGY";

  // Stop & Reveal is strictly presentation-only. It NEVER calls contract writes,
  // changes random words, or modifies payouts.
  const handleStopAndReveal = () => {
    if (!isFulfilled || !latestRequest?.id) return;
    setRevealedRequestId(latestRequest.id);
  };

  // Automatically trigger the Result Modal when the wheel stops on the winning slice
  useEffect(() => {
    if (isFulfilled && isRevealed && latestRequest?.id && dismissedModalRequestId !== latestRequest.id) {
      if (prefersReducedMotion) {
        setShowResultModal(true);
      } else {
        const timer = setTimeout(() => {
          setShowResultModal(true);
        }, 1800);
        return () => clearTimeout(timer);
      }
    } else if (!isFulfilled || !isRevealed) {
      setShowResultModal(false);
    }
  }, [isFulfilled, isRevealed, latestRequest?.id, dismissedModalRequestId, prefersReducedMotion]);

  // Safety timer: auto-reveal after 15s if the user hasn't clicked stop
  useEffect(() => {
    if (isFulfilled && !isRevealed && latestRequest?.id) {
      const timer = setTimeout(() => {
        setRevealedRequestId(latestRequest.id);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isFulfilled, isRevealed, latestRequest?.id]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showResultModal) {
        setDismissedModalRequestId(latestRequest?.id ?? null);
        setShowResultModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResultModal, latestRequest?.id]);

  return (
    <div className="carnival-desktop-grid">
      {/* 2. Left Column: Lucky Carnival Wheel Stage (Card removed, floating wheel with white text) */}
      <section className="wheel-stage-container" aria-label="วงล้อรางวัล PIGGY (PIGGY Reward Wheel)">
        <div className="wheel-stage" role="region" aria-label="วงล้อรางวัล PIGGY (PIGGY Reward Wheel)">
          {/* Top Indicator Needle */}
          <div className="wheel-pointer-wrap" aria-hidden="true">
            <svg className="wheel-pointer" width="44" height="48" viewBox="0 0 34 38" fill="none">
              <path d="M17 38 L3 8 C1 4 4 0 9 0 L25 0 C30 0 33 4 31 8 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="17" cy="12" r="4.5" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" />
            </svg>
          </div>

          {/* SVG Wheel with 24 alternating carnival red/white slices & marquee bulbs */}
          <div className="wheel-disc-wrap">
            <svg
              className={`wheel-svg ${isSpinning ? "wheel-spinning" : ""}`}
              style={
                !isSpinning && !prefersReducedMotion && isRevealed
                  ? { transform: `rotate(${targetRotation}deg)`, transition: "transform 1.8s cubic-bezier(0.15, 0.9, 0.25, 1)" }
                  : !isSpinning && targetRotation !== 0
                  ? { transform: `rotate(${targetRotation}deg)` }
                  : undefined
              }
              viewBox="0 0 300 300"
              role="img"
              aria-label="วงล้อรางวัล 4 ช่อง: No Reward, 10 PIGGY, 20 PIGGY, 50 PIGGY"
            >
              <defs>
                <filter id="hubShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4a0408" floodOpacity="0.5" />
                </filter>
                <radialGradient id="rimMaroon" cx="50%" cy="50%" r="50%">
                  <stop offset="70%" stopColor="#8e0d16" />
                  <stop offset="95%" stopColor="#7a0a12" />
                  <stop offset="100%" stopColor="#55050b" />
                </radialGradient>
                <clipPath id="hubLogoClip">
                  <circle cx="150" cy="150" r="27" />
                </clipPath>
              </defs>

              {/* Outer Deep Maroon Rim */}
              <circle cx="150" cy="150" r="146" fill="url(#rimMaroon)" stroke="#55050b" strokeWidth="2.5" />
              {/* Inner Rim border */}
              <circle cx="150" cy="150" r="120" fill="none" stroke="#55050b" strokeWidth="2" />

              {/* 24 Standard Carnival Slices (Red and White alternating) */}
              {CARNIVAL_SLICES.map((slice, idx) => (
                <path
                  key={idx}
                  d="M 150 150 L 134.34 31.03 A 120 120 0 0 1 165.66 31.03 Z"
                  transform={`rotate(${slice.deg}, 150, 150)`}
                  fill={slice.color}
                  stroke="#8e0d16"
                  strokeWidth="1.2"
                />
              ))}

              {/* Slices Multipliers (Only for winning tiers; zero-reward slices are clean empty slices) */}
              {CARNIVAL_SLICES.map((slice, idx) => {
                if (slice.type === "zero") {
                  return null; // Empty / blank slice as requested
                }
                return (
                  <g key={`slice-text-${idx}`} transform={`rotate(${slice.deg}, 150, 150)`}>
                    {slice.type === "10" && (
                      <text
                        x="150"
                        y="60"
                        textAnchor="middle"
                        fill="#1e3a8a"
                        fontSize="10.5"
                        fontWeight="350"
                        fontFamily="var(--font-mitr), sans-serif"
                      >
                        x1
                      </text>
                    )}
                    {slice.type === "20" && (
                      <text
                        x="150"
                        y="60"
                        textAnchor="middle"
                        fill="#78350f"
                        fontSize="10.5"
                        fontWeight="350"
                        fontFamily="var(--font-mitr), sans-serif"
                      >
                        x2
                      </text>
                    )}
                    {slice.type === "50" && (
                      <text
                        x="150"
                        y="60"
                        textAnchor="middle"
                        fill="#b45309"
                        fontSize="10.5"
                        fontWeight="350"
                        fontFamily="var(--font-mitr), sans-serif"
                      >
                        x5
                      </text>
                    )}
                    {slice.type === "100" && (
                      <text
                        x="150"
                        y="60"
                        textAnchor="middle"
                        fill="#78350f"
                        fontSize="11"
                        fontWeight="400"
                        fontFamily="var(--font-mitr), sans-serif"
                      >
                        x10
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 24 Carnival Marquee Bulbs around the Maroon Rim */}
              {CARNIVAL_BULBS.map((bulb, idx) => (
                <g key={idx}>
                  <circle cx={bulb.cx} cy={bulb.cy} r="6.2" fill={bulb.color} stroke="#4a0408" strokeWidth="1" />
                  <circle cx={bulb.cx - 1.5} cy={bulb.cy - 1.5} r="2" fill="#ffffff" opacity="0.65" />
                </g>
              ))}

              {/* Center Decorative Carnival Hub with PIGGY Logo */}
              <circle cx="150" cy="150" r="32.5" fill="#8e0d16" stroke="#55050b" strokeWidth="2.5" filter="url(#hubShadow)" />
              <image
                href="/piggy_icon2.png"
                x="118"
                y="119"
                width="62"
                height="62"
                clipPath="url(#hubLogoClip)"
                preserveAspectRatio="xMidYMid slice"
              />
              <circle cx="150" cy="150" r="27" fill="none" stroke="#f5b300" strokeWidth="2.2" />
            </svg>
          </div>
        </div>



        {/* Error / Alert Status Panel (เฉพาะกรณีเกิดข้อผิดพลาด) */}
        {(isExpired || isUnknownOrInvalid || transactionState === "TRANSACTION_REJECTED" || transactionState === "TRANSACTION_FAILED") && (
          <div className="wheel-status-panel" aria-live="polite">
            {isExpired && (
              <div className="status-banner status-expired" role="alert">
                <strong>คำขอสุ่มหมดเวลา (VRF Request Expired)</strong>
                <p>คำขอหมายเลข {latestRequest?.id} เกินกำหนด 200 บล็อก สัญญาไม่อนุมัติผลสุ่ม ระบบไม่ได้คืนค่าเล่น 10 PIGGY และไม่มีรางวัลจากคำขอนี้</p>
              </div>
            )}

            {isUnknownOrInvalid && (
              <div className="status-banner status-expired" role="alert">
                <strong>สถานะคำขอไม่ถูกต้องหรือหมดอายุแล้ว</strong>
                <p>ไม่พบผลสุ่มที่ถูกต้องสำหรับคำขอนี้บนเครือข่าย</p>
              </div>
            )}

            {transactionState === "TRANSACTION_REJECTED" && (
              <div className="status-banner status-warning" role="alert">
                <strong>ยกเลิกรายการในกระเป๋า</strong>
                <p>คุณยกเลิกคำขอในกระเป๋า ไม่มีการหักเหรียญหรือทำรายการบนเครือข่าย</p>
              </div>
            )}

            {transactionState === "TRANSACTION_FAILED" && (
              <div className="status-banner status-error" role="alert">
                <strong>ทำรายการไม่สำเร็จ</strong>
                <p>{errorMessage ?? "กรุณาตรวจสอบยอด tBNB สำหรับค่าธรรมเนียมและการเชื่อมต่อเครือข่าย แล้วลองใหม่อีกครั้ง"}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Right Column: Container for both separate cards (ตารางผลรางวัล อยู่ด้านบนการ์ด รางวัลที่ยังไม่ได้ถอน) */}
      <div className="carnival-right-column">
        {/* 3a. ตารางผลรางวัล — การ์ดแยกต่างหากด้านบน */}
        <div className="card compact-reward-tiers-card" aria-label="ตารางผลรางวัล">
          <div className="compact-reward-tiers">
            <div className="compact-table-title">ผลรางวัล</div>
            <table className="compact-reward-table">
              <tbody>
                <tr><td><strong>x0</strong></td><td>0 $PIGGY</td></tr>
                <tr><td><strong>x1</strong></td><td>10 $PIGGY</td></tr>
                <tr><td><strong>x2</strong></td><td>20 $PIGGY</td></tr>
                <tr><td><strong>x5</strong></td><td>50 $PIGGY</td></tr>
                <tr className="jackpot-row"><td><strong>x10</strong></td><td>100 $PIGGY</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3b. แผงควบคุมเกม (Game Dashboard Card - รางวัลที่ยังไม่ได้ถอน + ปุ่มหมุน) */}
        <section className="card game-dashboard-card" aria-label="แผงควบคุมเกม (Game Dashboard)">
          {/* 3.1 โซนถอนเงินรางวัล (Claim Section) - การ์ดรางวัลที่ยังไม่ได้ถอน */}
          <div className="claim-zone">
            <div className="claim-header-row">
              <div className="claim-balance-info">
                <span className="claim-label">รางวัลที่ยังไม่ได้ถอน:</span>
                <strong className="claim-amount">{displayPendingText}</strong>
              </div>

              {/* Pull-payment Claim Button: always visible, disabled if no reward to claim */}
              <button
                type="button"
                className="button claim-neon-green-btn"
                disabled={!hasClaimableReward || isActionBusy}
                onClick={() => void onClaimReward()}
                aria-label="Claim PIGGY reward"
              >
                ถอนรางวัล
              </button>
            </div>
          </div>

          {/* 3.2 ปุ่มแอ็กชันหลัก (Primary Action Button) */}
          <div className="primary-action-zone">
            {!isConnected && onConnect ? (
              <button
                type="button"
                className="button neon-yellow-action-btn"
                onClick={() => void onConnect()}
                aria-label="เปิดกระเป๋าเงิน (Connect Wallet)"
              >
                เปิดกระเป๋าเงิน (Connect Wallet)
              </button>
            ) : !correctNetwork && onSwitchNetwork ? (
              <button
                type="button"
                className="button neon-yellow-action-btn"
                onClick={() => void onSwitchNetwork()}
                aria-label="สลับเป็นเครือข่าย BNB Testnet"
              >
                สลับเป็นเครือข่าย BNB Testnet
              </button>
            ) : isFulfilled && !isRevealed ? (
              <button
                type="button"
                className="button neon-yellow-action-btn pulse-gold stop-dashboard-btn"
                onClick={handleStopAndReveal}
                aria-label="กดหยุดวงล้อ"
              >
                กดหยุดวงล้อ
              </button>
            ) : (
              <button
                type="button"
                className="button neon-yellow-action-btn"
                disabled={!canSpin || isActionBusy || isRequested}
                onClick={() => void onSpin()}
                aria-label="Spin for 10 PIGGY"
              >
                {isActionBusy && transactionState === "APPROVAL_PENDING"
                  ? "กำลังอนุมัติ 10 $PIGGY..."
                  : isActionBusy && (transactionState === "PLAY_WALLET_CONFIRMATION" || transactionState === "PLAY_TRANSACTION_PENDING")
                    ? "กำลังส่งรายการเล่น..."
                    : isRequested
                      ? "กำลังรอผลสุ่ม..."
                      : approvalNeeded
                        ? "Approve 10 $PIGGY"
                        : "หมุนชิงช้า (10 $PIGGY)"}
              </button>
            )}

            {/* Pre-flight hints */}
            {!isConnected ? (
              <p className="wheel-hint">เชื่อมต่อกระเป๋าเพื่อดูยอดเหรียญและเริ่มหมุนวงล้อ</p>
            ) : !correctNetwork ? (
              <p className="inline-warning" role="status">กรุณาสลับไปยังเครือข่ายทดลอง BNB Smart Chain</p>
            ) : isFulfilled && !isRevealed ? null : isRequested ? null : approvalNeeded && canSpin ? (
              <p className="wheel-hint">
                คลิกปุ่ม &quot;Approve 10 $PIGGY&quot; เพื่ออนุมัติและเริ่มหมุนวงล้อเมื่อรายการยืนยัน
              </p>
            ) : !canSpin && tokenBalance !== undefined && entryFee !== undefined && tokenBalance < entryFee ? (
              <p className="inline-warning" role="status">
                ยอด PIGGY ของคุณไม่เพียงพอ (ต้องการอย่างน้อย 10 PIGGY เพื่อหมุนวงล้อ)
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {/* 4. Alert / Result Dialog Modal */}
      {showResultModal && isFulfilled && isRevealed && (
        <div
          className="wheel-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="result-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDismissedModalRequestId(latestRequest?.id ?? null);
              setShowResultModal(false);
            }
          }}
        >
          <div className="wheel-modal-card">
            {/* Close Button */}
            <button
              type="button"
              className="modal-close-icon-btn"
              onClick={() => {
                setDismissedModalRequestId(latestRequest?.id ?? null);
                setShowResultModal(false);
              }}
              aria-label="ปิดหน้าต่างผลรางวัล"
            >
              <CloseIcon />
            </button>

            {hasClaimableReward ? (
              <>
                <div className="modal-badge-glow" aria-hidden="true">
                  <HappyFaceIcon />
                </div>
                <h2 id="result-modal-title" className="modal-title">
                  ยินดีด้วย! คุณได้รับรางวัล
                </h2>
                <div className="modal-reward-box">
                  <span className="modal-multiplier-pill">
                    ตัวคูณ {getRewardMultiplierText(latestRequest?.reward)}
                  </span>
                  <span className="modal-reward-amount">{exactRewardText}</span>
                </div>
                <p className="modal-desc">
                  ผลสุ่มได้รับการตรวจสอบความโปร่งใสบนบล็อกเชนด้วย Chainlink VRF เรียบร้อยแล้ว
                  รางวัลถูกบันทึกในสัญญา สามารถกดถอนเหรียญเข้ากระเป๋าได้ทันที!
                </p>
                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="button claim-neon-green-btn modal-claim-btn"
                    disabled={isActionBusy}
                    onClick={async () => {
                      await onClaimReward();
                    }}
                    aria-label="ถอนเงินรางวัลทันที"
                  >
                    <CoinsIcon /> ถอนเงินรางวัลทันที ({exactRewardText})
                  </button>
                  <button
                    type="button"
                    className="button button-secondary modal-play-again-btn"
                    onClick={() => {
                      setDismissedModalRequestId(latestRequest?.id ?? null);
                      setShowResultModal(false);
                    }}
                  >
                    ปิดหน้าต่าง / เล่นรอบต่อไป
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-badge-glow neutral" aria-hidden="true">
                  <SadFaceIcon />
                </div>
                <h2 id="result-modal-title" className="modal-title lose-title">
                  ครั้งนี้ยังไม่ถูกรางวัล
                </h2>
                <div className="modal-reward-box neutral">
                  <span className="modal-multiplier-pill neutral">ตัวคูณ x0</span>
                  <span className="modal-reward-amount">0 $PIGGY</span>
                </div>
                <p className="modal-desc neutral">
                  ไม่เป็นไรนะ! การสุ่มผ่าน Chainlink VRF มีความโปร่งใส 100%
                  รอบต่อไปยังมีโอกาสลุ้นรางวัลใหญ่ Jackpot x10 (100 $PIGGY)!
                </p>
                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="button neon-yellow-action-btn modal-try-again-btn"
                    onClick={() => {
                      setDismissedModalRequestId(latestRequest?.id ?? null);
                      setShowResultModal(false);
                    }}
                  >
                    <ArrowReloadIcon /> ลองหมุนอีกครั้ง
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
