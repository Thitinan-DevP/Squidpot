import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useReducedMotion } from "framer-motion";
import { PiggyBankTransactionFeedback } from "@/components/PiggyBankTransactionFeedback";
import { confirmedPlayAnimationKey } from "@/lib/confirmed-play";

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: vi.fn(() => false) };
});

describe("confirmed Play visual feedback", () => {
  it("does not animate without a confirmed Play event", () => {
    const { container } = render(<PiggyBankTransactionFeedback />);
    expect(container.querySelector(".coin")).not.toBeInTheDocument();
    expect(screen.queryByText("Play confirmed on-chain")).not.toBeInTheDocument();
  });

  it("animates only after a successful Play receipt with its request ID", () => {
    const key = confirmedPlayAnimationKey({
      action: "play", receiptStatus: "success", transactionHash: "0xabc", requestId: "42",
    });
    expect(key).toBe("0xabc:42");
    const { container } = render(<PiggyBankTransactionFeedback confirmedEventId={key} />);
    expect(container.querySelector(".coin")).toBeInTheDocument();
    expect(screen.getByText("Play confirmed")).toBeInTheDocument();
  });

  it.each([
    { action: "play", receiptStatus: "reverted" as const, transactionHash: "0xabc", requestId: "42" },
    { action: "play", transactionHash: "0xabc", requestId: "42" },
    { action: "claim-prize", receiptStatus: "success" as const, transactionHash: "0xabc", requestId: "42" },
    { action: "play", receiptStatus: "success" as const, transactionHash: "0xabc" },
  ])("does not generate an animation key for unconfirmed, failed, claim, or incomplete observations", (observation) => {
    expect(confirmedPlayAnimationKey(observation)).toBeUndefined();
  });

  it("shows a static success badge when reduced motion is preferred", async () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);
    render(<PiggyBankTransactionFeedback confirmedEventId="0xabc:42" />);
    expect(screen.getByRole("status")).toHaveTextContent("Play confirmed on-chain");
    expect(document.querySelector(".coin")).not.toBeInTheDocument();
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });
});
