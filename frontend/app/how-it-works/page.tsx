const allocations = [
  ["Current prize pool", "4.00 PIGGY"],
  ["Available slot reserve", "3.00 PIGGY"],
  ["Previous-player reward", "1.50 PIGGY"],
  ["Next-round rollover", "1.00 PIGGY"],
  ["Irrecoverable token sink", "0.50 PIGGY"],
];

const tiers = [
  ["0–7,999", "80%", "0 PIGGY"],
  ["8,000–9,499", "15%", "10 PIGGY"],
  ["9,500–9,949", "4.5%", "20 PIGGY"],
  ["9,950–9,999", "0.5%", "50 PIGGY"],
];

export default function HowItWorksPage() {
  return (
    <article className="page-stack how-page">
      <header className="page-intro">
        <div className="intro-copy">
          <p className="eyebrow">Protocol overview <span aria-hidden="true">·</span> Contract-enforced rules</p>
          <h1>How SquidPot works</h1>
          <p>This is an academic prototype for test networks only. PIGGY has no real-world value and is not a real-money product.</p>
        </div>
        <div className="intro-stamp" aria-label="Game rules summary">
          <span className="stamp-label">ONE ENTRY</span>
          <strong>10 PIGGY</strong>
          <span>Randomness verified on-chain</span>
        </div>
      </header>
      <section className="card">
        <h2>Entry allocation</h2>
        <p>Each successful play costs 10 PIGGY. The contract accounts for the full entry as follows:</p>
        <div className="table-wrap"><table><thead><tr><th scope="col">Destination</th><th scope="col">Per play</th></tr></thead><tbody>{allocations.map(([label, amount]) => <tr key={label}><th scope="row">{label}</th><td>{amount}</td></tr>)}</tbody></table></div>
        <p className="muted">If there is no previous player, or the same address plays consecutively, that previous-player allocation moves to rollover. This prevents direct self-reward by one address, not Sybil activity across multiple wallets.</p>
      </section>
      <section className="card">
        <h2>Random slot reward</h2>
        <p>The contract maps the VRF word modulo 10,000 into these fixed tiers. No outcome is known until the on-chain request is fulfilled.</p>
        <div className="table-wrap"><table><thead><tr><th scope="col">Roll</th><th scope="col">Probability</th><th scope="col">Reward</th></tr></thead><tbody>{tiers.map(([roll, probability, reward]) => <tr key={roll}><th scope="row">{roll}</th><td>{probability}</td><td>{reward}</td></tr>)}</tbody></table></div>
        <p>The expected slot reward is 2.65 PIGGY against a 3.00 PIGGY slot allocation, a 0.35 PIGGY expected margin per play. Expected margin does not guarantee short-term liquidity. The accumulated reserve surplus remains in the contract; the owner cannot withdraw it.</p>
      </section>
      <section className="card">
        <h2>Rounds and settlement</h2>
        <p>A round opens on the first play. Later plays extend its deadline, subject to a 24-hour hard cap. Once the contract reports the round as expired, anyone may call settlement. Settlement does not make the caller the winner: the contract records the last player and assigns that player the round prize as a pending claim.</p>
        <p>Settlement is permissionless and performs no token transfer. The recorded winner must make a separate pull-payment claim. Prize, previous-player, and slot rewards each have separate claim functions.</p>
      </section>
      <section className="card">
        <h2>VRF and limitations</h2>
        <p>Each play requests randomness from the configured Chainlink VRF v2.5 coordinator and reserves slot-liability capacity. Rewards become claimable only after a request is fulfilled on-chain. Requests may expire after the research timeout; expiration does not refund the 10 PIGGY entry fee.</p>
        <ul className="plain-list">
          <li>Sybil wallets can bypass same-address self-play checks.</li>
          <li>Transaction ordering and validator/MEV effects are not eliminated.</li>
          <li>VRF availability and the 200-block timeout are research parameters, not production guarantees.</li>
          <li>This academic testnet prototype has no real-world value.</li>
        </ul>
      </section>
    </article>
  );
}
