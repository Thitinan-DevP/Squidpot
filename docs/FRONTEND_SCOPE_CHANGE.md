# Phase 2 Frontend Scope Change — Single On-Chain PIGGY Reward Wheel

Approved scope update for SquidPot. This document supersedes earlier frontend directions (Carnival Temple Fair and Coin-to-Piggy-Bank). It does not amend the token economics, Solidity contract lifecycle, Chainlink VRF v2.5 integration, solvency invariants, or security controls.

## Removed directions

1. The Carnival Temple Fair theme is removed in full.
2. The coin-to-piggy-bank interaction is completely removed from the frontend:
   - All coin drop animations, coin rails, piggy-bank SVGs, visuals, copy, component code (`PiggyBankTransactionFeedback.tsx`), styles, and tests are removed.
   - No gambling, investment, ROI, jackpot, dividend, or profit language is used anywhere in the application.

## Approved interface: Single On-Chain PIGGY Reward Wheel

Build a clean, calm, mobile-first Web3 interface using Next.js, TypeScript, Tailwind CSS, Wagmi, Viem, and accessible semantic SVG for the single on-chain reward wheel. Routes are `/`, `/wallet`, and `/how-it-works`.

### Wheel Mechanics and Gating
- Prominent `Spin for 10 PIGGY` button.
- Preserves all pre-flight verification: wallet connection, BNB Smart Chain Testnet check, environment configuration, token balance >= 10 PIGGY, allowance verification (auto-prompts approval then play), pause status, and slot capacity.
- The wheel begins spinning ONLY after the `play()` transaction receipt is confirmed on-chain.
- While the VRF request is `REQUESTED`, the wheel rotates continuously with the clear status `Waiting for verified on-chain result`.
- When the request is `FULFILLED`, the `Stop & Reveal` button becomes enabled.
- `Stop & Reveal` is strictly presentation-only: it stops the rotation animation and reveals the already-recorded on-chain reward. It CANNOT send a transaction, change the random result, choose a wheel position, or affect any payout.
- Four labeled wheel segments: `No Reward`, `10 PIGGY`, `20 PIGGY`, and `50 PIGGY`.
- The final revealed segment strictly maps to the confirmed on-chain result read from `slotRequests(requestId).actualReward`.
- Resulting reward text is shown exactly as `0 PIGGY`, `10 PIGGY`, `20 PIGGY`, or `50 PIGGY`.
- If reward is greater than zero, a `Claim PIGGY reward` button is displayed using the existing pull-payment claim flow.
- Respect `prefers-reduced-motion`: no continuous spinning; clear textual transaction and result states are displayed instead.
- For expired, failed, rejected, unknown, duplicate, or late VRF states, accurate recovery/error messaging is shown without inventing any reward.

## Integrity and safety constraints

- Contract economics remain untouched: `play()` costs exactly 10 PIGGY. Allocation, VRF v2.5 callback, solvency invariant, liabilities, timeout logic, pull-payment claims, and pause semantics are unchanged.
- Rewards remain PIGGY only. No Bitcoin branding, external cryptocurrency assets, or live mainnet credentials.
- No live deployment, transaction broadcasting, VRF subscription funding, commit, or push.
