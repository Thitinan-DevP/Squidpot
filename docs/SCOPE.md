Develop the complete SquidPot project in:

```text
D:\Squidpot
```

Repository:

```text
https://github.com/Thitinan-DevP/Squidpot.git
```

Follow every requirement below. Do not silently simplify, replace, or omit any financial invariant, lifecycle state, security control, accessibility requirement, or acceptance test.

# 1. Project scope

Project name:

```text
SquidPot — Academic GameFi Prototype
```

Purpose:

- Academic prototype running exclusively on BNB Smart Chain Testnet.
- It is not an investment product.
- It must not support real-money deposits.
- Do not use “investment,” “high ROI,” “guaranteed return,” or similar claims in the UI or documentation.
- Display a visible “Testnet Academic Prototype — Tokens Have No Real-World Value” notice.

Technology:

- Solidity 0.8.20 or newer
- Foundry
- OpenZeppelin `SafeERC20`, `ReentrancyGuard`, `Pausable`, and `Ownable`
- Chainlink VRF v2.5 or the supported version for BNB Smart Chain Testnet
- Next.js with TypeScript
- Tailwind CSS
- Wagmi and Viem
- Framer Motion for accessible motion support
- Direct RPC reads for critical live state
- Vercel-compatible frontend
- Accessible semantic HTML

Implement the smart contracts and tests first. Begin frontend integration only after the contract test suite passes.

# 2. Required project structure

Use at least this structure:

```text
D:\Squidpot
├─ README.md
├─ docs
│  ├─ MASTER_PROJECT_SPECIFICATION_v3.2.md
│  ├─ FRONTEND_DESIGN_SYSTEM.md
│  ├─ CONTRACT_EVENTS_AND_UI_STATES.md
│  └─ TEST_RESULTS.md
├─ contracts
│  ├─ foundry.toml
│  ├─ src
│  │  ├─ PiggyToken.sol
│  │  └─ SquidPot.sol
│  ├─ test
│  │  ├─ SquidPot.unit.t.sol
│  │  ├─ SquidPot.fuzz.t.sol
│  │  ├─ SquidPot.invariant.t.sol
│  │  └─ mocks
│  └─ script
│     ├─ DeployPiggy.s.sol
│     └─ DeploySquidPot.s.sol
└─ frontend
   ├─ app
   ├─ components
   ├─ hooks
   ├─ lib
   ├─ public
   └─ tests
```

Do not overwrite existing files before inspecting them.

# 3. Master Project Specification v3.2

Create:

```text
D:\Squidpot\docs\MASTER_PROJECT_SPECIFICATION_v3.2.md
```

Use this title:

```text
Master Project Specification v3.2 — Engineering & Invariant Hardened Testnet Specification
```

Do not call it “Production-Grade.”

## Token requirements

PIGGY shall be:

- Initial supply of 100,000,000 PIGGY
- Permissionless faucet minting of exactly 100 PIGGY per call on Testnet only
- 18 decimals
- Non-rebasing
- Non-fee-on-transfer
- ERC-20-compatible

The dead-address transfer reduces circulating supply. Faucet calls increase `totalSupply()` by 100 PIGGY each time. PIGGY is Testnet-only and has no real-world value.

## Initial provisioning

- Genesis Prize Pool: 100,000 PIGGY
- Initial Slot Seed: 500 PIGGY
- Maximum concurrent VRF requests: 10
- Maximum reward liability per request: 50 PIGGY
- Initialization can occur only once.
- `play()` must not work before initialization.
- Define the Academic Treasury explicitly.
- Verify the exact token balance received during initialization.
- Update accounting variables only after confirming that the complete funding amount was received.

## Entry allocation

Each successful play costs 10 PIGGY and allocates:

| Destination | Amount |
|---|---:|
| Current prize pool | 4.00 PIGGY |
| Available slot reserve | 3.00 PIGGY |
| Previous-player reward | 1.50 PIGGY |
| Next-round rollover | 1.00 PIGGY |
| Irrecoverable token sink | 0.50 PIGGY |

If there is no previous player, or the same address plays consecutively, send the 1.50 PIGGY previous-player allocation to `rolloverReserve`.

State honestly that this prevents direct self-reward by the same address but does not prevent Sybil farming through multiple wallets.

## Random reward tiers

Use:

```solidity
uint256 roll = randomWord % 10_000;
```

| Roll | Reward |
|---|---:|
| 0–7,999 | 0 PIGGY |
| 8,000–9,499 | 10 PIGGY |
| 9,500–9,949 | 20 PIGGY |
| 9,950–9,999 | 50 PIGGY |

Include the formulas:

\[
SlotEV=(0.80\times0)+(0.15\times10)+(0.045\times20)+(0.005\times50)=2.65
\]

\[
ExpectedSlotMargin=3.00-2.65=0.35\text{ PIGGY/play}
\]

Explain that a positive expected margin does not guarantee short-term liquidity.

The accumulated Slot Reserve surplus remains protocol bankroll inside the contract and cannot be withdrawn by the owner.

## Solvency invariant

Track these seven liability variables explicitly:

```solidity
currentPrizePool
availableSlotReserve
reservedSlotLiability
totalPendingSlotRewards
totalPendingPreviousRewards
rolloverReserve
totalPendingPrizes
```

Use:

\[
\begin{aligned}
TotalLiabilities={}&currentPrizePool\\
&+availableSlotReserve\\
&+reservedSlotLiability\\
&+totalPendingSlotRewards\\
&+totalPendingPreviousRewards\\
&+rolloverReserve\\
&+totalPendingPrizes
\end{aligned}
\]

\[
ContractBalance\ge TotalLiabilities
\]

\[
AccountingSurplus=ContractBalance-TotalLiabilities\ge0
\]

Do not introduce a generic `slotReserve` variable that double-counts the available, reserved, or pending balances.

# 4. Round identity and lifecycle

Add:

```solidity
uint256 public currentRoundId;
```

Lifecycle:

```text
WAITING → OPEN → EXPIRED → SETTLEMENT → WAITING
```

`EXPIRED` must be derived from timestamps, not stored as an automatically changing state.

In `WAITING`:

```solidity
roundStartedAt = 0;
deadline = 0;
hardDeadline = 0;
lastPlayer = address(0);
```

There is no countdown during `WAITING`, and `settleRound()` must revert.

For the first play:

```solidity
roundStartedAt = block.timestamp;
hardDeadline = block.timestamp + 24 hours;
deadline = block.timestamp + 3 minutes;
```

For later plays:

```solidity
uint256 elapsed = block.timestamp - roundStartedAt;
uint256 extension =
    elapsed < 12 hours
        ? 3 minutes
        : 30 seconds;

deadline = min(block.timestamp + extension, hardDeadline);
```

A play is allowed only when:

```solidity
block.timestamp < deadline
```

Settlement must:

1. Save the current winner and prize.
2. Set `currentPrizePool` to zero.
3. Add the prize to `pendingPrizes[winner]`.
4. Increase `totalPendingPrizes`.
5. Move `rolloverReserve` into the next round’s `currentPrizePool`.
6. Set `rolloverReserve` to zero.
7. Increase `currentRoundId`.
8. Reset the round to `WAITING`.
9. Never transfer tokens from `settleRound()`.
10. Prevent repeated settlement of the same round.

If an expired round has `lastPlayer == address(0)`, revert because this violates the state invariant.

All relevant events must include `roundId`.

The round-settlement event must include at least:

- Round ID
- Winner
- Prize
- Started time
- Deadline
- Settlement time
- Number of plays
- Rollover for the next round

# 5. Slot request lifecycle

Use:

```solidity
enum SlotStatus {
    NONE,
    REQUESTED,
    FULFILLED,
    EXPIRED
}
```

Use a request structure containing:

```solidity
address player;
uint96 maxReserved;
uint96 actualReward;
uint64 requestedAtBlock;
uint64 roundId;
SlotStatus status;
```

Required constants:

```solidity
R_MAX = 50 ether;
MAX_PENDING_REQUESTS = 10;
REQUEST_TIMEOUT_BLOCKS = 200;
NUM_WORDS = 1;
```

Requirements:

- The 200-block timeout is a Testnet research parameter, not a production guarantee.
- Expiration does not refund the 10 PIGGY entry fee.
- A late callback after expiration must emit an event and return.
- A duplicate or unknown callback must emit an event and return.
- Invalid callback states must not revert.
- A zero reward must still end in `FULFILLED`.
- Verify that a returned `requestId` is still `NONE` before writing the request mapping.
- `activePendingRequests` must match the number of requests in `REQUESTED`.

When creating a request:

```solidity
availableSlotReserve -= R_MAX;
reservedSlotLiability += R_MAX;
activePendingRequests++;
```

When fulfilled with reward `R`:

```solidity
reservedSlotLiability -= R_MAX;
availableSlotReserve += R_MAX - R;
totalPendingSlotRewards += R;
pendingSlotRewards[player] += R;
activePendingRequests--;
```

When expired:

```solidity
reservedSlotLiability -= R_MAX;
availableSlotReserve += R_MAX;
activePendingRequests--;
```

# 6. Play capacity and withdrawal rules

Use a conservative capacity policy:

```solidity
availableSlotReserve >= R_MAX
activePendingRequests < MAX_PENDING_REQUESTS
```

Check capacity before transferring tokens from the player.

If capacity is unavailable:

- Revert the entire transaction.
- Do not collect the entry fee.
- Do not silently remove the player’s slot entitlement.

Create separate pull-payment functions:

```solidity
claimSlotRewards()
claimPreviousRewards()
claimPrize()
```

Each claim function must:

- Use `nonReentrant`
- Follow Checks-Effects-Interactions
- Set the pending balance to zero before transfer
- Decrease the relevant aggregate pending total
- Revert when there is nothing to claim
- Remain callable while paused

When paused:

- Disable only `play()`.
- Keep claims enabled.
- Keep settlement enabled.
- Keep request expiration enabled.
- Keep VRF fulfillment enabled.

Do not implement any owner function that can withdraw player liabilities, the prize pool, or the Slot Reserve.

# 7. Academic interpretation

Separate the analysis into:

- Phase A: Genesis-subsidized behavior
- Phase B: Rollover-funded initial prize behavior
- Slot bankroll performance
- Results before and after excluding the Initial Slot Seed

Use this clarification:

“Starting from Round 2, each round begins with the accumulated rollover reserve and receives no additional Genesis Prize subsidy from the Academic Treasury. However, the Initial Slot Seed remains circulating as slot liquidity and must be separated from any evaluation of the protocol’s ability to sustain itself.”

# 8. Approved Phase 2 frontend scope — Single On-Chain PIGGY Reward Wheel

The approved frontend is a clean, calm, responsive Web3 interface centered exclusively around a single on-chain PIGGY reward wheel. The earlier Carnival Temple Fair theme and coin-to-piggy-bank animation are removed in full. Do not build, reference, or style piggy-bank visuals, coin-drop rails, ferris wheels, or carnival themes. Do not use gambling, investment, ROI, jackpot, dividend, or profit language.

Use Next.js, TypeScript, Tailwind CSS, Wagmi, Viem, and accessible semantic HTML/SVG. Do not add Supabase, The Graph, a backend database, production mock data, hardcoded balances, hardcoded rewards, or fake countdown data.

The sole visual and gameplay interaction is the single on-chain PIGGY reward wheel:
- A prominent `Spin for 10 PIGGY` button triggers entry (approving PIGGY if needed, then calling `play()`).
- All pre-flight checks (wallet connection, BNB Smart Chain Testnet, configuration, balance >= 10 PIGGY, paused status, slot capacity) are strictly preserved.
- The wheel begins spinning only after the `play()` transaction receipt is confirmed on-chain.
- While the Chainlink VRF request is `REQUESTED`, the wheel continuously spins with status `Waiting for verified on-chain result`.
- When the request is `FULFILLED`, the `Stop & Reveal` button is enabled.
- `Stop & Reveal` is strictly presentation-only: it stops the rotation animation and reveals the already-recorded on-chain reward. It cannot send a transaction, alter random words, choose wheel positions, or affect any payout.
- Four labeled wheel segments: `No Reward`, `10 PIGGY`, `20 PIGGY`, and `50 PIGGY`.
- The final revealed segment strictly maps to the confirmed on-chain reward read from `slotRequests(requestId).actualReward`.
- The reward is displayed exactly as `0 PIGGY`, `10 PIGGY`, `20 PIGGY`, or `50 PIGGY`.
- If the reward is greater than zero, a `Claim PIGGY reward` button is displayed using the existing pull-payment claim flow.
- Support `prefers-reduced-motion`: no continuous spinning; clear textual transaction and result states are displayed instead.
- For expired, failed, rejected, unknown, duplicate, or late VRF states, accurate recovery/error messaging is shown without inventing a reward.

Use high-contrast typography, spacious cards, a mobile-first layout, visible keyboard focus (`:focus-visible`), and controls at least 44 × 44 CSS pixels. Prevent horizontal overflow at 360 px.

## Environment-only contract configuration

Read addresses and network RPC configuration only from these public environment variables:

```text
NEXT_PUBLIC_PIGGY_TOKEN_ADDRESS
NEXT_PUBLIC_SQUIDPOT_ADDRESS
NEXT_PUBLIC_CHAIN_ID
NEXT_PUBLIC_RPC_URL
```

Commit only empty placeholders in `.env.example`; never create a populated `.env` or hardcode deployment addresses. Without a complete valid configuration, render a non-functional state with exactly this guidance and no gameplay values:

```text
Contract addresses are not configured. Connect local Anvil or BNB Testnet deployment to use SquidPot.
```

Local Anvil and BNB Smart Chain Testnet are the only supported frontend network contexts in this phase. The environment-selected chain must match the connected wallet chain.

## Routes

Implement `/`, `/wallet`, and `/how-it-works`.

The main route shows the SquidPot name, visible `Testnet Academic Prototype — Tokens Have No Real-World Value` notice, wallet connect/address/network state, wrong-network guidance, current round and derived Waiting/Open/Expired status, a countdown based on the confirmed on-chain deadline, prize pool, available slot reserve, active requests as `x / 10`, pause state, user PIGGY balance/allowance, exact 10 PIGGY approval/play actions, transaction state, piggy bank feedback, all three pending reward balances with pull-claim actions, and permissionless settlement enabled only for an on-chain expired round.

`/wallet` shows connected address, network/chain ID, token balance/allowance, all pending balances, claims, and a `Session activity` list explicitly limited to transactions/request IDs observed in the current browser session. Do not imply a complete or permanent transaction history.

`/how-it-works` explains the Testnet-only academic purpose/no-real-value disclosure, 10 PIGGY entry allocation (4 / 3 / 1.5 / 1 / 0.5), reward tiers and probabilities, pull claims, last-player settlement, permissionless settlement versus the recorded winner, and MEV/Sybil/VRF-timeout limitations. Do not use investment, profit guarantee, or ROI marketing language.

## Contract data and transaction state

Use direct contract RPC reads for current round ID/status/timers, current prize pool, available slot reserve, active pending requests, pause status, user PIGGY balance/allowance, per-user pending claims, and tracked slot request details. No critical live value may come from a mock, browser constant, database, or optimistic estimate. The countdown is derived from the on-chain `deadline` and a recent chain block timestamp; `WAITING` has no countdown. `roundStatus()` is authoritative for Waiting/Open/Expired.

After a Play receipt confirms, parse the actual `SlotRequestCreated` event for its request ID, show it, and read its `getSlotRequest()` state. Recover observed request IDs after refresh from session-scoped activity storage and re-read every request from the contract; the stored ID is only a lookup key, never a source of reward or status. Explain that request discovery is limited to the current browser session without an indexer. Display reward/tier only when contract request status is `FULFILLED`; display expiration only from contract status `EXPIRED`. A zero actual reward is a fulfilled request, not a failure.

Implement and message every explicit UI state:

```text
DISCONNECTED
WRONG_NETWORK
CONTRACT_NOT_CONFIGURED
READY_TO_APPROVE
APPROVAL_PENDING
READY_TO_PLAY
PLAY_WALLET_CONFIRMATION
PLAY_TRANSACTION_PENDING
VRF_WAITING
VRF_FULFILLED
VRF_EXPIRED
ROUND_EXPIRED
SETTLEMENT_PENDING
CLAIM_PENDING
TRANSACTION_REJECTED
TRANSACTION_FAILED
PAUSED
INSUFFICIENT_SLOT_CAPACITY
```

Approval is exactly the entry amount and is not a play. A wallet prompt is not a confirmed transaction. Show play/settlement/claim success only after receipt confirmation. A claim is complete only after confirmed receipt. The coin animation is triggered only by a confirmed Play receipt and never by wallet submission, rejection, failure, VRF status, or a claim.

Add tests for configuration-missing, disconnected/wrong network, approval, play prompt/pending, VRF waiting/fulfilled/expired, round expiry/settlement, all claim transaction states, receipt-gated coin animation, rejection/failure non-animation, reduced motion, refresh request recovery, 360 px layout, keyboard navigation, focus visibility, and no optimistic critical-value changes. Run lint, typecheck, tests, production build, and browser verification if available; report exact command results. Keep contract source/economics/security behavior unchanged.

# 16. Smart-contract acceptance suite

Implement and run tests for:

- Initialization cannot run twice.
- Play cannot run before initialization.
- Incomplete initialization funding reverts.
- Solvency invariant survives randomized transaction sequences.
- Liability values are not double-counted.
- Direct token donations increase Accounting Surplus only.
- Insufficient capacity reverts before collecting tokens.
- Fee-on-transfer mock token is rejected.
- Direct self-play sends 1.50 PIGGY to rollover.
- Two-wallet Sybil behavior is documented as a limitation.
- WAITING has no countdown.
- WAITING cannot settle.
- Deadline never exceeds the hard deadline.
- Play at or after the deadline reverts.
- The same round cannot settle twice.
- Rollover moves exactly once.
- Round ID increments correctly.
- Zero reward ends in FULFILLED.
- Probability boundaries are correct at 0, 7999, 8000, 9499, 9500, 9949, 9950, and 9999.
- Expired requests ignore late callbacks.
- Duplicate callbacks do not alter accounting.
- Unknown callbacks do not alter accounting.
- Duplicate request IDs cannot overwrite existing requests.
- `activePendingRequests` remains consistent.
- Claims clear balances before transfer.
- Double claims revert.
- Pause does not block claims, settlement, expiration, or callbacks.
- Failed burn transfer rolls back all state.
- Failed VRF request rolls back token collection, burn, and accounting.

Run:

```powershell
forge fmt --check
forge build
forge test -vvv
forge test --match-contract SquidPotInvariantTest -vvv
```

Also run the frontend’s actual lint, type-check, test, build, and browser-verification commands.

Do not report tests as passing unless the commands were actually executed.

# 17. Development order

Follow this order:

1. Inspect `D:\Squidpot`.
2. Preserve existing work.
3. Create the v3.2 specification.
4. Record assumptions and unresolved decisions.
5. Implement PIGGY.
6. Implement SquidPot.
7. Implement the VRF Coordinator mock.
8. Write Unit Tests.
9. Write Fuzz Tests.
10. Write Invariant Tests.
11. Run all contract checks.
12. Record the approved frontend scope change and publish the frontend design and contract/UI-state documentation.
13. Implement the Next.js routes, design system, accessible layout, wallet connection, direct contract reads, and receipt-confirmed writes.
14. Implement session-scoped VRF request recovery and the single on-chain PIGGY reward wheel only.
15. Add frontend unit/component and responsive/accessibility checks.
16. Run lint, typecheck, tests, build, and browser verification where available.
17. Search for secrets and private keys; update the README and test documentation.
18. Review the complete Git diff and report repository status.

For this Phase 2 work, do not deploy, commit, or push. These actions require separate explicit approval after review.

# 18. Git and GitHub

Do not use:

```powershell
echo "# Squidpot" >> README.md
```

if a README already exists.

Check repository and remote state first:

```powershell
Set-Location D:\Squidpot
git status
git remote -v
```

If the directory is not already a Git repository:

```powershell
git init
git branch -M main
```

If `origin` does not exist:

```powershell
git remote add origin https://github.com/Thitinan-DevP/Squidpot.git
```

If `origin` exists with an incorrect URL:

```powershell
git remote set-url origin https://github.com/Thitinan-DevP/Squidpot.git
```

Check the remote before pushing:

```powershell
git fetch origin
git log --oneline --decorate --graph --all -20
```

If local and remote histories conflict, stop and report the conflict. Do not use:

```text
--force
reset --hard
```

Before committing:

```powershell
git status
git diff
git diff --check
```

Search the entire tracked project for:

- Private keys
- Mnemonics
- API secrets
- RPC secrets
- Chainlink secrets
- Deployment credentials
- `.env` files containing real values

Do not commit or push during Phase 2. Commit/push procedures above are deferred until the user explicitly approves a later operation.

```powershell
git add README.md docs contracts frontend
git diff --cached
git commit -m "feat: build SquidPot testnet prototype"
git push -u origin main
```

# 19. Final report

Return a factual implementation report containing:

1. Files created and modified
2. Master Specification v3.2 location
3. Contract architecture
4. Accounting transitions
5. Solvency-invariant implementation
6. Round lifecycle
7. VRF lifecycle
8. Frontend architecture
9. Approved clean frontend design implementation and confirmation obsolete theme elements were removed
10. Transaction-state, accessibility, and reduced-motion behavior
11. Commands actually executed and exact lint/typecheck/test/build results
12. Browser-verification results
13. Remaining risks and limitations before Testnet deployment
14. Git status (no commit/push/deploy in Phase 2)

Do not claim that the project is complete if any required test, build, or browser verification failed. Clearly separate completed work, blocked work, and unverified assumptions.
