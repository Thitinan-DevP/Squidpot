# Phase 1 Test Results

Date: 2026-09-29

## Environment

All Foundry commands were run inside WSL Ubuntu from:

```text
/mnt/d/Squidpot/contracts
```

Verified tool versions:

```text
forge Version: 1.8.3
cast Version: 1.8.3
anvil Version: 1.8.3
Commit SHA: cae51ad458f6abb64852b7709eb784352429825d
```

## Final required command sequence

Commands were run in the required order:

```bash
forge fmt --check
forge build
forge test -vvv
forge test --match-contract SquidPotInvariantTest -vvv
```

| Command | Final result |
|---|---|
| `forge fmt --check` | PASS, exit code 0 |
| `forge build` | PASS, exit code 0; compiled 3 files successfully |
| `forge test -vvv` | PASS: 38 Forge test entries passed, 0 failed, 0 skipped |
| `forge test --match-contract SquidPotInvariantTest -vvv` (required run) | PASS: 1 invariant-suite test entry; 3 properties passed, 256 runs, 128,000 calls, 0 reverts, 0 discards |
| `forge test --match-contract SquidPotInvariantTest -vvv` (repeat run) | PASS: 1 invariant-suite test entry; 3 properties passed, 256 runs, 128,000 calls, 0 reverts, 0 discards |

The full suite reported 38 Forge test entries:

- 30 SquidPot unit-test entries passed.
- 4 fuzz tests passed, 256 runs each.
- 3 deployment-network policy tests passed.
- 1 invariant-suite test entry passed.

The invariant suite contains 3 invariant properties (not additional Forge test entries):

- `invariant_balanceAlwaysCoversLiabilities`
- `invariant_activePendingRequestsMatchesRequested`
- `invariant_independentModelMatchesContract`

The standalone invariant command reports one Foundry invariant-suite test entry while reporting all three properties as passed. Both post-fix runs exercised every handler action, including `failedVRFRequest` and normal `play`, with nonzero call counts and zero action reverts/discards. Forge emitted warnings that old cached invariant failure artifacts were ignored because the invariant target contracts and selectors changed; this was cache metadata from the prior target configuration, not a failure in either current run. No cache artifacts were deleted.

## Audit fixes implemented

1. Deployment scripts now fail closed unless `block.chainid == 97`, the approved BNB Smart Chain Testnet. Local tests deploy contracts directly and do not use these live deployment scripts. Tests reject local Anvil (`31337`) and BNB Mainnet (`56`) while accepting BNB Testnet (`97`).
2. Numeric narrowing uses OpenZeppelin `SafeCast` for `R_MAX`, rewards, block numbers, and round IDs. Tests prove values above `uint96` and `uint64` maxima revert.
3. The invariant handler now maintains an independent model for all seven liability variables, pending balances, round state, request state, and active request count. It exercises plays, fulfillment, duplicate/late/unknown callbacks, expiration, settlement, all claims, pause transitions, donations, failed burns, failed VRF requests, and timer changes.
4. Timer tests now cross the 12-hour slow-extension threshold, perform repeated plays through both timer regimes, verify the hard cap, verify exact deadline expiry, and settle exactly at the hard deadline.
5. Exact OpenZeppelin and forge-std revisions are recorded in `contracts/DEPENDENCIES.md`, with source URLs, licenses, vendoring rationale, and refresh instructions.
6. A root `.gitignore` excludes credentials, environment files, Foundry output/cache/broadcast/coverage, frontend artifacts, and OS/editor files while preserving source, tests, documentation, and vendored dependencies.
7. `initializeFunding()` now requires `msg.sender == academicTreasury`. Tests cover unauthorized initialization, exact treasury funding, and one-time initialization.
8. Claim events now name the round field `claimRoundId`. Documentation and tests specify that it is the round active when the claim executes.
9. Terminal `slotRequests` retention is documented as an intentional storage-growth limitation supporting request-ID reuse prevention and late/duplicate callback classification.
10. Request creation marks an in-flight coordinator call. A synchronous callback for an untracked request is explicitly ignored without creating a reward or changing liabilities. A mock and regression test prove the request remains tracked and can later be fulfilled normally.
11. `failedVRFRequest` catches the expected reverted play and explicitly clears `MockVRFCoordinator.failNextRequest` in the handler transaction. The failed `play()` and coordinator state mutation revert atomically, so the mock flag remains armed until this explicit reset. The new direct regression test verifies rollback, verifies the still-armed state, clears it, then proves a subsequent play is requested and fulfilled successfully.

## Root causes and fixes during remediation

1. The first post-remediation full test run failed because Foundry directly fuzzed helper player contracts in addition to the handler. Those helper calls bypassed the reference model. The handler was constrained with `targetContract(address(handler))` and explicit action selectors. The focused invariant suite then passed with the corrected target set.
2. Fixed-string `bytes32` casts were replaced with typed constants. The required numeric casts now use `SafeCast`.
3. A test-only mutability annotation was initially applied to the wrong fuzz function; the compiler caught it immediately. It was corrected before the final sequence.
4. One initial WSL invocation returned `Wsl/Service/E_ACCESSDENIED` before Forge started. The command was rerun through the verified Ubuntu WSL path and completed successfully; no Forge result was attributed to the failed invocation.

## Final build warnings

The Phase 1 build succeeded with non-fatal warnings that were re-evaluated after the Phase 3A integration:

- One `reentrancy-no-eth` warning at the external VRF coordinator request. The contract uses `nonReentrant`, an in-flight request guard, official coordinator authorization, request-ID status checks, and a synchronous-callback regression test.
- Two `reentrancy-events` warnings for events emitted after the coordinator request. These are retained because the returned request ID is needed for the event; callback ordering is tested and cannot create untracked accounting.
- Four `block-timestamp` warnings for the specified Testnet timer and derived lifecycle. Timestamp use is an intentional academic-Testnet design parameter and is bounded by the hard deadline.

No `unsafe-typecast` warnings remain for the numeric `uint96` or `uint64` conversions.

## Remaining limitations

- The implementation remains an academic BNB Smart Chain Testnet-only prototype. No live deployment, real Chainlink subscription, production secret, frontend, commit, or push was performed.
- Local tests use an official-v2.5-ABI-compatible coordinator mock; it is not a live Chainlink coordinator and is rejected by the BNB Testnet deployment policy.
- Honest Sybil, validator/MEV, VRF infrastructure, and 200-block research-timeout limitations remain as documented in the master specification.
- Terminal request records remain stored indefinitely by design, so storage grows over the contract lifetime.
- The WSL non-login shell may require the absolute Forge path unless its PATH is configured separately.

## Phase 2 frontend verification

Date: 2026-09-29

### Frontend toolchain

The frontend uses Next.js 16.3.6, React 19.3.0, Tailwind CSS 4.3.3, Wagmi 3.7.7, Viem 2.56.9, Framer Motion 12.43.0, and Vitest 4.1.11. `frontend/.env.example` contains only empty placeholders. No populated `.env` file or deployment credentials were created.

### Commands and results

Commands ran from `D:\Squidpot\frontend` unless noted:

| Command | Result |
|---|---|
| `npm install` | Initial sandbox attempt failed because a required package was not cached (`ENOTCACHED`). Retried with approved package-registry access: PASS, dependencies installed. The initial audit reported two moderate findings in the Vitest development dependency tree. |
| `npm install --save-dev vitest@^4.1.11` | PASS; upgraded Vitest and refreshed the lockfile. Subsequent `npm audit --json` reported 0 vulnerabilities (exit 0). |
| `npm run lint` | PASS, exit 0 (`eslint app components lib tests`, 0 errors, 0 warnings). |
| `npm run typecheck` | PASS, exit 0 (`tsc --noEmit`). |
| `npm test` | PASS: 4 test files, 21 tests passed, 0 failed (`tests/wheel.test.tsx`, `tests/claims-accessibility.test.tsx`, `tests/ui-state.test.tsx`, `tests/configuration.test.tsx`). |
| `npm run build` | PASS, exit 0; Next.js 16 production build generated `/`, `/wallet`, and `/how-it-works` routes (plus Next.js `/_not-found`). |

The frontend tests cover the single on-chain PIGGY reward wheel, missing configuration, disconnected/wrong-network states, approval/play/VRF/settlement/claim state rendering, receipt-gated wheel spin, presentation-only `Stop & Reveal` safety proof, reduced-motion behavior, and accessibility checks. They are component/state tests; they do not constitute a live-chain or deployed-contract integration test.

### Local route and browser checks

- With the local production server running, `curl.exe` returned HTTP 200 for each of `GET /`, `GET /wallet`, and `GET /how-it-works`. HTML response confirmed server-side rendering of the `RewardWheel`, segment definitions, and notice banners.
- Browser subagent automation attempted to run `open_browser_url` for live visual capture. The tool failed to initialize because the underlying Playwright driver download failed (`404 Not Found` for `playwright-1.57.0-win32_x64.zip` from azureedge CDN). Per system instructions, this tool failure is reported to the user.

### Reward Wheel notes and remaining limitations

- Contract reads and writes are wired to the ABI and addresses supplied via environment configuration; no unauthorized deployment or live mainnet transaction was performed.
- The reward wheel is the sole game interaction on the play route.
- The wheel spin starts only after the `play()` transaction receipt is confirmed on-chain.
- While the VRF request is `REQUESTED`, the wheel continuously spins and displays `Waiting for verified on-chain result`.
- `Stop & Reveal` is enabled only when the contract request status is `FULFILLED`. It is verified by unit test to be strictly presentation-only (invokes zero transactions/contract calls and cannot alter on-chain results).
- The revealed segment strictly reflects `slotRequests(requestId).actualReward` (`0 PIGGY`, `10 PIGGY`, `20 PIGGY`, or `50 PIGGY`).
- `Claim PIGGY reward` is displayed only for rewards greater than zero, executing the existing pull-payment claim flow.
- All piggy-bank and coin animations, components, and tests have been completely removed.
- Session activity is limited to transactions and request IDs observed in the current browser session; it is not a permanent indexed history.

## Phase 3A direct Chainlink VRF v2.5 remediation

Date: 2026-09-29

### Architecture and dependency verification

- Removed the custom production VRF adapter interface from `SquidPot` and the deployment script.
- Added direct inheritance from the official pinned `VRFConsumerBaseV2Plus` and official `VRFV2PlusClient.RandomWordsRequest` subscription flow.
- Vendored `smartcontractkit/chainlink-evm` tag `contracts-v1.5.0` at exact commit `86aa5a1d34b20eda8d18fe6eb0e4882948e545ba`.
- Added the remapping `@chainlink/contracts/=lib/chainlink-evm/contracts/`.
- Confirmed the local mock receives the configured key hash, subscription ID, confirmations, callback gas, word count, and encoded native-payment choice through the official request selector.
- Confirmed unauthorized direct fulfillment reverts through `OnlyCoordinatorCanFulfill` and authorized mock fulfillment preserves the existing accounting transitions.
- Deployment-policy tests require chain ID 97, the official BNB Testnet coordinator and key hash, a nonzero subscription ID, callback gas from 1 through 2,500,000, and confirmations from 3 through 200. A former adapter address is explicitly rejected.

### Required final command sequence

All commands ran through WSL Ubuntu from `/mnt/d/Squidpot/contracts` using Foundry 1.8.3:

| Command | Exact final result |
|---|---|
| `forge fmt --check` | PASS, exit code 0, no output |
| `forge build` | PASS, exit code 0; no files changed so compilation was skipped; seven lint warnings were reported |
| `forge test -vvv` | PASS, exit code 0; 46 test entries passed, 0 failed, 0 skipped across 4 suites |
| `forge test --match-contract SquidPotInvariantTest -vvv` | PASS, exit code 0; 1 invariant-suite entry passed, 0 failed, 0 skipped; 3 invariant properties passed; 256 runs, 128,000 calls, 0 reverts, 0 discards |

The 46 full-suite Forge entries are:

- 32 unit-test entries.
- 4 fuzz-test entries, each with 256 runs.
- 9 deployment-policy test entries.
- 1 invariant-suite test entry containing 3 invariant properties.

The three invariant properties remain:

- `invariant_activePendingRequestsMatchesRequested`
- `invariant_balanceAlwaysCoversLiabilities`
- `invariant_independentModelMatchesContract`

The focused invariant run called every targeted handler selector with zero reverts and zero discards. Notable call counts were: `play` 9,272; `fulfillFirstPending` 9,107; `expireFirstPending` 9,036; `settleRound` 9,018; `failedVRFRequest` 9,242; `failedBurn` 9,043; `duplicateCallback` 8,978; `unknownCallback` 9,210; `pauseOrUnpause` 9,179; `donate` 9,262; and `advanceTime` 9,299. All three claim actions were also nonzero (`claimSlot` 9,082; `claimPrevious` 9,189; `claimPrize` 9,083).

Foundry printed stale invariant failure-cache warnings stating that old artifacts were ignored because target contracts/selectors had changed. Those warnings were cache metadata only; both the invariant run inside the full suite and the separately focused invariant run passed with 128,000 calls, zero reverts, and zero discards.

### Final lint warnings

The seven non-fatal warnings are intentional and covered:

- One `reentrancy-no-eth` warning at the external official coordinator request. `play()` is `nonReentrant`; only the official-base-authorized coordinator can enter the callback; callbacks made before a request is tracked are ignored; failed requests revert atomically; and synchronous callback ordering has a regression test.
- Two `reentrancy-events` warnings because request events must include the coordinator-returned request ID. Request state is recorded and the ID is checked for overwrite before either event is emitted.
- Four `block-timestamp` warnings implement the approved derived round deadline and hard-cap behavior. The exact-deadline, 12-hour branch, repeated-extension, and hard-cap tests pass.

No unsafe narrowing warning is present. Production and deployment narrowing uses OpenZeppelin `SafeCast`.

### Remaining pre-deployment limitations

- No contract was deployed, no transaction was broadcast, no subscription was created, and no populated environment file was read or created.
- The supplied PIGGY deployment is verified only for code, metadata, decimals, current supply, `balanceOf`, and `allowance`. Its runtime differs from the local artifact, so source equivalence, fixed-supply permanence, and non-fee-on-transfer behavior still require source verification or a controlled Testnet transaction.
- The user must manually create and fund the VRF v2.5 subscription, choose native tBNB or testnet LINK billing, add the deployed SquidPot contract as consumer, and authorize any Phase 3B broadcast separately.
