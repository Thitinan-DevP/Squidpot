# SquidPot Frontend Design System

## Design intent

Use a clean, calm, functional Web3 interface. Information hierarchy and transaction clarity take priority over decoration. The PIGGY coin-to-bank interaction is the sole animation and is strictly gated by a confirmed Play receipt.

## Visual tokens

- Page background: soft neutral `#F6F7F8`.
- Surfaces: white `#FFFFFF`, subtle border `#D9DEE5`, restrained shadow.
- Primary accent: deep teal `#0F766E`; hover/pressed `#115E59`.
- Primary text: charcoal `#17212B`; secondary text `#52606D`.
- Success: dark green `#166534`; warning: dark amber `#92400E`; error: dark red `#B42318`.
- Use color plus labels/icons; never convey transaction state by color alone.
- Body text should meet WCAG AA contrast. Avoid tiny muted labels for essential state.

## Layout and responsive behavior

- Mobile-first single-column page with readable card groups; progressively use two-column layouts at larger widths.
- Main content max width approximately 72rem; consistent horizontal gutters; no horizontal scrolling at 360 CSS px.
- Use a spacing scale based on 4 px (4, 8, 12, 16, 24, 32, 48).
- Interactive targets are at least 44 × 44 CSS px, with visible hover, pressed, disabled, and focus-visible states.
- Use semantic landmarks, one page-level heading, associated form labels, descriptive buttons, status regions, and logical keyboard order.

## Components

- `AppShell`: brand, route navigation, testnet academic notice, page content.
- `WalletStatus`: connect/disconnect affordance, shortened address plus accessible full address, configured/connected chain status, wrong-chain instructions.
- `RoundSummary`: confirmed round ID, derived round phase, chain-derived countdown, prize pool, available slot reserve, request capacity, pause state.
- `TokenPanel`: live PIGGY balance/allowance and exact 10 PIGGY approval action.
- `ClaimsPanel`: separate pending slot reward, previous-player reward, and prize values/actions.
- `TransactionStatus`: explicit state label, explanatory copy, hash/request links, pending/confirmed/failed distinction.
- `PiggyBankTransactionFeedback`: static bank until a Play receipt is confirmed, then one small rail/coin/bank sequence; static badge when reduced motion is requested.

## Motion and animation

No ambient or decorative movement. The coin animation uses transforms/opacity only and never controls or implies financial state. It begins only when the Play receipt is confirmed, not when a wallet prompt opens or a transaction is broadcast. The app must continue to communicate the same state with motion disabled. Observe `prefers-reduced-motion` and do not create an in-app override that defeats the OS setting.

## Content

Keep the notice `Testnet Academic Prototype — Tokens Have No Real-World Value` visible on all routes. Use direct, neutral language. Do not promise outcomes or use investment, ROI, or profit-guarantee language. Pending VRF randomness is not described as a reward until the contract request is `FULFILLED`.
