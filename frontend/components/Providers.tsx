"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, injected } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { CONFIGURATION_MESSAGE, frontendConfig } from "@/lib/config";
import { AppShell } from "@/components/AppShell";

const activeChain = frontendConfig?.chain ?? bscTestnet;
const activeRpcUrl = frontendConfig?.rpcUrl ?? bscTestnet.rpcUrls.default.http[0];

const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected()],
  transports: { [activeChain.id]: http(activeRpcUrl) },
});

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
  }));

  const mainContent = !frontendConfig ? (
    pathname === "/how-it-works" ? (
      children
    ) : (
      <section className="card config-state" aria-labelledby="config-title">
        <p className="eyebrow">ยังไม่ได้ตั้งค่าระบบ</p>
        <h1 id="config-title">SquidPot ยังเชื่อมต่อเครือข่ายทดลองไม่ได้</h1>
        <p role="status">{CONFIGURATION_MESSAGE}</p>
        <p className="muted">ตอนนี้ยังไม่แสดงยอดเงิน รางวัล หรือปุ่มเล่น เพื่อไม่ให้เข้าใจว่าเป็นข้อมูลจริง</p>
      </section>
    )
  ) : (
    children
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppShell>{mainContent}</AppShell>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
