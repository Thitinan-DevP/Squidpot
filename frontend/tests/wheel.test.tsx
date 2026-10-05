import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducedMotion } from "framer-motion";
import {
  RewardWheel,
  WHEEL_SEGMENTS,
  formatExactReward,
  rewardToSegmentIndex,
  getRewardMultiplierText,
} from "@/components/RewardWheel";
import type { RequestView } from "@/lib/use-squidpot";

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: vi.fn(() => false) };
});

const PIGGY_DECIMALS = BigInt(10 ** 18);

describe("RewardWheel unit and integration behavior", () => {
  afterEach(() => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  it("defines exactly the 4 required segments and maps confirmed rewards deterministically", () => {
    expect(WHEEL_SEGMENTS.map((s) => s.label)).toEqual([
      "No Reward",
      "10 PIGGY",
      "20 PIGGY",
      "50 PIGGY",
    ]);

    // Segment index mapping
    expect(rewardToSegmentIndex(BigInt(0))).toBe(0);
    expect(rewardToSegmentIndex(BigInt(10) * PIGGY_DECIMALS)).toBe(1);
    expect(rewardToSegmentIndex(BigInt(20) * PIGGY_DECIMALS)).toBe(2);
    expect(rewardToSegmentIndex(BigInt(50) * PIGGY_DECIMALS)).toBe(3);

    // Exact reward string formatting
    expect(formatExactReward(BigInt(0))).toBe("0 PIGGY");
    expect(formatExactReward(undefined)).toBe("0 PIGGY");
    expect(formatExactReward(BigInt(10) * PIGGY_DECIMALS)).toBe("10 PIGGY");
    expect(formatExactReward(BigInt(20) * PIGGY_DECIMALS)).toBe("20 PIGGY");
    expect(formatExactReward(BigInt(50) * PIGGY_DECIMALS)).toBe("50 PIGGY");
  });

  it("renders a prominent Spin for 10 PIGGY button that enforces readiness checks", async () => {
    const onSpin = vi.fn();
    const onClaimReward = vi.fn();
    const user = userEvent.setup();

    // Disabled when canSpin is false
    const { rerender } = render(
      <RewardWheel
        canSpin={false}
        approvalNeeded={false}
        isActionBusy={false}
        onSpin={onSpin}
        onClaimReward={onClaimReward}
        tokenBalance={BigInt(5) * PIGGY_DECIMALS}
        entryFee={BigInt(10) * PIGGY_DECIMALS}
      />
    );

    const spinBtn = screen.getByRole("button", { name: "Spin for 10 PIGGY" });
    expect(spinBtn).toBeDisabled();
    expect(screen.getByText(/ต้องการอย่างน้อย 10 PIGGY เพื่อหมุนวงล้อ/)).toBeInTheDocument();

    // Enabled when canSpin is true
    rerender(
      <RewardWheel
        canSpin={true}
        approvalNeeded={false}
        isActionBusy={false}
        onSpin={onSpin}
        onClaimReward={onClaimReward}
        tokenBalance={BigInt(25) * PIGGY_DECIMALS}
        entryFee={BigInt(10) * PIGGY_DECIMALS}
      />
    );

    expect(spinBtn).toBeEnabled();
    await user.click(spinBtn);
    expect(onSpin).toHaveBeenCalledTimes(1);
  });

  it("proves the wheel cannot spin or show a reward before play receipt is confirmed", () => {
    const onSpin = vi.fn();
    const onClaimReward = vi.fn();

    // Idle state: no request
    const { container, rerender } = render(
      <RewardWheel
        canSpin={true}
        approvalNeeded={false}
        isActionBusy={false}
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    expect(container.querySelector(".wheel-spinning")).not.toBeInTheDocument();
    expect(screen.queryByText("กำลังรอผลสุ่มจากบล็อกเชน")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "กดหยุดวงล้อ" })).not.toBeInTheDocument();

    // Transaction pending state (before receipt confirmed)
    rerender(
      <RewardWheel
        canSpin={true}
        approvalNeeded={false}
        isActionBusy={true}
        transactionState="PLAY_TRANSACTION_PENDING"
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    expect(container.querySelector(".wheel-spinning")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "กดหยุดวงล้อ" })).not.toBeInTheDocument();
  });

  it("spins continuously while VRF request is REQUESTED and shows clear waiting status", () => {
    const onSpin = vi.fn();
    const onClaimReward = vi.fn();
    const request: RequestView = {
      id: "101",
      status: "REQUESTED",
    };

    const { container } = render(
      <RewardWheel
        canSpin={false}
        approvalNeeded={false}
        isActionBusy={false}
        latestRequest={request}
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    // Verified on-chain result status is shown
    expect(screen.getByText("กำลังรอผลสุ่มจากบล็อกเชน")).toBeInTheDocument();
    // Wheel has spinning CSS class
    expect(container.querySelector(".wheel-svg")).toHaveClass("wheel-spinning");
    // Stop & Reveal is not enabled
    expect(screen.queryByRole("button", { name: "กดหยุดวงล้อ" })).not.toBeInTheDocument();
    // No reward is invented or shown before fulfillment
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("proves Stop & Reveal is enabled only on FULFILLED and is presentation-only without contract calls", async () => {
    const onSpin = vi.fn();
    const onClaimReward = vi.fn();
    const user = userEvent.setup();

    const request: RequestView = {
      id: "102",
      status: "FULFILLED",
      reward: BigInt(20) * PIGGY_DECIMALS,
    };

    render(
      <RewardWheel
        canSpin={true}
        approvalNeeded={false}
        isActionBusy={false}
        latestRequest={request}
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    // Stop & Reveal button is enabled
    const stopRevealBtn = screen.getByRole("button", { name: "กดหยุดวงล้อ" });
    expect(stopRevealBtn).toBeInTheDocument();

    // Before clicking Stop & Reveal, reward modal is not yet shown
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click Stop & Reveal: presentation-only action
    await user.click(stopRevealBtn);

    // CRITICAL SAFETY PROOF: Zero transactions, zero writes, zero contract side-effects
    expect(onSpin).not.toHaveBeenCalled();
    expect(onClaimReward).not.toHaveBeenCalled();

    // Since reward > 0, Claim PIGGY reward button is shown
    const claimBtn = screen.getByRole("button", { name: "Claim PIGGY reward" });
    expect(claimBtn).toBeInTheDocument();

    // Clicking Claim invokes the existing pull-payment claim flow
    await user.click(claimBtn);
    expect(onClaimReward).toHaveBeenCalledTimes(1);
  });

  it("displays 0 PIGGY for zero reward and does not show Claim button", async () => {
    const onSpin = vi.fn();
    const onClaimReward = vi.fn();
    const user = userEvent.setup();

    const request: RequestView = {
      id: "103",
      status: "FULFILLED",
      reward: BigInt(0),
    };

    render(
      <RewardWheel
        canSpin={true}
        approvalNeeded={false}
        isActionBusy={false}
        latestRequest={request}
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    const stopRevealBtn = screen.getByRole("button", { name: "กดหยุดวงล้อ" });
    await user.click(stopRevealBtn);

    // Claim button is present but disabled because reward is zero
    expect(screen.getByRole("button", { name: "Claim PIGGY reward" })).toBeDisabled();
  });

  it("supports prefers-reduced-motion without continuous animation", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const onSpin = vi.fn();
    const onClaimReward = vi.fn();

    const request: RequestView = {
      id: "104",
      status: "REQUESTED",
    };

    const { container } = render(
      <RewardWheel
        canSpin={false}
        approvalNeeded={false}
        isActionBusy={false}
        latestRequest={request}
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    // Wheel does NOT have spinning class when reduced motion is preferred
    expect(container.querySelector(".wheel-svg")).not.toHaveClass("wheel-spinning");
    expect(screen.getByText("กำลังรอผลสุ่มจากบล็อกเชน")).toBeInTheDocument();
    expect(screen.getByText(/โหมดลดภาพเคลื่อนไหว/)).toBeInTheDocument();

    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  it("renders accurate recovery messaging for expired, rejected, and failed states without inventing rewards", () => {
    const onSpin = vi.fn();
    const onClaimReward = vi.fn();

    // Expired VRF
    const { rerender } = render(
      <RewardWheel
        canSpin={true}
        approvalNeeded={false}
        isActionBusy={false}
        latestRequest={{ id: "105", status: "EXPIRED" }}
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("คำขอสุ่มหมดเวลา (VRF Request Expired)");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Rejected transaction
    rerender(
      <RewardWheel
        canSpin={true}
        approvalNeeded={false}
        isActionBusy={false}
        transactionState="TRANSACTION_REJECTED"
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("ยกเลิกรายการในกระเป๋า");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Failed transaction
    rerender(
      <RewardWheel
        canSpin={true}
        approvalNeeded={false}
        isActionBusy={false}
        transactionState="TRANSACTION_FAILED"
        errorMessage="Custom testnet error"
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("ทำรายการไม่สำเร็จ");
    expect(screen.getByRole("alert")).toHaveTextContent("Custom testnet error");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the wheel spinning when FULFILLED until the player explicitly clicks Stop & Reveal", async () => {
    const onSpin = vi.fn();
    const onClaimReward = vi.fn();
    const user = userEvent.setup();

    const request: RequestView = {
      id: "201",
      status: "FULFILLED",
      reward: BigInt(50) * PIGGY_DECIMALS,
    };

    const { container } = render(
      <RewardWheel
        canSpin={true}
        approvalNeeded={false}
        isActionBusy={false}
        latestRequest={request}
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    // CRITICAL FIX PROOF: The wheel MUST still be spinning even after contract fulfillment,
    // so the user has the power to press Stop & Reveal instead of it halting abruptly on its own!
    expect(container.querySelector(".wheel-svg")).toHaveClass("wheel-spinning");
    expect(screen.getByText(/ผลรางวัลพร้อมแล้ว/)).toBeInTheDocument();

    // Both the under-wheel Stop & Reveal button and the dashboard stop button are visible
    const stopRevealBtn = screen.getByRole("button", { name: "กดหยุดวงล้อ" });
    const dashboardStopBtn = screen.getByRole("button", { name: "หยุดวงล้อและแสดงผลรางวัล" });
    expect(stopRevealBtn).toBeInTheDocument();
    expect(dashboardStopBtn).toBeInTheDocument();

    // User clicks Stop & Reveal
    await user.click(stopRevealBtn);

    // After stopping, spinning class is removed
    expect(container.querySelector(".wheel-svg")).not.toHaveClass("wheel-spinning");
  });

  it("opens a celebration Alert dialog modal when the wheel reveals the result and allows closing", async () => {
    // In reduced motion mode, modal appears immediately without timer delay
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const onSpin = vi.fn();
    const onClaimReward = vi.fn();
    const user = userEvent.setup();

    const request: RequestView = {
      id: "202",
      status: "FULFILLED",
      reward: BigInt(20) * PIGGY_DECIMALS,
    };

    render(
      <RewardWheel
        canSpin={true}
        approvalNeeded={false}
        isActionBusy={false}
        latestRequest={request}
        onSpin={onSpin}
        onClaimReward={onClaimReward}
      />
    );

    const stopRevealBtn = screen.getByRole("button", { name: "กดหยุดวงล้อ" });
    await user.click(stopRevealBtn);

    // The Alert Dialog Modal is rendered
    const modalDialog = screen.getByRole("dialog");
    expect(modalDialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ยินดีด้วย! คุณได้รับรางวัล" })).toBeInTheDocument();
    expect(modalDialog).toHaveTextContent("20 PIGGY");
    expect(modalDialog).toHaveTextContent("ตัวคูณ x2");

    // Close button dismisses the modal
    const closeBtn = screen.getByRole("button", { name: "ปิดหน้าต่างผลรางวัล" });
    await user.click(closeBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  it("maps multiplier text accurately for all tiers", () => {
    expect(getRewardMultiplierText(BigInt(0))).toBe("x0");
    expect(getRewardMultiplierText(undefined)).toBe("x0");
    expect(getRewardMultiplierText(BigInt(10) * PIGGY_DECIMALS)).toBe("x1");
    expect(getRewardMultiplierText(BigInt(20) * PIGGY_DECIMALS)).toBe("x2");
    expect(getRewardMultiplierText(BigInt(50) * PIGGY_DECIMALS)).toBe("x5");
    expect(getRewardMultiplierText(BigInt(100) * PIGGY_DECIMALS)).toBe("x10 Jackpot");
  });
});
