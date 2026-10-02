# Phase 3A — BNB Smart Chain Testnet Preflight

Date: 2026-09-29

This was a read-only preflight. No contract was deployed, no transaction was broadcast, no Chainlink subscription was created, and no private credential was requested or inspected.

## 1. BNB Smart Chain Testnet connectivity

The following official public endpoint was tested through WSL Ubuntu with Foundry Cast 1.8.3:

```text
https://data-seed-prebsc-1-s1.bnbchain.org:8545
```

Observed results:

| Check | Result |
|---|---|
| RPC connection | Succeeded for the required preflight reads |
| `cast chain-id` | `97` |
| `cast block-number` | `133722704` at the time of the check |
| Expected network | BNB Smart Chain Testnet only |
| Explorer | `https://testnet.bscscan.com/` |

The RPC later returned JSON-RPC error `-32005: limit exceeded` during an additional, non-required code-hash query. The required chain, block, bytecode, and ERC-20 reads had already succeeded. This endpoint is functional but can rate-limit bursts. Official alternatives include `https://data-seed-prebsc-2-s1.bnbchain.org:8545` and the other BSC Testnet endpoints listed in the [BNB Chain RPC documentation](https://docs.bnbchain.org/bnb-greenfield/for-developers/network-endpoint/endpoints/). BNB Chain's [wallet configuration documentation](https://docs.bnbchain.org/bnb-smart-chain/developers/wallet-configuration/) confirms chain ID 97 and the Testnet BscScan explorer. Mainnet chain ID 56 was not used.

## 2. Supplied PIGGY token verification

Address checked on chain 97:

```text
0x0FC63A37D084eB400dEDE8aCE752f4106e4f62A6
```

### Verified on-chain facts

| Read-only check | Observed result |
|---|---|
| Deployed bytecode | Present; `cast codesize` returned `4350` bytes |
| `name()` | `PiggyToken` |
| `symbol()` | `PIGGY` |
| `decimals()` | `18` |
| `totalSupply()` | `100000000000000000000000000` base units = `100,000,000 PIGGY` |
| `balanceOf(0x0000000000000000000000000000000000000000)` | Responded successfully with `0` |
| `allowance(0x0000000000000000000000000000000000000000, 0x0000000000000000000000000000000000000000)` | Responded successfully with `0` |
| Standard write selectors | Deployed bytecode exposes `approve`, `transfer`, and `transferFrom` selectors |

The observable decimals and current total supply exactly match the approved specification.

### Verified versus unverified

Verified: the contract exists on chain 97, exposes the standard ERC-20 read surface needed by SquidPot, reports 18 decimals, and currently reports exactly 100 million PIGGY.

Not verified: no transaction was permitted in this preflight, so successful `approve`, `transfer`, and `transferFrom` execution, exact recipient balance deltas, allowance consumption, return-value behavior, and fee-on-transfer behavior were not tested. Read calls and the presence of selectors do not prove non-fee-on-transfer behavior.

Source/fixed-supply limitation: this preflight could not retrieve verified source from Testnet BscScan. The deployed runtime is 4,350 bytes, while the approved local `PiggyToken.sol` build artifact is 1,815 runtime bytes, so the supplied deployment is not byte-for-byte the approved local artifact. That does not by itself prove incompatibility, but it means the local source cannot be used as evidence for the deployed token's transfer or mint/burn behavior. The current supply is verified; permanent supply immutability is not proven without verified deployed source or a fuller controlled test.

Before SquidPot receives its 100,500 PIGGY initialization funding, run a controlled Testnet transfer/approval/`transferFrom` compatibility test and compare sender, recipient, and allowance deltas exactly. SquidPot itself also enforces exact receipt during initialization and play, but discovering incompatibility only after deployment would waste Testnet deployment effort.

## 3. Chainlink VRF v2.5 on BNB Chain Testnet

Current official Chainlink documentation confirms VRF v2.5 support for BNB Chain Testnet using both subscription and direct-funding modes. The authoritative network values from Chainlink's [VRF v2.5 supported-networks page](https://docs.chain.link/vrf/v2-5/supported-networks) are:

| Parameter | Official BNB Chain Testnet value |
|---|---|
| VRF coordinator | `0xDA3b641D438362C440Ac5458c57e00a712b66700` |
| 50 gwei key hash | `0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26` |
| LINK token | `0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06` |
| Direct-funding wrapper | `0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94` |
| Minimum confirmations | `3` |
| Coordinator maximum callback gas | `2,500,000` |
| Maximum random words, subscription | `500` |
| Maximum random words, direct funding | `10` |
| Subscription premium, native tBNB | `60%` |
| Subscription premium, testnet LINK | `50%` |

The coordinator address also has deployed code on chain 97 (`24,094` bytes observed).

### Funding model recommendation

Use a VRF v2.5 subscription for SquidPot. Each successful play creates a request, so a reusable subscription is a cleaner operational fit than pre-funding a wrapper consumer for every request. Chainlink supports funding a v2.5 subscription with either native testnet BNB or testnet LINK; neither asset is exclusively required. Native payment is simpler if the operator already maintains tBNB, while LINK has the lower documented percentage premium. The deployment configuration requires an explicit `VRF_PAY_IN_NATIVE` value, which SquidPot encodes in `VRFV2PlusClient.ExtraArgsV1`.

Official setup references:

- [Create and manage VRF v2.5 subscriptions](https://docs.chain.link/vrf/v2-5/subscription/create-manage)
- [Subscription consumer and request flow](https://docs.chain.link/vrf/v2-5/subscription/get-a-random-number)
- [BNB Chain Testnet LINK faucet](https://faucets.chain.link/bnb-chain-testnet)
- [VRF v2.5 billing](https://docs.chain.link/vrf/v2-5/billing)

### Direct VRF v2.5 integration result

The incompatible custom adapter boundary has been removed from the production path. `SquidPot` now directly inherits the pinned official Chainlink `VRFConsumerBaseV2Plus`, sends the official `VRFV2PlusClient.RandomWordsRequest` struct to `s_vrfCoordinator`, and implements the internal `fulfillRandomWords` callback. The official base contract's external `rawFulfillRandomWords` rejects every caller except the currently configured coordinator.

The request includes the configured subscription ID, official key hash, request confirmations, callback gas limit, one random word, and an explicit native/LINK billing choice. The returned request ID is still checked against `SlotStatus.NONE` before it is recorded. Existing timeout, late/duplicate/unknown callback, zero-reward, failed-request rollback, and seven-liability accounting behavior remains covered by local tests.

The local `MockVRFCoordinator` implements the same official v2.5 request selector and invokes the same coordinator-authorized callback entry point. Its deterministic/failure controls exist only for Foundry testing. It is not accepted by the BNB Testnet deployment policy.

## 4. Deployment configuration review

Both deployment scripts fail closed unless `block.chainid == 97`. `DeploySquidPot.s.sol` now reads the template's canonical variable names and validates the VRF configuration before broadcasting. It requires the exact official coordinator and key hash above, a nonzero subscription ID, a callback gas limit from 1 through 2,500,000, request confirmations from 3 through 200, and an explicitly parseable boolean payment mode. Missing or malformed values fail through Foundry's environment parsers or OpenZeppelin checked narrowing; incompatible values fail the deployment policy.

`contracts/.env.example` now records safe placeholders for:

```text
BNB_TESTNET_RPC_URL
PIGGY_TOKEN_ADDRESS
ACADEMIC_TREASURY_ADDRESS
PRIVATE_KEY
VRF_COORDINATOR
VRF_SUBSCRIPTION_ID
VRF_KEY_HASH
VRF_CALLBACK_GAS_LIMIT
VRF_REQUEST_CONFIRMATIONS
VRF_PAY_IN_NATIVE
```

At the time of the original preflight, only public, officially documented chain configuration and the supplied public PIGGY address appeared in the safe template; no local `.env` or secret value had been created. The frontend template remains empty and should receive `NEXT_PUBLIC_SQUIDPOT_ADDRESS` only after deployment.

The root `.gitignore` ignores `.env`, `.env.*`, and therefore the existing `contracts/.env.local`, while explicitly retaining `.env.example` templates. The ignored local environment file was not opened or printed.

## 5. Required next actions

The original preflight recommended these steps before a live SquidPot deployment. Since then, the user authorized Phase 3B preparation and a source-controlled PIGGY deployment has completed; the remaining steps are:

1. ~~Perform a controlled, low-value BNB Testnet PIGGY `approve`/`transfer`/`transferFrom` test.~~ Completed below with exact balance, allowance, and supply assertions.
2. ~~Manually create and fund a VRF v2.5 subscription on chain 97; then provide its public subscription ID.~~ Completed by the user with native tBNB; subscription ID is recorded only in the ignored local environment.
3. ~~Use native tBNB billing and fund the subscription for test requests.~~ Completed; it was funded with `0.05 tBNB`. After one successful request, the coordinator reports `0.0497226816 tBNB` remaining. The configured callback gas limit is 500,000, the value used by the local invariant setup.
4. Keep the Academic Treasury address, confirmation count, billing mode, token, coordinator, key hash, and subscription ID in the ignored local Foundry environment. Keep private-key values out of chat and version control.
5. ~~Deploy SquidPot and add it as the subscription consumer.~~ Completed; on-chain configuration was checked before the consumer authorization transaction.
6. ~~Initialize SquidPot with 100,500 Testnet PIGGY.~~ Completed after user authorization; both approval and initialization transactions succeeded and on-chain accounting surplus is zero.
7. ~~Run a controlled Play/VRF request/fulfillment/claim smoke test.~~ Completed. Frontend Testnet configuration, public contract reads, and the first UI polish pass are implemented; review the preview before any site deployment.

## 6. Deployment safety decision

The original preflight recorded BNB Testnet connectivity, the supplied token metadata/current supply, and official VRF v2.5 network support. The subsequent Phase 3B status is recorded below.

## 7. Phase 3B progress — 2026-10-02

The user authorized Testnet deployment preparation and selected a new PIGGY deployment from the repository source because the previously supplied token's source was not verified and its runtime did not match this repository's artifact.

| Check | Result |
|---|---|
| PIGGY contract | `PiggyToken` deployed from `contracts/src/PiggyToken.sol` to `0x4c8d2990Ce2C99E3C5F4B765D0359FcAd210b84b` |
| Network | BNB Smart Chain Testnet, chain ID `97` |
| Deployment transaction | `0x86c4063114f09660a38b94976935b6effbb8fe69c66d45f49aec14c88f6ef37d` |
| Receipt | Success (`status = 0x1`), block `0x803b34e` |
| Read-only code check | `cast codesize` returned `1815` bytes, matching the locally built `PiggyToken` runtime artifact |
| Read-only token reads | `name = PIGGY`, `symbol = PIGGY`, `decimals = 18`, `totalSupply = 100000000000000000000000000` (100,000,000 PIGGY) |
| Controlled token transfer | 1 PIGGY `transfer`, 1 PIGGY self-approved `transferFrom`, and exact sender/recipient/allowance/supply assertions passed in the Foundry broadcast script |
| Transfer receipts | All three receipts succeeded (`0x1`): `0x870622f247aab5ed62438bb2cf1937f8fc071d7878351b90d07b0111807ff3aa`, `0xda62bd7876bdf358bd83b5b4286cc7e722de678e477c75a48730ef76c92d7bc4`, `0x20597dc57c7cd08409357fb27fe5bf2249b3bd55395095077ebc2d1fed31a9b8` |
| Academic Treasury | Deployer address `0xde81fa07d3ab3ec23329d6f1d9643a4383ed38aa` (user confirmed) |
| VRF subscription | Created and funded by the user with `0.05 tBNB`; subscription ID is configured locally and will not be repeated in this tracked document |
| VRF subscription owner | Read-only coordinator query confirms deployer `0xde81fa07d3ab3ec23329d6f1d9643a4383ed38aa`; after one fulfilled request, native balance is `49722681600000000` wei; SquidPot is listed as consumer |
| SquidPot | Deployed from the repository source to `0x5F5db49C917257BD6bb21761EeEB97beF00A94c4`; receipt status successful at block `0x803c7e0`; VRF subscription ID getter matches the configured subscription |
| SquidPot deployment transaction | `0x1b7154ba040ad45566cacf2e63d6b42947b6f7499970b7227b8cbd19da151dc8` |
| Consumer authorization | Successful receipt at block `0x803c990`; transaction `0xeb8c862b21b5f0217fd919f9250fdc94eac92fb80ca146c2464f8d0e61f6947a` |
| Initialization funding | `100,500 PIGGY` transferred from Academic Treasury; contract reports `fundingInitialized = true` and `accountingSurplus = 0` |
| Approval transaction | `0x9406191fec1d1aca9c4a6aa1e8a92bbf1ef78153575493a1aa8f16a5375816ad`; success at block `0x803cdde` |
| Initialization transaction | `0x77f67be68c6606b622b85feee9957913d179789e336a95937df322c0cc244fb4`; success at block `0x803cdde` |
| Play entry approval | `0xbff6e4c977fca4b18d2e82be62fba157c1cb6552e07425a1be438bfc003a4267`; success at block `0x803d00d` |
| Play request transaction | `0xadf2b94d64bc0a6cee4bc49d3dc87f0e35bc6ae9462f9e0e1a19890933a1d5fe`; success at block `0x803d00d` |
| VRF fulfillment | Request `30803124592358293377635941319203770029720972418973240411540997864240898377136` reached `FULFILLED`; callback credited a 10 PIGGY slot reward; Chainlink subscription request count is 1 |
| Claim transaction | `0x5453e641ab0eff5f7f3499eb2e75b0202d3d24dd045a105d3a72fc5ef793ed8b`; success at block `0x803d1fb`; read-only check confirms pending slot reward is zero |
| Gameplay / VRF smoke test | Play, fulfillment, and claim all succeeded end to end on BNB Testnet |
| VRF billing after smoke test | Subscription has one request and `0.0497226816 tBNB` remaining |
| Frontend | Local public Testnet config is ignored; `/`, `/wallet`, and `/how-it-works` return HTTP 200; lint, TypeScript, and production build pass |

The successful Foundry deployment command used a 0.1 gwei priority fee and a 0.2 gwei max fee after the RPC rejected the initial fee with a minimum-tip error. The two earlier attempts stopped before broadcast: one used an unsupported `--env-file` flag, and one exposed that Foundry needs the key in `0x`-prefixed 32-byte hex format. The private key remains only in ignored local environment files. A Foundry cache file explicitly marked as containing sensitive values was removed after execution.

The deployer address from the successful receipt is `0xde81fa07d3ab3ec23329d6f1d9643a4383ed38aa`; the user confirmed this address as the Academic Treasury. The ignored Foundry environment contains the new PIGGY address, treasury, official BNB Testnet coordinator/key hash, three request confirmations, a 500,000 callback gas limit (the value used by the local invariant setup), native tBNB billing, and the user's funded subscription ID. Do not send private keys or include the subscription ID in tracked files.
