# Contract Dependency Provenance

The Phase 1 contract build vendors source-only dependency copies under `contracts/lib` because Foundry submodule installation could not reliably modify Git metadata on the mounted Windows drive. The vendored source is reproducible from the exact revisions below.

## OpenZeppelin Contracts

- Source: https://github.com/OpenZeppelin/openzeppelin-contracts
- Exact commit: `32b5b8c4655448291e27272d43607b9e3ae8c1d8`
- License: MIT
- Vendored path: `contracts/lib/openzeppelin-contracts/contracts`

## forge-std

- Source: https://github.com/foundry-rs/forge-std
- Exact commit: `6b72d0fcba36f39e07cf08bbe66a0d1525011e1f`
- License: MIT
- Vendored path: `contracts/lib/forge-std/src`

## Chainlink EVM contracts

- Source: https://github.com/smartcontractkit/chainlink-evm
- Release tag: `contracts-v1.5.0`
- Exact commit: `86aa5a1d34b20eda8d18fe6eb0e4882948e545ba`
- Immutable source archive: https://github.com/smartcontractkit/chainlink-evm/archive/86aa5a1d34b20eda8d18fe6eb0e4882948e545ba.tar.gz
- License: the imported Solidity contract sources and repository `LICENSE` identify the relevant contract code as MIT; the monorepo package metadata is `BUSL-1.1`, and other repository portions may carry their own licenses.
- Vendored path: `contracts/lib/chainlink-evm`
- Imported API: `VRFConsumerBaseV2Plus`, `IVRFCoordinatorV2Plus`, and `VRFV2PlusClient` from `contracts/src/v0.8/vrf/dev`.
- Compatibility: these sources use Solidity `^0.8.4` and compile with this project's pinned Solidity `0.8.24`. SquidPot uses the VRF v2.5 subscription request structure and explicit `ExtraArgsV1.nativePayment` setting.

## Reproducible refresh

Run these commands from WSL Ubuntu. Use a temporary directory outside the repository, check out the exact commits, and replace only the corresponding vendored dependency after reviewing the diff:

```bash
tmpdir="$(mktemp -d)"
git clone https://github.com/OpenZeppelin/openzeppelin-contracts "$tmpdir/openzeppelin-contracts"
git -C "$tmpdir/openzeppelin-contracts" checkout 32b5b8c4655448291e27272d43607b9e3ae8c1d8
git clone https://github.com/foundry-rs/forge-std "$tmpdir/forge-std"
git -C "$tmpdir/forge-std" checkout 6b72d0fcba36f39e07cf08bbe66a0d1525011e1f
git clone https://github.com/smartcontractkit/chainlink-evm "$tmpdir/chainlink-evm"
git -C "$tmpdir/chainlink-evm" checkout 86aa5a1d34b20eda8d18fe6eb0e4882948e545ba
test "$(git -C "$tmpdir/chainlink-evm" rev-parse HEAD)" = "86aa5a1d34b20eda8d18fe6eb0e4882948e545ba"
```

As an archive-only alternative for Chainlink, download the immutable archive URL above, extract it with `--strip-components=1`, and place the result at `contracts/lib/chainlink-evm`. Verify the archive URL contains the exact commit rather than a movable branch. Do not replace any dependency with an unpinned branch or tag.

The dependency source remains intentionally vendored rather than committed as Git submodules because Git/submodule operations have been unreliable on the mounted Windows drive. The exact revisions above preserve reproducibility without requiring submodule metadata on that filesystem. The Chainlink dependency was installed from the immutable commit archive after a recursive submodule clone stalled; no generated artifacts or private configuration are part of the vendored source.
