# Contract Events and Frontend UI States

This document maps the Phase 1 `SquidPot` contract interface to UI behavior. Direct contract reads are authoritative for current state. Receipt logs identify the request created by the user's play; logs/session memory do not replace contract reads.

## Configuration and networks

Required environment variables (no address fallback):

```text
NEXT_PUBLIC_PIGGY_TOKEN_ADDRESS=
NEXT_PUBLIC_SQUIDPOT_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_RPC_URL=
```

Supported chain contexts: local Anvil (31337) and BNB Smart Chain Testnet (97). Wallet chain must equal the configured chain. No production chain or live deployment action is part of this phase. If any required configuration is absent or invalid, the app is non-functional and shows:

> Contract addresses are not configured. Connect local Anvil or BNB Testnet deployment to use SquidPot.

## Read mapping

| UI value | Contract source | Interpretation |
|---|---|---|
| Current round ID | `currentRoundId()` | Current round identifier. |
| Round status | `roundStatus()` | `WAITING` = 0, `OPEN` = 1, `EXPIRED` = 2. Derived by contract timestamp logic. |
| Round deadline | `deadline()` | `0` while waiting; otherwise confirmed deadline. |
| Hard deadline | `hardDeadline()` | Hard cap for the current open round. |
| Countdown | `deadline()` plus latest block timestamp | Display only for OPEN; never use a locally invented round duration. |
| Current prize pool | `currentPrizePool()` | Current round prize liability. |
| Available slot reserve | `availableSlotReserve()` | Available protocol reserve, not user balance. |
| Active request count | `activePendingRequests()` and `MAX_PENDING_REQUESTS()` | Display `active / 10`. |
| Pause | `paused()` | Paused blocks new `play()` only. |
| PIGGY balance/allowance | ERC-20 `balanceOf(account)` / `allowance(account, squidPot)` | Connected account values. |
| Pending claims | `pendingSlotRewards(account)`, `pendingPreviousRewards(account)`, `pendingPrizes(account)` | Claimable values; do not optimistically reduce. |
| Request lifecycle/reward | `getSlotRequest(requestId)` | `status`: NONE 0, REQUESTED 1, FULFILLED 2, EXPIRED 3; reward is shown only for FULFILLED. |
| Current academic constants | `ENTRY_FEE()`, `R_MAX()`, `MAX_PENDING_REQUESTS()`, `REQUEST_TIMEOUT_BLOCKS()` | Read where practical rather than duplicating mutable-looking UI constants. |

All PIGGY integer values use 18 decimals. `currentPrizePool` and pending balances remain unchanged in the UI until refreshed from confirmed chain state.

## Write mapping and confirmation rules

| User action | Contract call | Confirmation rule |
|---|---|---|
| Approve entry | PIGGY `approve(squidPot, ENTRY_FEE)` | Pending until receipt; approval is not a play. |
| Play | `play()` | Wallet submission is not success. Wait for receipt, parse `SlotRequestCreated`, then read the emitted request ID via `getSlotRequest`. Trigger coin animation only after this receipt confirms. |
| Settle | `settleRound()` | Enable only when direct `roundStatus()` is EXPIRED. Any wallet may call; recorded `lastPlayer` is winner. Show success only after receipt. |
| Slot reward claim | `claimSlotRewards()` | Pending until receipt, then refresh claim balance and show confirmed result. |
| Previous-player claim | `claimPreviousRewards()` | Same receipt and refresh rules. |
| Prize claim | `claimPrize()` | Same receipt and refresh rules. |

No contract pause/unpause control is exposed in the user interface. Claims, expiration, settlement, and fulfillment are not disabled just because the contract is paused; only new play is blocked.

## Event interpretation

- `SlotRequestCreated(requestId, player, roundId, maxReserved, requestedAtBlock)`: parse this event from the confirmed Play receipt. It is the source of the request ID to display and query.
- `Played(player, roundId, requestId, entryFee, ...)`: confirmed play and allocation summary; it is not evidence of a VRF reward.
- `SlotRequestFulfilled(requestId, player, roundId, randomWord, reward)`: event corroborates a fulfilled state. Read `getSlotRequest(requestId)` and show the reward only when status is FULFILLED.
- `SlotRequestExpired(requestId, player, roundId)`: request expired; entry fee is not refunded and no reward is fabricated.
- `SlotCallbackIgnored` / `SlotCallbackInvalid`: diagnostic events; do not turn these into reward states.
- `RoundSettled(roundId, winner, prize, startedAt, deadline, settledAt, plays, rolloverForNextRound)`: settlement result; caller is not necessarily winner.
- `Claimed(account, claimRoundId, kind, amount)`: `claimRoundId` means the round active at claim time, not necessarily the round that originated the liability. Only show a successful claim after the receipt confirms.
- `FundingInitialized`: initialization metadata; not a user gameplay event.

## Explicit UI state model

Every state has readable text, is exposed through a polite status region where appropriate, and never depends on color alone.

| State | User-facing meaning / action |
|---|---|
| `DISCONNECTED` | Connect a wallet to read account-specific values or transact. |
| `WRONG_NETWORK` | Switch to the configured local Anvil or BNB Testnet chain; show configured and wallet chain IDs. |
| `CONTRACT_NOT_CONFIGURED` | Show the exact non-functional configuration message; no invented gameplay data. |
| `READY_TO_APPROVE` | Exact entry allowance is insufficient; approval requests only `ENTRY_FEE`. |
| `APPROVAL_PENDING` | Wallet approval submitted; waiting for receipt. |
| `READY_TO_PLAY` | Connected/configured, initialized, unpaused, OPEN or WAITING, sufficient balance/allowance/capacity. |
| `PLAY_WALLET_CONFIRMATION` | Awaiting wallet decision; no coin animation and no success implication. |
| `PLAY_TRANSACTION_PENDING` | Broadcast play awaiting receipt; no animation or reward. |
| `VRF_WAITING` | Confirmed play/request ID exists; direct request status is REQUESTED. |
| `VRF_FULFILLED` | Direct request status is FULFILLED; now show the contract's exact reward (including zero). |
| `VRF_EXPIRED` | Direct request status is EXPIRED; explain fee is not refunded and no reward exists. |
| `ROUND_EXPIRED` | Direct round status is EXPIRED; play disabled, permissionless settlement available. |
| `SETTLEMENT_PENDING` | Settlement submitted; wait for receipt before declaring completion. |
| `CLAIM_PENDING` | A specific claim submitted; wait for receipt before reducing displayed pending value. |
| `TRANSACTION_REJECTED` | User rejected the wallet request; no on-chain success. |
| `TRANSACTION_FAILED` | Transaction reverted or receipt failed; expose transaction hash/error safely. |
| `PAUSED` | New play unavailable; explain other contract actions remain available. |
| `INSUFFICIENT_SLOT_CAPACITY` | Reserve below `R_MAX` or active requests at maximum; entry is not collected because play reverts before transfer. |

## Session recovery and activity

Without an indexer, the frontend cannot enumerate all historical requests. After confirmed Play, store the observed request ID in session-scoped storage and re-read each ID with `getSlotRequest()` after reload. Do not persist balance, reward, request status, or claim success in local or session storage. Label activity `Session activity` and disclose that it contains only activity observed in this browser session. A missing session ID does not mean that the contract has no other requests.
