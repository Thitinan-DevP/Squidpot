"use client";

import { shortAddress } from "@/lib/format";

type Props = {
  address?: string;
  chainId?: number;
  isConnected: boolean;
  correctNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
};

export function WalletConnection({ address, chainId, isConnected, correctNetwork, connect, disconnect, switchNetwork }: Props) {
  return (
    <section className="card wallet-card" aria-labelledby="wallet-connection-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Wallet</p>
          <h2 id="wallet-connection-heading">Connection</h2>
        </div>
        <span className={`status-pill ${isConnected && correctNetwork ? "status-ok" : "status-neutral"}`}>
          {isConnected ? (correctNetwork ? "Configured network" : "Wrong network") : "Disconnected"}
        </span>
      </div>
      <dl className="wallet-details">
        <div><dt>Address</dt><dd title={address}>{shortAddress(address)}</dd></div>
        <div><dt>Wallet chain ID</dt><dd>{chainId ?? "Not connected"}</dd></div>
      </dl>
      <div className="button-row">
        {!isConnected ? <button className="button button-primary" onClick={() => void connect()}>Connect wallet</button> : (
          <>
            {!correctNetwork && <button className="button button-secondary" onClick={() => void switchNetwork()}>Switch network</button>}
            <button className="button button-quiet" onClick={disconnect}>Disconnect</button>
          </>
        )}
      </div>
      {isConnected && !correctNetwork && <p className="inline-warning" role="alert">Switch your wallet to chain ID {process.env.NEXT_PUBLIC_CHAIN_ID} before interacting.</p>}
    </section>
  );
}
