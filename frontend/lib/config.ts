import { bscTestnet } from "wagmi/chains";
import { defineChain, getAddress, isAddress, type Chain } from "viem";

export const CONFIGURATION_MESSAGE =
  "Contract addresses are not configured. Connect local Anvil or BNB Testnet deployment to use SquidPot.";

const raw = {
  piggyAddress: process.env.NEXT_PUBLIC_PIGGY_TOKEN_ADDRESS,
  squidPotAddress: process.env.NEXT_PUBLIC_SQUIDPOT_ADDRESS,
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
};

function buildConfig() {
  if (!raw.piggyAddress || !raw.squidPotAddress || !raw.chainId || !raw.rpcUrl) return null;

  const chainId = Number(raw.chainId);
  if (!Number.isSafeInteger(chainId) || !isAddress(raw.piggyAddress) || !isAddress(raw.squidPotAddress)) {
    return null;
  }
  if (chainId !== 97 && chainId !== 31337) return null;

  const piggyAddress = getAddress(raw.piggyAddress);
  const squidPotAddress = getAddress(raw.squidPotAddress);
  const chain: Chain = chainId === 97
    ? bscTestnet
    : defineChain({
        id: 31337,
        name: "Local Anvil",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [raw.rpcUrl] } },
        testnet: true,
      });

  return { chainId, chain, rpcUrl: raw.rpcUrl, piggyAddress, squidPotAddress } as const;
}

export const frontendConfig = buildConfig();
