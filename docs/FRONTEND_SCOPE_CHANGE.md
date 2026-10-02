# Phase 2 Frontend Scope Change

Approved scope update for SquidPot Phase 2. This document supersedes the earlier Carnival Temple Fair frontend direction in the Phase 1 project scope. It does not amend the Phase 1 token economics, contract lifecycle, solvency rules, or security controls.

## Removed direction

The Carnival Temple Fair theme is removed in full. No Ferris wheel, carnival/temple-fair imagery, neon carnival backgrounds, flags, fireworks, roller-coaster silhouettes, audio, gondolas, counter-rotation, casino-like spectacle, or booth styling is in scope. No decorative motion other than the single transaction-confirmed coin interaction below is permitted.

## Approved interface

Build a clean, calm, mobile-first Web3 interface using Next.js, TypeScript, Tailwind CSS, Wagmi, Viem, accessible semantic HTML, and Framer Motion only for the small coin-to-piggy animation. Routes are `/`, `/wallet`, and `/how-it-works`.

The only visual interaction is a PIGGY coin moving along a short rail into a piggy bank after the Play transaction receipt is confirmed on-chain, followed by a subtle squash-and-stretch. Respect `prefers-reduced-motion`; replace movement with a static success badge. No pending, rejected, failed, expired, VRF-only, or claim action may trigger this animation. No UI may represent a play, random result, prize, or claim as successful before its authoritative confirmed chain state exists.

The UI must show `Testnet Academic Prototype — Tokens Have No Real-World Value`. If contract configuration is incomplete, it must show only the documented non-functional configuration state; it must not fill the page with sample balances, sample rewards, or pretend gameplay.

## Integrity and safety constraints

- Contract addresses and network/RPC configuration are read only from the four `NEXT_PUBLIC_*` variables documented in the scope and `.env.example` contains empty placeholders only.
- Critical values are read directly from the deployed contract. No The Graph, Supabase, backend database, hardcoded financial value, fake countdown, or production mock is introduced.
- Session activity is explicitly temporary and limited to transactions/request IDs observed in this browser session. Refresh recovery re-reads request state from the contract; session storage is only a request-ID index, never a financial-state store.
- No contract source, contract economics, security controls, deployment scripts, or Solidity behavior are changed in Phase 2.
- No live deployment, commit, push, or use of real secrets is authorized by this scope update.

## Acceptance focus

Responsive routes, wallet/network/config states, direct RPC reads, receipt-confirmed approve/play/settle/claim flows, VRF request recovery, all specified UI states, keyboard and reduced-motion accessibility, and the receipt-gated coin animation. Verify at 360 px and desktop when browser tooling is available. Report commands and results exactly; do not characterize unrun checks as passing.
