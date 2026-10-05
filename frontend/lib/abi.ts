import { parseAbi } from "viem";

export const piggyAbi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function hasClaimedFaucet(address account) view returns (bool)",
  "function faucet()",
]);

export const squidPotAbi = parseAbi([
  "function ENTRY_FEE() view returns (uint256)",
  "function R_MAX() view returns (uint256)",
  "function MAX_PENDING_REQUESTS() view returns (uint256)",
  "function REQUEST_TIMEOUT_BLOCKS() view returns (uint256)",
  "function currentRoundId() view returns (uint256)",
  "function roundStatus() view returns (uint8)",
  "function deadline() view returns (uint256)",
  "function hardDeadline() view returns (uint256)",
  "function currentPrizePool() view returns (uint256)",
  "function availableSlotReserve() view returns (uint256)",
  "function activePendingRequests() view returns (uint256)",
  "function paused() view returns (bool)",
  "function fundingInitialized() view returns (bool)",
  "function lastPlayer() view returns (address)",
  "function pendingSlotRewards(address account) view returns (uint256)",
  "function pendingPreviousRewards(address account) view returns (uint256)",
  "function pendingPrizes(address account) view returns (uint256)",
  "function getSlotRequest(uint256 requestId) view returns ((address player, uint96 maxReserved, uint96 actualReward, uint64 requestedAtBlock, uint64 roundId, uint8 status))",
  "function play() returns (uint256 requestId)",
  "function settleRound()",
  "function claimSlotRewards()",
  "function claimPreviousRewards()",
  "function claimPrize()",
  "event SlotRequestCreated(uint256 indexed requestId, address indexed player, uint256 indexed roundId, uint256 maxReserved, uint256 requestedAtBlock)",
  "event Played(address indexed player, uint256 indexed roundId, uint256 indexed requestId, uint256 entryFee, uint256 prizeAllocation, uint256 slotAllocation, uint256 previousAllocation, uint256 rolloverAllocation, uint256 burned)",
  "event SlotRequestFulfilled(uint256 indexed requestId, address indexed player, uint256 indexed roundId, uint256 randomWord, uint256 reward)",
  "event SlotRequestExpired(uint256 indexed requestId, address indexed player, uint256 indexed roundId)",
  "event RoundSettled(uint256 indexed roundId, address indexed winner, uint256 prize, uint256 startedAt, uint256 deadline, uint256 settledAt, uint256 plays, uint256 rolloverForNextRound)",
  "event Claimed(address indexed account, uint256 indexed claimRoundId, bytes32 indexed kind, uint256 amount)",
]);

export const roundPhaseLabel = (phase: number | bigint | undefined) => {
  if (phase === 0 || phase === BigInt(0)) return "Waiting";
  if (phase === 1 || phase === BigInt(1)) return "Open";
  if (phase === 2 || phase === BigInt(2)) return "Expired";
  return "Unavailable";
};

export const slotStatusLabel = (status: number | bigint | undefined) => {
  if (status === 0 || status === BigInt(0)) return "NONE";
  if (status === 1 || status === BigInt(1)) return "REQUESTED";
  if (status === 2 || status === BigInt(2)) return "FULFILLED";
  if (status === 3 || status === BigInt(3)) return "EXPIRED";
  return "UNKNOWN";
};
