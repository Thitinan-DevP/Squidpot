# Faucet-enabled BNB Testnet deployment

Date: 2026-10-06  
Network: BNB Smart Chain Testnet (chain ID 97)

## Current contracts

| Contract | Address | Explorer |
|---|---|---|
| Faucet-enabled PIGGY | `0x2dD78662B94B7B92EadC9E6903A80bBd3DbD9696` | [BscScan](https://testnet.bscscan.com/address/0x2dD78662B94B7B92EadC9E6903A80bBd3DbD9696) |
| SquidPot using the Faucet-enabled PIGGY | `0x336d4f4f6Cba170b4d2ad7D058da064248281778` | [BscScan](https://testnet.bscscan.com/address/0x336d4f4f6Cba170b4d2ad7D058da064248281778) |

## Deployment and setup transactions

- PIGGY deployment, block `0x80cfc72`: [transaction](https://testnet.bscscan.com/tx/0xd51d08d5bcf95f686339e0f60190a353aa08e7f0b441c2b57203cb32d1815805)
- SquidPot deployment, block `0x80cfcf9`: [transaction](https://testnet.bscscan.com/tx/0x19cf489c802e36bcea0f0831d4f9326d9ddab4f1883d41a50a46c1e3628015a0)
- Add SquidPot as Chainlink VRF consumer, block `0x80cfe5c`: [transaction](https://testnet.bscscan.com/tx/0x1b91c2ae5cdd390a1a9687e3ec5f4abd25073e91e49a5f0a95477f9d6b8f3bfd)
- Approve initial funding, block `0x80cff31`: [transaction](https://testnet.bscscan.com/tx/0xd45e8857535ae9a9526e78e463adb46868bafe8b1a651599874a1f0e2a30f4db)
- Initialize SquidPot with 100,500 PIGGY, block `0x80cff31`: [transaction](https://testnet.bscscan.com/tx/0x5e362132b8fb49ee7370d641711ca52a483b0977f3aaf296729af0e5ee268ecf)

## Notes

- `faucet()` permissionlessly mints exactly 100 PIGGY per call. It has no cooldown or per-wallet cap and is intended only for the academic Testnet prototype.
- The matching SquidPot had to be redeployed because its token address is immutable after deployment.
- The prior contracts remain deployed; the frontend configuration now points to the new pair.
- Local frontend and Foundry address settings, plus the Vercel production, preview, and development public environment variables, point to these contracts.
