# SquidPot Frontend Design System

## Design intent

Use a clean, calm, functional Web3 interface. Information hierarchy and transaction clarity take priority over decoration. The single on-chain PIGGY reward wheel is the sole game interaction. The wheel animation begins only after the Play transaction receipt is confirmed on-chain, and `Stop & Reveal` is strictly presentation-only.

## Visual tokens

- Page background: light warm champagne ivory `#FAF6EB` layered with `Slot Machine Game.svg` and luminous gradient overlay `linear-gradient(180deg, rgba(254, 250, 240, 0.88), rgba(250, 239, 214, 0.92))`.
- Typography: Google Mitr font (`font-family: var(--font-mitr), "Mitr", ...`) across the entire system.
- Surfaces: frosted glass / ivory-gold surface cards `rgba(255, 255, 255, 0.92)` to `rgba(254, 250, 240, 0.84)`, subtle spun gold border `rgba(224, 198, 142, 0.50)`, warm gold shadow `rgba(160, 120, 40, 0.12)`.
- Primary accent: rich royal gold `#B48316` / `#D4AF37`; hover/pressed `#94690D`.
- Primary text: rich bronze charcoal `#2A2012`; secondary text `#6E5D47`.
- Success: dark green `#15803D`; warning: warm amber `#B45309`; error: dark crimson `#B91C1C`.
- Wheel palette:
  - Segment 0 (`No Reward`): Deep espresso bronze `#2E1E0A`, text `#D6C3AD`.
  - Segment 1 (`10 PIGGY`): Warm bronze gold `#854D0E`, text `#FEF3C7`.
  - Segment 2 (`20 PIGGY`): Amber gold `#B45309`, text `#FFFBEB`.
  - Segment 3 (`50 PIGGY`): Radiant honey gold `#D97706`, text `#FEF9C3`.
- Use color plus labels/icons; never convey transaction state by color alone.
- Body text meets WCAG AA contrast against light surfaces. Avoid tiny muted labels for essential state.

## Layout and responsive behavior

- Mobile-first single-column page with readable card groups; progressively uses multi-column layouts at larger viewports.
- Main content max width approximately 74rem (1184px); consistent horizontal gutters; no horizontal scrolling at 360 CSS px.
- Spacing scale based on 4 px (4, 8, 12, 16, 24, 32, 48).
- Interactive targets are at least 44 × 44 CSS px, with visible hover, pressed, disabled, and focus-visible states (`outline: 3px solid #087f8c; outline-offset: 3px`).
- Semantic landmarks, single page-level heading hierarchy, associated form labels, descriptive buttons, live status regions (`aria-live="polite"`), and logical keyboard tab order.

## Components

- `AppShell`: brand, route navigation, testnet academic notice, page content.
- `WalletConnection`: connect/disconnect affordance, shortened address plus accessible full address, configured/connected chain status, wrong-chain instructions.
- `RewardWheel`: the sole on-chain game interaction:
  - Accessible SVG wheel with 4 labeled segments: `No Reward`, `10 PIGGY`, `20 PIGGY`, `50 PIGGY`.
  - Prominent `Spin for 10 PIGGY` button (approves PIGGY if necessary, then calls `play()`).
  - Gated motion: begins continuous spinning only after confirmed `play()` receipt; displays `Waiting for verified on-chain result`.
  - Presentation-only `Stop & Reveal` button: enabled upon VRF fulfillment; stops animation and reveals exact confirmed on-chain reward without invoking any contract writes or transactions.
  - Pull-payment `Claim PIGGY reward` button: displayed when revealed reward > 0.
- `RoundSummary`: confirmed round ID, derived round phase, chain-derived countdown, prize pool, available slot reserve, request capacity, pause state, permissionless `settleRound` button on round expiration.
- `ClaimsPanel`: separate pending slot reward, previous-player reward, and prize values/actions.
- `TransactionStatus`: explicit state label, explanatory copy, hash/request links, pending/confirmed/failed distinction.
- `SessionActivityList`: session-scoped index of observed transaction hashes and VRF request IDs.

## Motion and animation

- The wheel spins continuously only while the VRF request status is `REQUESTED`.
- `Stop & Reveal` brings the wheel to rest at the segment corresponding strictly to the confirmed `slotRequests(requestId).actualReward`.
- Respect `prefers-reduced-motion`: continuous animation is disabled; the wheel remains static while clear textual status states communicate transaction and random result progress.
- No in-app toggle defeats the OS motion preference.

## Content and safety rules

- Keep the notice `Testnet Academic Prototype — Tokens Have No Real-World Value` visible on all routes.
- Strictly neutral academic tone: no gambling, investment, ROI, jackpot, dividend, or profit-guarantee language.
- Pending VRF randomness is never represented as a reward until confirmed `FULFILLED` on-chain.
- For expired, failed, rejected, unknown, duplicate, or late VRF states, show accurate recovery/error messaging without inventing a reward.
