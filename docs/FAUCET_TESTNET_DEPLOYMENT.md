# One-claim Faucet BNB Testnet deployment

Date: 2026-10-06  
Network: BNB Smart Chain Testnet (chain ID 97)

## Current contracts

| Contract | Address | Explorer |
|---|---|---|
| One-claim PIGGY | `0xd2a1d9345cA23De9f71A5A40B1d42bb3dEc7a511` | [BscScan](https://testnet.bscscan.com/address/0xd2a1d9345cA23De9f71A5A40B1d42bb3dEc7a511) |
| SquidPot using the one-claim PIGGY | `0x3D4E96F9a32a18AC405c2a6428e169678e5aAD45` | [BscScan](https://testnet.bscscan.com/address/0x3D4E96F9a32a18AC405c2a6428e169678e5aAD45) |

## Deployment and setup transactions

- PIGGY deployment: [transaction](https://testnet.bscscan.com/tx/0xed02c31aa620c4234dbecf7eed60709af02c5d2fd6f0ebfc128973d27d6f683b)
- SquidPot deployment: [transaction](https://testnet.bscscan.com/tx/0x1d49520708d9e1730f75038b3f50260c26974533ba8b260b33a9feab05caea85)
- Add SquidPot as Chainlink VRF consumer: [transaction](https://testnet.bscscan.com/tx/0x57a737a4a97dea5f5b7cc470a74d924dba1f040f9892fc88072a9afd657ef4b4)
- Approve initial funding: [transaction](https://testnet.bscscan.com/tx/0x1b6018b8c9af28fdb707832c55117d1f06254916257fdd6c4436e47b32104fd0)
- Initialize SquidPot with 500 PIGGY: [transaction](https://testnet.bscscan.com/tx/0xf02b52321e229ec6718f7e2068b597138e657f028ede4f4b21e563b57f4e2d31)

## Notes

- `faucet()` mints exactly 100 PIGGY once per address. The token records successful claims on-chain; repeat calls revert.
- The older PIGGY and SquidPot contracts remain deployed, but the frontend now points to this replacement pair.
- SquidPot is authorized on the existing funded Chainlink VRF subscription and initialized with a 500 PIGGY reserve.
- Local frontend and Foundry address settings, plus Vercel Production, Preview, and Development public environment variables, point to this pair.
