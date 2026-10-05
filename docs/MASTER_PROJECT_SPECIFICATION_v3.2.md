# Master Project Specification v3.2 — Engineering & Invariant Hardened Testnet Specification

## Status and academic disclosure

SquidPot is an academic prototype for BNB Smart Chain Testnet only. PIGGY has no real-world value. The system must not support real-money deposits and documentation or UI must not describe it as an investment product or promise returns. A visible notice is required wherever users interact with the application:

> Testnet Academic Prototype — Tokens Have No Real-World Value

Phase 1 is contract-only. Frontend, Carnival Temple Fair UI, Ferris wheel, audio, The Graph integration, live deployment, Vercel deployment, and production secrets are intentionally deferred.

## Token and provisioning

PIGGY is an ERC-20-compatible, non-rebasing, non-fee-on-transfer academic Testnet token with 18 decimals. The deployment mints 100,000,000 PIGGY initially; the permissionless Testnet faucet can subsequently mint 100 PIGGY per call, so total supply is not fixed. PIGGY has no real-world value and must not be deployed to a production network.

The contract has an explicit `academicTreasury` address. Only `academicTreasury` may call `initializeFunding()`. One call to `initializeFunding()` must transfer exactly 100,500 PIGGY to the contract: 100,000 PIGGY Genesis Prize Pool plus 500 PIGGY Initial Slot Seed. The contract verifies the balance delta, rejects fee-on-transfer behavior, and updates accounting only after exact receipt. `play()` is unavailable before successful initialization.

## Entry allocation

Each successful play transfers exactly 10 PIGGY from the player and accounts for the full entry as follows:

| Destination | Amount |
|---|---:|
| Current prize pool | 4.00 PIGGY |
| Available slot reserve | 3.00 PIGGY |
| Previous-player reward | 1.50 PIGGY |
| Next-round rollover | 1.00 PIGGY |
| Irrecoverable token sink | 0.50 PIGGY |

The 0.50 PIGGY sink is transferred to `0x000000000000000000000000000000000000dEaD`. The contract verifies the exact sink transfer. If there is no previous player, or the same address plays consecutively, the 1.50 PIGGY previous-player allocation goes to `rolloverReserve`. This prevents direct self-reward, but does not prevent Sybil farming through multiple wallets. A two-wallet Sybil limitation is intentionally disclosed rather than claimed solved.

## Reward probabilities and bankroll interpretation

The slot roll is `randomWord % 10_000`:

| Roll | Reward |
|---|---:|
| 0–7,999 | 0 PIGGY |
| 8,000–9,499 | 10 PIGGY |
| 9,500–9,949 | 20 PIGGY |
| 9,950–9,999 | 50 PIGGY |

The expected value is:

`SlotEV = (0.80 × 0) + (0.15 × 10) + (0.045 × 20) + (0.005 × 50) = 2.65 PIGGY`

`ExpectedSlotMargin = 3.00 - 2.65 = 0.35 PIGGY/play`

A positive expected margin does not guarantee short-term liquidity. Accumulated Slot Reserve surplus remains protocol bankroll inside the contract and has no owner withdrawal path.

Academic analysis must separate:

1. Phase A: Genesis-subsidized behavior.
2. Phase B: rollover-funded initial prize behavior.
3. Slot bankroll performance.
4. Results before and after excluding the Initial Slot Seed.

Starting from Round 2, each round begins with accumulated rollover reserve and receives no additional Genesis Prize subsidy from the Academic Treasury. The Initial Slot Seed remains circulating as slot liquidity and must be separated from any evaluation of the protocol’s ability to sustain itself.

## Solvency and accounting

The seven explicit liability variables are:

```solidity
currentPrizePool
availableSlotReserve
reservedSlotLiability
totalPendingSlotRewards
totalPendingPreviousRewards
rolloverReserve
totalPendingPrizes
```

The contract must not add a generic `slotReserve` variable that double-counts available, reserved, or pending slot balances. The liability equation is:

`TotalLiabilities = currentPrizePool + availableSlotReserve + reservedSlotLiability + totalPendingSlotRewards + totalPendingPreviousRewards + rolloverReserve + totalPendingPrizes`

At all times:

`ContractBalance >= TotalLiabilities`

`AccountingSurplus = ContractBalance - TotalLiabilities >= 0`

Direct token donations increase Accounting Surplus only. Claims reduce the relevant pending liability before the token interaction. No owner function may withdraw user liabilities, the prize pool, or Slot Reserve.

## Round identity and lifecycle

`currentRoundId` is a monotonically increasing public identifier. The derived lifecycle is:

`WAITING → OPEN → EXPIRED → SETTLEMENT → WAITING`

`EXPIRED` is derived from timestamps and is not a stored, auto-changing state. In `WAITING`, `roundStartedAt`, `deadline`, `hardDeadline`, and `lastPlayer` are zero. There is no countdown and settlement reverts.

The first play sets:

```solidity
roundStartedAt = block.timestamp;
hardDeadline = block.timestamp + 24 hours;
deadline = block.timestamp + 3 minutes;
```

For later plays:

```solidity
elapsed = block.timestamp - roundStartedAt;
extension = elapsed < 12 hours ? 3 minutes : 30 seconds;
deadline = min(block.timestamp + extension, hardDeadline);
```

A play requires `block.timestamp < deadline`. Settlement saves the winner and prize, moves the prize to `pendingPrizes[winner]`, moves `rolloverReserve` exactly once into the next round’s prize pool, clears the current round, increments `currentRoundId`, and performs no token transfer. An expired round with no `lastPlayer` is invalid and reverts. Settlement is permissionless and the caller does not become the winner. Relevant events include `roundId`; the settlement event includes round ID, winner, prize, start, deadline, settlement time, play count, and next-round rollover.

## Slot request lifecycle

The request enum is:

```solidity
enum SlotStatus { NONE, REQUESTED, FULFILLED, EXPIRED }
```

Each request stores `player`, `maxReserved`, `actualReward`, `requestedAtBlock`, `roundId`, and `status`. `R_MAX` is 50 PIGGY, at most 10 requests may be pending, `REQUEST_TIMEOUT_BLOCKS` is 200, and `NUM_WORDS` is 1. The 200-block value is a Testnet research parameter, not a production guarantee.

Capacity is checked before collecting the entry fee:

`availableSlotReserve >= R_MAX && activePendingRequests < MAX_PENDING_REQUESTS`

Request creation subtracts R_MAX from available reserve, adds it to reserved liability, and increments the active counter. Fulfillment returns `R_MAX - reward` to available reserve, records the reward as a pull-payment liability, removes R_MAX from reserved liability, and decrements the active counter. Expiration returns all R_MAX to available reserve, removes the reserved liability, and decrements the counter. Expiration does not refund the entry fee.

The returned request ID must still have status `NONE` before the mapping is written. A synchronous callback during request creation is explicitly ignored while the request is not yet tracked; the request is then recorded as `REQUESTED` and can be fulfilled or expired normally. A late callback after expiration, duplicate callback, or unknown callback emits an event and returns without corrupting accounting. A zero reward still transitions to `FULFILLED`. Invalid callbacks with no random word are emitted and left `REQUESTED` so they can expire safely.

SquidPot directly inherits Chainlink's official `VRFConsumerBaseV2Plus` and creates subscription-mode requests through `IVRFCoordinatorV2Plus.requestRandomWords(VRFV2PlusClient.RandomWordsRequest)`. The immutable request configuration records the subscription ID, key hash, callback gas limit, confirmation count, and explicit native-versus-LINK payment choice. Fulfillment enters through the official base contract's `rawFulfillRandomWords`, which accepts only the currently configured coordinator, then dispatches to SquidPot's internal accounting callback. The BNB Testnet deployment policy requires chain ID 97, coordinator `0xDA3b641D438362C440Ac5458c57e00a712b66700`, and key hash `0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26`.

The official consumer base uses Chainlink's confirmed-owner mechanism and exposes coordinator migration to the owner or current coordinator. This is an explicit privileged configuration operation for coordinator migration; it does not provide any token-withdrawal path. A deployed instance must be audited against the official coordinator before and after any migration. The local mock implements the same official v2.5 request selector and callback entry point while adding deterministic IDs, selected random words, duplicate/unknown callbacks, request failure, synchronous callback, and no-word controls for tests. It is not a production adapter and cannot be selected by the BNB Testnet deployment policy.

## Claims, pause, and security controls

`claimSlotRewards()`, `claimPreviousRewards()`, and `claimPrize()` are separate pull-payment functions. Each is `nonReentrant`, clears the user balance and aggregate total before transferring, and reverts if there is nothing to claim. These functions remain available while paused. `Claimed` events use the field name `claimRoundId`; it identifies the round active when the claim executes, not the round that originally created the liability.

Pause disables only new `play()` calls. Settlement, request expiration, VRF fulfillment, and claims remain available while paused. There is no owner withdrawal of player liabilities, the prize pool, or Slot Reserve. The design does not claim to prevent Sybil activity, validator/MEV effects, or off-chain infrastructure failure.

## Phase 1 verification requirements

Tests cover initialization authority and exact receipt, pre-initialization protection, all entry allocations, self-play, round timing and settlement, both timer-extension regimes, exact hard-cap behavior, all reward boundaries, zero rewards, capacity, the official v2.5 request shape and payment arguments, coordinator-only fulfillment, expiration, late/duplicate/unknown callbacks, synchronous callback ordering, duplicate request IDs, checked narrowing casts, pull claims and double claims, selective pause, donations, failed burn, failed VRF requests, deployment-configuration rejection, independent-model fuzzed accounting, solvency, and active-request consistency.

Required commands from `contracts` are:

```powershell
forge fmt --check
forge build
forge test -vvv
forge test --match-contract SquidPotInvariantTest -vvv
```

No live network deployment, real subscription, production secret, frontend, The Graph integration, or Vercel operation is part of Phase 1.
