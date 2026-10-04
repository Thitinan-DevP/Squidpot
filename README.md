# SquidPot — Academic Testnet Prototype

> Testnet Academic Prototype — Tokens Have No Real-World Value

SquidPot is an academic prototype scoped to BNB Smart Chain Testnet. Phase 1 established the fixed-supply PIGGY token, SquidPot accounting and lifecycle contract, deployment scripts, and Foundry unit/fuzz/invariant tests. Phase 2 provides the approved frontend. Phase 3 directly integrates Chainlink VRF v2.5. PIGGY and SquidPot are deployed on BNB Testnet; the VRF request, fulfillment, and reward claim flow has completed its first live smoke test. No production credential is included.

## Repository layout

- `docs/MASTER_PROJECT_SPECIFICATION_v3.2.md` — authoritative Phase 1 engineering specification.
- `contracts/src/PiggyToken.sol` — 100,000,000 PIGGY fixed supply, 18 decimals.
- `contracts/src/SquidPot.sol` — initialization, entry allocation, rounds, liabilities, claims, pause, and direct Chainlink VRF v2.5 lifecycle.
- `contracts/test/mocks/` — official-ABI-compatible deterministic VRF, fee-on-transfer, and failed-burn mocks.
- `contracts/test/` — unit, fuzz, and invariant coverage.
- `contracts/script/` — BNB Smart Chain Testnet deployment and controlled smoke-test scripts. `PiggyToken` is deployed at `0x4c8d2990Ce2C99E3C5F4B765D0359FcAd210b84b`; SquidPot is deployed at `0x5F5db49C917257BD6bb21761EeEB97beF00A94c4`.
- `contracts/DEPENDENCIES.md` — exact vendored OpenZeppelin, forge-std, and Chainlink revisions and refresh instructions.
- `frontend/` — responsive Next.js interface, single on-chain PIGGY reward wheel, direct Wagmi/Viem contract access, transaction states, and frontend tests.
- `docs/FRONTEND_SCOPE_CHANGE.md` — approved replacement of the earlier frontend directions with the Single On-Chain PIGGY Reward Wheel.
- `docs/FRONTEND_DESIGN_SYSTEM.md` and `docs/CONTRACT_EVENTS_AND_UI_STATES.md` — frontend styling, accessible SVG wheel, and contract-to-UI integration behavior.

## Local setup

Install Foundry, then from `contracts` use the vendored dependencies recorded in `DEPENDENCIES.md`:

```powershell
forge fmt --check
forge build
forge test -vvv
forge test --match-contract SquidPotInvariantTest -vvv
```

The deployment scripts fail closed unless `block.chainid` is BNB Smart Chain Testnet (`97`). SquidPot directly inherits Chainlink's official `VRFConsumerBaseV2Plus` and sends the official v2.5 subscription request structure; there is no production adapter. The deployment policy additionally requires the official BNB Testnet coordinator/key hash, a nonzero subscription, bounded callback gas and confirmations, and an explicit native-versus-LINK payment choice. Local tests use an official-ABI-compatible coordinator mock and do not use live deployment scripts. Exact results are recorded in `docs/TEST_RESULTS.md`; no test result is represented as passing unless the command was actually executed.

## Accounting notes

The contract explicitly tracks seven liabilities and exposes `totalLiabilities()`, `contractBalance()`, and `accountingSurplus()`. Direct donations increase surplus only. Slot requests reserve the conservative maximum of 50 PIGGY, with no more than ten pending requests. All claims are pull payments and the owner has no withdrawal path for user liabilities or protocol bankroll. Claim events use `claimRoundId`, meaning the round active when the claim transaction executes.

Terminal `slotRequests` records are intentionally retained to prevent request-ID reuse and to classify late or duplicate callbacks. This is a known storage-growth limitation over the contract lifetime.

## Frontend development

Use Node.js 20.9 or newer. From `frontend`, install dependencies and run the checks:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

`frontend/.env.example` contains empty placeholders for the public PIGGY address, SquidPot address, chain ID, and RPC URL. Local development uses an ignored `frontend/.env.local`; configure the same four public values in Vercel for Production and Preview deployments. These `NEXT_PUBLIC_*` values are bundled into the browser and must never contain secrets. Never commit populated environment files, private keys, or production credentials.

## Deferred scope

SquidPot and PIGGY are deployed on BNB Testnet, the funded VRF subscription authorizes SquidPot as a consumer, and the contract is initialized with 100,500 PIGGY. A live Play/VRF/claim smoke test succeeded. The frontend reads public round state without requiring a connected wallet and is deployed from `main` to Vercel. Configure the four public `NEXT_PUBLIC_*` values in Vercel for both Production and Preview before sharing the live app. The Thai interface, lint, typecheck, and production build are ready; interactive wallet review remains. PIGGY's low-value Testnet `transfer`/`approve`/`transferFrom` flow was verified; no real-value assets or production credentials are used. See `docs/PHASE_3_TESTNET_PREFLIGHT.md` for the deployment record.
