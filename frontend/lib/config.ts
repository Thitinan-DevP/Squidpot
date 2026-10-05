import { bscTestnet } from "wagmi/chains";
import { defineChain, getAddress, isAddress, type Chain } from "viem";

export const CONFIGURATION_MESSAGE =
  "ระบบยังเชื่อมต่อสัญญาไม่สำเร็จ กรุณาตั้งค่าระบบเครือข่ายทดลองก่อนใช้งาน";

const isTestEnv = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);

const raw = {
  piggyAddress: process.env.NEXT_PUBLIC_PIGGY_TOKEN_ADDRESS || (!isTestEnv ? "0x4c8d2990Ce2C99E3C5F4B765D0359FcAd210b84b" : undefined),
  squidPotAddress: process.env.NEXT_PUBLIC_SQUIDPOT_ADDRESS || (!isTestEnv ? "0x5F5db49C917257BD6bb21761EeEB97beF00A94c4" : undefined),
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID || (!isTestEnv ? "97" : undefined),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || (!isTestEnv ? "https://data-seed-prebsc-1-s1.bnbchain.org:8545" : undefined),
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
