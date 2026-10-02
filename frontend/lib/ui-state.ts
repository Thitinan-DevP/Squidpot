export type UiState =
  | "DISCONNECTED" | "WRONG_NETWORK" | "CONTRACT_NOT_CONFIGURED" | "READY_TO_APPROVE"
  | "APPROVAL_PENDING" | "READY_TO_PLAY" | "PLAY_WALLET_CONFIRMATION" | "PLAY_TRANSACTION_PENDING"
  | "VRF_WAITING" | "VRF_FULFILLED" | "VRF_EXPIRED" | "ROUND_EXPIRED" | "SETTLEMENT_PENDING"
  | "CLAIM_PENDING" | "TRANSACTION_REJECTED" | "TRANSACTION_FAILED" | "PAUSED"
  | "INSUFFICIENT_SLOT_CAPACITY" | "CONTRACT_NOT_INITIALIZED";

export const uiStateMessages: Record<UiState, string> = {
  DISCONNECTED: "Connect a wallet to read your PIGGY balance and use SquidPot.",
  WRONG_NETWORK: "Your wallet is on a different network. Switch to the configured local Anvil or BNB Testnet chain.",
  CONTRACT_NOT_CONFIGURED: "Contract addresses are not configured. Connect local Anvil or BNB Testnet deployment to use SquidPot.",
  READY_TO_APPROVE: "Allowance is below the 10 PIGGY entry. Approve exactly 10 PIGGY to continue.",
  APPROVAL_PENDING: "Approval submitted. Waiting for its on-chain receipt; this is not a play.",
  READY_TO_PLAY: "Ready. Your play will be recorded only after its transaction confirms on-chain.",
  PLAY_WALLET_CONFIRMATION: "Confirm the 10 PIGGY play in your wallet. No play or reward is confirmed yet.",
  PLAY_TRANSACTION_PENDING: "Play transaction submitted. Waiting for on-chain confirmation.",
  VRF_WAITING: "Play confirmed. The VRF request is pending; no reward is known yet.",
  VRF_FULFILLED: "The request is fulfilled. The displayed reward is read from the contract.",
  VRF_EXPIRED: "The VRF request expired. The 10 PIGGY entry fee is not refunded; no reward is recorded.",
  ROUND_EXPIRED: "Round expired — settlement required. Any wallet may settle; the recorded last player receives the prize.",
  SETTLEMENT_PENDING: "Settlement submitted. Waiting for its on-chain receipt.",
  CLAIM_PENDING: "Claim submitted. Your pending balance changes only after the receipt confirms.",
  TRANSACTION_REJECTED: "The wallet request was rejected. No transaction success is recorded.",
  TRANSACTION_FAILED: "The transaction failed or reverted. Refresh chain state before trying again.",
  PAUSED: "SquidPot is paused. New plays are disabled; claims, settlement, expiration, and fulfillment remain available.",
  INSUFFICIENT_SLOT_CAPACITY: "Slot capacity is currently unavailable. The contract will not collect an entry fee for a rejected play.",
  CONTRACT_NOT_INITIALIZED: "The Academic Treasury has not initialized funding for this deployment. Plays remain unavailable.",
};

export type DerivedInputs = {
  configured: boolean;
  connected: boolean;
  correctNetwork: boolean;
  transactionState?: UiState;
  allowance?: bigint;
  entryFee?: bigint;
  paused?: boolean;
  reserve?: bigint;
  maxReward?: bigint;
  activeRequests?: bigint;
  maxRequests?: bigint;
  roundExpired?: boolean;
  fundingInitialized?: boolean;
  requestStatus?: string;
};

export function deriveUiState(input: DerivedInputs): UiState {
  if (!input.configured) return "CONTRACT_NOT_CONFIGURED";
  if (!input.connected) return "DISCONNECTED";
  if (!input.correctNetwork) return "WRONG_NETWORK";
  if (input.transactionState) return input.transactionState;
  if (input.paused) return "PAUSED";
  if (input.roundExpired) return "ROUND_EXPIRED";
  if (input.requestStatus === "REQUESTED") return "VRF_WAITING";
  if (input.requestStatus === "FULFILLED") return "VRF_FULFILLED";
  if (input.requestStatus === "EXPIRED") return "VRF_EXPIRED";
  if (input.reserve !== undefined && input.maxReward !== undefined && input.activeRequests !== undefined && input.maxRequests !== undefined
    && (input.reserve < input.maxReward || input.activeRequests >= input.maxRequests)) return "INSUFFICIENT_SLOT_CAPACITY";
  if (input.allowance !== undefined && input.entryFee !== undefined && input.allowance < input.entryFee) return "READY_TO_APPROVE";
  if (input.fundingInitialized === false) return "CONTRACT_NOT_INITIALIZED";
  return "READY_TO_PLAY";
}

export function transactionErrorState(error: unknown): "TRANSACTION_REJECTED" | "TRANSACTION_FAILED" {
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 4001) {
    return "TRANSACTION_REJECTED";
  }
  if (error instanceof Error && /user rejected|denied transaction|request rejected/i.test(error.message)) {
    return "TRANSACTION_REJECTED";
  }
  return "TRANSACTION_FAILED";
}
