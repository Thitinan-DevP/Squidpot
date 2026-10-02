"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, injected } from "wagmi";
import { CONFIGURATION_MESSAGE, frontendConfig } from "@/lib/config";
import { AppShell } from "@/components/AppShell";

const wagmiConfig = frontendConfig
  ? createConfig({
      chains: [frontendConfig.chain],
      connectors: [injected()],
      transports: { [frontendConfig.chain.id]: http(frontendConfig.rpcUrl) },
    })
  : null;

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
  }));

  if (!frontendConfig || !wagmiConfig) {
    if (pathname === "/how-it-works") {
      return <AppShell>{children}</AppShell>;
    }
    return (
      <AppShell>
        <section className="card config-state" aria-labelledby="config-title">
          <p className="eyebrow">Configuration required</p>
          <h1 id="config-title">SquidPot is not connected to a deployment</h1>
          <p role="status">{CONFIGURATION_MESSAGE}</p>
          <p className="muted">No balances, rewards, countdowns, or gameplay are shown until valid environment configuration is provided.</p>
        </section>
      </AppShell>
    );
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppShell>{children}</AppShell>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
