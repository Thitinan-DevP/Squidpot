"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  formatUnits,
  parseEventLogs,
  type Address,
  type Hash,
  type PublicClient,
} from "viem";
import {
  useBlock,
  useConnect,
  useConnection,
  useDisconnect,
  usePublicClient,
  useReadContracts,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { frontendConfig } from "@/lib/config";
import { piggyAbi, roundPhaseLabel, slotStatusLabel, squidPotAbi } from "@/lib/abi";
import {
  addSessionActivity,
  createSessionActivity,
  getServerSessionActivitySnapshot,
  getSessionActivitySnapshot,
  subscribeSessionActivity,
  type SessionActivity,
} from "@/lib/format";
import { deriveUiState, friendlyWalletError, transactionErrorState, type UiState } from "@/lib/ui-state";

export type RequestView = {
  id: string;
  status: string;
  player?: Address;
  reward?: bigint;
  roundId?: bigint;
  requestedAtBlock?: bigint;
};

function readValue<T>(values: readonly unknown[] | undefined, index: number): T | undefined {
  const row = values?.[index] as { status?: string; result?: T } | undefined;
  return row?.status === "success" ? row.result : undefined;
}

function bigintValue(value: unknown): bigint | undefined {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  return undefined;
}

function requestFields(value: unknown): { player?: Address; maxReserved?: bigint; actualReward?: bigint; roundId?: bigint; requestedAtBlock?: bigint; status?: number | bigint } {
  if (Array.isArray(value)) {
    return {
      player: value[0] as Address,
      maxReserved: bigintValue(value[1]),
      actualReward: bigintValue(value[2]),
      requestedAtBlock: bigintValue(value[3]),
      roundId: bigintValue(value[4]),
      status: value[5] as number | bigint,
    };
  }
  if (typeof value === "object" && value !== null) {
    const row = value as Record<string, unknown>;
    return {
      player: row.player as Address | undefined,
      maxReserved: bigintValue(row.maxReserved),
      actualReward: bigintValue(row.actualReward),
      requestedAtBlock: bigintValue(row.requestedAtBlock),
      roundId: bigintValue(row.roundId),
      status: row.status as number | bigint | undefined,
    };
  }
  return {};
}

export function useSquidPot() {
  const { address, chainId, isConnected } = useConnection();
  const { connectors, connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: frontendConfig?.chainId });
  const activity = useSyncExternalStore(subscribeSessionActivity, getSessionActivitySnapshot, getServerSessionActivitySnapshot);
  const [transactionState, setTransactionState] = useState<UiState | undefined>();
  const [transactionHash, setTransactionHash] = useState<Hash | undefined>();
  const [transactionError, setTransactionError] = useState<string | undefined>();
  const [confirmedAction, setConfirmedAction] = useState<string | undefined>();

  const selectedRequestId = activity.find((entry) => entry.requestId)?.requestId;

  const contractReads = useMemo(() => {
    if (!frontendConfig) return undefined;
    const account = (address ?? "0x0000000000000000000000000000000000000000") as Address;
    return [
      { address: frontendConfig.piggyAddress, abi: piggyAbi, functionName: "balanceOf", args: [account] },
      { address: frontendConfig.piggyAddress, abi: piggyAbi, functionName: "allowance", args: [account, frontendConfig.squidPotAddress] },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "ENTRY_FEE" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "R_MAX" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "MAX_PENDING_REQUESTS" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "REQUEST_TIMEOUT_BLOCKS" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "currentRoundId" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "roundStatus" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "deadline" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "hardDeadline" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "currentPrizePool" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "availableSlotReserve" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "activePendingRequests" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "paused" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "fundingInitialized" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "lastPlayer" },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "pendingSlotRewards", args: [account] },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "pendingPreviousRewards", args: [account] },
      { address: frontendConfig.squidPotAddress, abi: squidPotAbi, functionName: "pendingPrizes", args: [account] },
    ] as const;
  }, [address]);

  const reads = useReadContracts({
    contracts: contractReads,
    query: { enabled: Boolean(frontendConfig), refetchInterval: 8_000 },
  });
  const { data: block } = useBlock({
    chainId: frontendConfig?.chainId,
    watch: true,
    query: { enabled: Boolean(frontendConfig) },
  });

  const trackedIds = activity.flatMap((entry) => entry.requestId ? [entry.requestId] : []);
  const requestQueries = useQueries({
    queries: trackedIds.map((requestId) => ({
      queryKey: ["squidpot-slot-request", frontendConfig?.chainId, requestId],
      enabled: Boolean(frontendConfig && publicClient),
      refetchInterval: 6_000,
      queryFn: async () => {
        if (!frontendConfig || !publicClient) throw new Error("Contract client is unavailable");
        return await publicClient.readContract({
          address: frontendConfig.squidPotAddress,
          abi: squidPotAbi,
          functionName: "getSlotRequest",
          args: [BigInt(requestId)],
        });
      },
    })),
  });
  const requests: RequestView[] = trackedIds.map((id, index) => {
    const fields = requestFields(requestQueries[index]?.data);
    return {
      id,
      status: slotStatusLabel(fields.status),
      player: fields.player,
      reward: fields.actualReward,
      roundId: fields.roundId,
      requestedAtBlock: fields.requestedAtBlock,
    };
  });

  const values = reads.data as readonly unknown[] | undefined;
  const tokenBalance = address ? bigintValue(readValue<unknown>(values, 0)) : undefined;
  const allowance = address ? bigintValue(readValue<unknown>(values, 1)) : undefined;
  const entryFee = bigintValue(readValue<unknown>(values, 2));
  const maxReward = bigintValue(readValue<unknown>(values, 3));
  const maxRequests = bigintValue(readValue<unknown>(values, 4));
  const requestTimeoutBlocks = bigintValue(readValue<unknown>(values, 5));
  const currentRoundId = bigintValue(readValue<unknown>(values, 6));
  const roundPhaseRaw = readValue<number | bigint>(values, 7);
  const roundPhase = roundPhaseLabel(roundPhaseRaw);
  const deadline = bigintValue(readValue<unknown>(values, 8));
  const hardDeadline = bigintValue(readValue<unknown>(values, 9));
  const currentPrizePool = bigintValue(readValue<unknown>(values, 10));
  const availableSlotReserve = bigintValue(readValue<unknown>(values, 11));
  const activePendingRequests = bigintValue(readValue<unknown>(values, 12));
  const paused = readValue<boolean>(values, 13);
  const fundingInitialized = readValue<boolean>(values, 14);
  const lastPlayer = readValue<Address>(values, 15);
  const pendingSlotRewards = address ? bigintValue(readValue<unknown>(values, 16)) : undefined;
  const pendingPreviousRewards = address ? bigintValue(readValue<unknown>(values, 17)) : undefined;
  const pendingPrize = address ? bigintValue(readValue<unknown>(values, 18)) : undefined;
  const chainTimestamp = block?.timestamp;
  const correctNetwork = Boolean(frontendConfig && chainId === frontendConfig.chainId);

  const latestRequest = requests.find((request) => request.id === selectedRequestId);

  const rememberActivity = (entry: SessionActivity) => addSessionActivity(entry);
  const refetchAll = async () => {
    await Promise.all([reads.refetch(), ...requestQueries.map((query) => query.refetch())]);
  };

  async function executeWrite(
    action: SessionActivity["action"],
    functionName: "approve" | "play" | "settleRound" | "claimSlotRewards" | "claimPreviousRewards" | "claimPrize",
    args: readonly unknown[] = [],
  ): Promise<boolean> {
    if (!frontendConfig || !address || !publicClient || (action === "approve" && entryFee === undefined)) return false;
    setTransactionError(undefined);
    setTransactionHash(undefined);
    setConfirmedAction(undefined);
    const pendingState: UiState = action === "play" ? "PLAY_WALLET_CONFIRMATION"
      : action === "settle" ? "SETTLEMENT_PENDING" : action === "approve" ? "APPROVAL_PENDING" : "CLAIM_PENDING";
    setTransactionState(pendingState);
    let observedActivity: SessionActivity | undefined;
    try {
      const isApproval = action === "approve";
      const hash = await writeContractAsync(isApproval
        ? {
            address: frontendConfig.piggyAddress,
            abi: piggyAbi,
            functionName: "approve",
            args: [frontendConfig.squidPotAddress, entryFee!],
            chainId: frontendConfig.chainId,
          }
        : {
            address: frontendConfig.squidPotAddress,
            abi: squidPotAbi,
            functionName,
            args,
            chainId: frontendConfig.chainId,
          } as never) as Hash;
      setTransactionHash(hash);
      observedActivity = createSessionActivity({ action, hash, status: "SUBMITTED" });
      rememberActivity(observedActivity);
      setTransactionState(action === "play" ? "PLAY_TRANSACTION_PENDING"
        : action === "settle" ? "SETTLEMENT_PENDING" : action === "approve" ? "APPROVAL_PENDING" : "CLAIM_PENDING");
      const receipt = await (publicClient as PublicClient).waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction receipt status is reverted");

      let requestId: string | undefined;
      if (action === "play") {
        const events = parseEventLogs({ abi: squidPotAbi, eventName: "SlotRequestCreated", logs: receipt.logs });
        const created = events[0]?.args as { requestId?: bigint } | undefined;
        if (created?.requestId === undefined) throw new Error("Confirmed play receipt had no SlotRequestCreated event");
        requestId = created.requestId.toString();
      }

      observedActivity = createSessionActivity({
        id: observedActivity?.id,
        action,
        hash: receipt.transactionHash,
        requestId,
        status: "CONFIRMED",
      });
      rememberActivity(observedActivity);
      setConfirmedAction(action);
      setTransactionState(undefined);
      await refetchAll();
      return true;
    } catch (error) {
      const state = transactionErrorState(error);
      setTransactionState(state);
      setTransactionError(friendlyWalletError(error));
      observedActivity = createSessionActivity({
        id: observedActivity?.id,
        action,
        hash: observedActivity?.hash,
        status: state === "TRANSACTION_REJECTED" ? "REJECTED" : "FAILED",
      });
      rememberActivity(observedActivity);
      return false;
    }
  }

  const balanceSufficient = Boolean(
    isConnected && tokenBalance !== undefined && entryFee !== undefined && tokenBalance >= entryFee
  );
  const capacityAvailable = Boolean(
    availableSlotReserve !== undefined && maxReward !== undefined && activePendingRequests !== undefined && maxRequests !== undefined
    && availableSlotReserve >= maxReward && activePendingRequests < maxRequests
  );
  const approvalNeeded = Boolean(
    isConnected && allowance !== undefined && entryFee !== undefined && allowance < entryFee
  );
  const canSpin = Boolean(
    frontendConfig && isConnected && correctNetwork && fundingInitialized && !paused && roundPhase !== "Expired"
    && balanceSufficient && capacityAvailable && !transactionState
  );

  async function spinForTenPiggy(): Promise<boolean> {
    if (!canSpin) return false;
    if (approvalNeeded) {
      const approved = await executeWrite("approve", "approve");
      if (!approved) return false;
    }
    return await executeWrite("play", "play");
  }

  const connectWallet = async () => {
    const connector = connectors[0];
    if (connector) await connectAsync({ connector });
  };

  const switchToConfiguredChain = async () => {
    if (frontendConfig) await switchChainAsync({ chainId: frontendConfig.chainId });
  };

  const readyState = deriveUiState({
    configured: Boolean(frontendConfig),
    connected: isConnected,
    correctNetwork,
    transactionState,
    allowance,
    entryFee,
    paused,
    reserve: availableSlotReserve,
    maxReward,
    activeRequests: activePendingRequests,
    maxRequests,
    roundExpired: roundPhase === "Expired",
    fundingInitialized,
    requestStatus: latestRequest?.status,
  });

  return {
    address,
    chainId,
    isConnected,
    connectWallet,
    disconnect,
    switchToConfiguredChain,
    correctNetwork,
    chainTimestamp,
    tokenBalance,
    allowance,
    entryFee,
    requestTimeoutBlocks,
    maxReward,
    maxRequests,
    currentRoundId,
    roundPhase,
    deadline,
    hardDeadline,
    currentPrizePool,
    availableSlotReserve,
    activePendingRequests,
    paused,
    fundingInitialized,
    lastPlayer,
    pendingSlotRewards,
    pendingPreviousRewards,
    pendingPrize,
    readyState,
    transactionState,
    transactionHash,
    transactionError,
    confirmedAction,
    selectedRequestId,
    latestRequest,
    requests,
    activity,
    balanceSufficient,
    approvalNeeded,
    canSpin,
    spinForTenPiggy,
    isLoading: reads.isPending,
    readError: reads.error,
    executeWrite,
    refetchAll,
    formatUnits,
  };
}
