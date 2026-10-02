import { describe, expect, it } from "vitest";
import { deriveUiState, uiStateMessages, type UiState } from "@/lib/ui-state";
import { TransactionStatus } from "@/components/TransactionStatus";
import { render } from "@testing-library/react";

const connected = {
  configured: true,
  connected: true,
  correctNetwork: true,
  allowance: BigInt(10),
  entryFee: BigInt(10),
  paused: false,
  reserve: BigInt(50),
  maxReward: BigInt(50),
  activeRequests: BigInt(0),
  maxRequests: BigInt(10),
  fundingInitialized: true,
};

describe("SquidPot UI state model", () => {
  it("describes missing configuration without implying gameplay", () => {
    expect(deriveUiState({ ...connected, configured: false })).toBe("CONTRACT_NOT_CONFIGURED");
    expect(uiStateMessages.CONTRACT_NOT_CONFIGURED).toContain("Contract addresses are not configured.");
  });

  it("derives disconnected and wrong-network states", () => {
    expect(deriveUiState({ ...connected, connected: false })).toBe("DISCONNECTED");
    expect(deriveUiState({ ...connected, correctNetwork: false })).toBe("WRONG_NETWORK");
  });

  it("derives approval, pause, capacity, and expired-round states from observed values", () => {
    expect(deriveUiState({ ...connected, allowance: BigInt(9) })).toBe("READY_TO_APPROVE");
    expect(deriveUiState({ ...connected, paused: true })).toBe("PAUSED");
    expect(deriveUiState({ ...connected, reserve: BigInt(49) })).toBe("INSUFFICIENT_SLOT_CAPACITY");
    expect(deriveUiState({ ...connected, activeRequests: BigInt(10) })).toBe("INSUFFICIENT_SLOT_CAPACITY");
    expect(deriveUiState({ ...connected, roundExpired: true })).toBe("ROUND_EXPIRED");
    expect(deriveUiState({ ...connected, fundingInitialized: false })).toBe("CONTRACT_NOT_INITIALIZED");
  });

  it("retains explicit pending, VRF, settlement, claim, rejection and failure states", () => {
    const states: UiState[] = [
      "APPROVAL_PENDING", "PLAY_WALLET_CONFIRMATION", "PLAY_TRANSACTION_PENDING", "VRF_WAITING",
      "VRF_FULFILLED", "VRF_EXPIRED", "SETTLEMENT_PENDING", "CLAIM_PENDING",
      "TRANSACTION_REJECTED", "TRANSACTION_FAILED", "READY_TO_PLAY",
    ];
    for (const state of states) {
      expect(uiStateMessages[state].length).toBeGreaterThan(10);
      const { getByRole, getByText, unmount } = render(<TransactionStatus state={state} />);
      expect(getByRole("heading", { name: state.replaceAll("_", " ") })).toBeInTheDocument();
      expect(getByText(uiStateMessages[state])).toBeInTheDocument();
      unmount();
    }
  });

  it("maps live request statuses to waiting, fulfilled, and expired UI states", () => {
    expect(deriveUiState({ ...connected, requestStatus: "REQUESTED" })).toBe("VRF_WAITING");
    expect(deriveUiState({ ...connected, requestStatus: "FULFILLED" })).toBe("VRF_FULFILLED");
    expect(deriveUiState({ ...connected, requestStatus: "EXPIRED" })).toBe("VRF_EXPIRED");
  });

  it("provides understandable copy for every required state", () => {
    const required: UiState[] = [
      "DISCONNECTED", "WRONG_NETWORK", "CONTRACT_NOT_CONFIGURED", "READY_TO_APPROVE", "APPROVAL_PENDING",
      "READY_TO_PLAY", "PLAY_WALLET_CONFIRMATION", "PLAY_TRANSACTION_PENDING", "VRF_WAITING", "VRF_FULFILLED",
      "VRF_EXPIRED", "ROUND_EXPIRED", "SETTLEMENT_PENDING", "CLAIM_PENDING", "TRANSACTION_REJECTED",
      "TRANSACTION_FAILED", "PAUSED", "INSUFFICIENT_SLOT_CAPACITY",
    ];
    expect(Object.keys(uiStateMessages)).toEqual(expect.arrayContaining(required));
    for (const state of required) expect(uiStateMessages[state].length).toBeGreaterThan(10);
  });
});
