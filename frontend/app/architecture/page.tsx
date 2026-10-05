import type { Metadata } from "next";
import "./architecture.css";

export const metadata: Metadata = {
  title: "สถาปัตยกรรมระบบ — SquidPot Engineering Blueprint",
  description:
    "เอกสารนิยามโครงสร้างเชิงวิศวกรรมและกลไกความปลอดภัยของ SquidPot: Provably Fair Randomness, Solvency Model, Chainlink VRF v2.5",
};

export default function ArchitecturePage() {
  return (
    <div className="arch-root">
      {/* Background decoration */}
      <div className="arch-bg" aria-hidden="true">
        <div className="arch-bg-grid" />
        <div className="arch-bg-glow arch-bg-glow-1" />
        <div className="arch-bg-glow arch-bg-glow-2" />
      </div>

      <div className="arch-shell">
        {/* Header */}
        <header className="arch-header">
          <div className="arch-header-badge">Engineering Blueprint</div>
          <h1 className="arch-title">
            สถาปัตยกรรมระบบและกลไกความปลอดภัย
            <span className="arch-title-sub">SquidPot — Lucky Carnival Wheel</span>
          </h1>
          <p className="arch-subtitle">
            เอกสารนิยามโครงสร้างเชิงวิศวกรรม &amp; Provably Fair Mechanism
          </p>
          <div className="arch-meta-row">
            <span className="arch-meta-chip">BNB Smart Chain Testnet</span>
            <span className="arch-meta-chip">Chainlink VRF v2.5</span>
            <span className="arch-meta-chip arch-meta-chip-warn">Tokens Have No Real-World Value</span>
          </div>
        </header>

        {/* TOC */}
        <nav className="arch-toc" aria-label="สารบัญ">
          <p className="arch-toc-label">สารบัญ</p>
          <ol className="arch-toc-list">
            <li><a href="#section-1">1. บทนำและแนวคิดระบบ</a></li>
            <li><a href="#section-2">2. แบบจำลองคณิตศาสตร์และการป้องกันการล้มละลาย</a></li>
            <li><a href="#section-3">3. กลไกการสุ่มระดับบล็อกเชน (Chainlink VRF v2.5)</a></li>
            <li><a href="#section-4">4. สถาปัตยกรรมการเงินและความปลอดภัย</a></li>
            <li><a href="#section-5">5. สถาปัตยกรรมระบบข้อมูล</a></li>
          </ol>
        </nav>

        <main className="arch-content">

          {/* Section 1 */}
          <section id="section-1" className="arch-section">
            <div className="arch-section-number">01</div>
            <h2 className="arch-section-title">
              บทนำและแนวคิดระบบ <span className="arch-en">Concept &amp; System Overview</span>
            </h2>
            <p>
              SquidPot คือต้นแบบระบบเกมกระจายศูนย์แบบปิด{" "}
              <strong>Closed-Loop Decentralized GameFi Simulation</strong> บนเครือข่าย BNB Smart Chain Testnet
              โดยพัฒนาขึ้นเพื่อศึกษา ทฤษฎีเกม (Game Theory), การเงินที่ไม่พึ่งพาตัวกลาง (DeFi/GameFi Solvency)
              และการสร้างความสุ่มที่โปร่งใสและพิสูจน์ได้ทางคณิตศาสตร์{" "}
              <strong>Provably Fair Randomness</strong>
            </p>
            <p className="arch-lead">ระบบถูกออกแบบมาเพื่อแก้ปัญหาคลาสสิกของเกมพนันและระบบการเงินดั้งเดิม:</p>
            <div className="arch-card-grid">
              <div className="arch-card">
                <div className="arch-card-icon">🎯</div>
                <h3>ขจัดปัญหาเจ้ามือล็อคผล</h3>
                <p>
                  House Rigging: ผลลัพธ์ไม่ได้คำนวณจาก Server กลาง แต่อิงจากค่าสุ่มเชิงวิทยาการเข้ารหัสลับ
                  (Verifiable Random Function: VRF) บนบล็อกเชน
                </p>
              </div>
              <div className="arch-card">
                <div className="arch-card-icon">🔒</div>
                <h3>ขจัดความเสี่ยงต่อการเบี้ยวหนี้</h3>
                <p>
                  Zero Default Risk: มีกลไกกันสำรองเงินสูงสุดล่วงหน้า (Pre-locking)
                  ทำให้ระบบมีเงินจ่ายรางวัลจริงทุกกรณี
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="arch-section">
            <div className="arch-section-number">02</div>
            <h2 className="arch-section-title">
              แบบจำลองคณิตศาสตร์และการป้องกันการล้มละลาย <span className="arch-en">Solvency Model</span>
            </h2>

            <h3 className="arch-h3">
              2.1 สมการความมั่นคงทางการเงิน <span className="arch-en">Contract Solvency Invariant</span>
            </h3>
            <p>สัญญาอัจฉริยะควบคุมสถานะทางบัญชีด้วยกฎ Invariant ที่ต้องเป็นจริงเสมอในทุกบล็อก:</p>
            <div className="arch-formula-block">
              <div className="arch-formula">
                <code>Contract Balance ≥ Total Liabilities</code>
              </div>
              <div className="arch-formula-detail">
                <p className="arch-formula-label">โดยที่ Total Liabilities คือผลรวมของ:</p>
                <ul className="arch-formula-list">
                  <li><code>availableSlotReserve</code> — กองทุนสล็อตที่พร้อมใช้</li>
                  <li><code>reservedSlotLiability</code> — เงินที่ล็อกไว้รองรับคำขอที่กำลังรอผลสุ่ม</li>
                  <li><code>totalPendingSlotRewards</code> — รางวัลที่ยังไม่ได้ถูกถอน</li>
                  <li><code>rolloverReserve</code> — เงินสำรองสำหรับรอบถัดไป</li>
                  <li><code>tokenSinkAllocation</code> — ส่วนที่จัดสรรเพื่อ Burn หรือ Sink</li>
                </ul>
              </div>
            </div>

            <h3 className="arch-h3">2.2 กลไก Maximum Liability Pre-locking</h3>
            <p>
              เพื่อตัดปัญหาการขาดสภาพคล่องระยะสั้น (Short-term Insolvency)
              ระบบจะไม่รับคำขอสุ่มหากไม่มีเงินสำรองรองรับความเสี่ยงสูงสุด:
            </p>
            <div className="arch-steps">
              <div className="arch-step">
                <div className="arch-step-num">1</div>
                <div>
                  <strong>Pre-lock:</strong> รางวัลสูงสุด R<sub>max</sub> = 50 PIGGY
                  ถูกล็อกออกจาก <code>availableSlotReserve</code> ทันทีก่อนส่งคำขอสุ่ม
                </div>
              </div>
              <div className="arch-step">
                <div className="arch-step-num">2</div>
                <div>
                  <strong>Unlock:</strong> เมื่อทราบผลสุ่มจริง R<sub>actual</sub><br />
                  ปลดล็อกหนี้: <code>reservedSlotLiability ← reservedSlotLiability − R<sub>max</sub></code><br />
                  คืนส่วนต่าง: <code>availableSlotReserve ← availableSlotReserve + (R<sub>max</sub> − R<sub>actual</sub>)</code>
                </div>
              </div>
              <div className="arch-step">
                <div className="arch-step-num">3</div>
                <div>
                  <strong>Credit Winner:</strong>{" "}
                  <code>pendingRewards[user] ← pendingRewards[user] + R<sub>actual</sub></code>
                </div>
              </div>
            </div>

            <h3 className="arch-h3">
              2.3 ตารางความน่าจะเป็นและค่าคาดหมาย <span className="arch-en">Expected Value &amp; House Edge</span>
            </h3>
            <p>การกระจายรางวัลต่อค่าตั๋ว 10 PIGGY:</p>
            <div className="arch-table-wrapper">
              <table className="arch-table">
                <thead>
                  <tr>
                    <th>ระดับรางวัล</th>
                    <th>สิทธิ์ผลตอบแทน</th>
                    <th>ค่าตัวเลขฐาน (roll)</th>
                    <th>ความน่าจะเป็น (P)</th>
                    <th>จ่ายออก (R)</th>
                    <th>ค่าคาดหมาย (E = P×R)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="arch-badge arch-badge-none">No Reward</span></td>
                    <td>ช่องเปล่า</td>
                    <td>0 – 7,999</td>
                    <td>80.00%</td>
                    <td>0 PIGGY</td>
                    <td>0.000 PIGGY</td>
                  </tr>
                  <tr>
                    <td><span className="arch-badge arch-badge-small">Small Reward</span></td>
                    <td>คืนทุน</td>
                    <td>8,000 – 9,499</td>
                    <td>15.00%</td>
                    <td>10 PIGGY</td>
                    <td>1.500 PIGGY</td>
                  </tr>
                  <tr>
                    <td><span className="arch-badge arch-badge-medium">Medium Reward</span></td>
                    <td>2 เท่า</td>
                    <td>9,500 – 9,949</td>
                    <td>4.50%</td>
                    <td>20 PIGGY</td>
                    <td>0.900 PIGGY</td>
                  </tr>
                  <tr className="arch-table-highlight">
                    <td><span className="arch-badge arch-badge-large">Large Reward</span></td>
                    <td>รางวัลใหญ่ (R<sub>max</sub>)</td>
                    <td>9,950 – 9,999</td>
                    <td>0.50%</td>
                    <td>50 PIGGY</td>
                    <td>0.250 PIGGY</td>
                  </tr>
                  <tr className="arch-table-total">
                    <td colSpan={3}><strong>รวม</strong></td>
                    <td><strong>100.00%</strong></td>
                    <td>—</td>
                    <td><strong>EV = 2.650 PIGGY</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="arch-formula-block arch-margin-top">
              <div className="arch-formula">
                <code>Expected Slot Margin = 3.00 − 2.65 = +0.350 PIGGY/play</code>
              </div>
              <p className="arch-formula-label">
                จากค่าตั๋ว 10 PIGGY ส่วนที่จัดสรรเข้ากองทุนสล็อตคือ 3.00 PIGGY
                ทำให้ระบบมี Surplus สะสมตามสถิติระยะยาวเพื่อสร้างความยั่งยืน ไม่เกิดภาวะขาดทุนเรื้อรัง
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="arch-section">
            <div className="arch-section-number">03</div>
            <h2 className="arch-section-title">
              กลไกการสุ่มระดับบล็อกเชน <span className="arch-en">Chainlink VRF v2.5 Architecture</span>
            </h2>
            <p>
              ระบบตัดการพึ่งพาตัวแปรบนบล็อกเชนที่ควบคุมได้ง่าย (เช่น <code>block.timestamp</code> หรือ <code>blockhash</code>)
              และใช้การประมวลผล 2 จังหวะ — <strong>Request-Fulfill Pattern</strong>
            </p>
            <div className="arch-flow">
              <div className="arch-flow-node arch-flow-node-user">
                <div className="arch-flow-icon">👤</div>
                <div>
                  <strong>ผู้เล่น / Frontend</strong>
                  <p>เรียก <code>play()</code></p>
                </div>
              </div>
              <div className="arch-flow-arrow">
                <span className="arch-flow-label">1. โอน 10 PIGGY + ล็อก 50 PIGGY</span>
              </div>
              <div className="arch-flow-node arch-flow-node-contract">
                <div className="arch-flow-icon">📜</div>
                <div>
                  <strong>SquidPot Smart Contract</strong>
                  <p>เรียก <code>requestRandomWords()</code></p>
                </div>
              </div>
              <div className="arch-flow-arrow">
                <span className="arch-flow-label">2. ส่งคำขอสุ่ม</span>
              </div>
              <div className="arch-flow-node arch-flow-node-vrf">
                <div className="arch-flow-icon">⛓️</div>
                <div>
                  <strong>Chainlink VRF Coordinator</strong>
                  <p>Off-chain Oracles คำนวณ Cryptographic Proof</p>
                </div>
              </div>
              <div className="arch-flow-arrow arch-flow-arrow-return">
                <span className="arch-flow-label">3. ส่ง Proof กลับผ่าน <code>fulfillRandomWords()</code></span>
              </div>
              <div className="arch-flow-node arch-flow-node-callback">
                <div className="arch-flow-icon">✅</div>
                <div>
                  <strong>fulfillRandomWords Callback</strong>
                  <ul className="arch-flow-steps">
                    <li>4. ตรวจสอบสถานะคำขอ (Idempotent Check)</li>
                    <li>5. ปลดล็อก Reserve และบันทึกยอดรางวัล</li>
                  </ul>
                </div>
              </div>
              <div className="arch-flow-arrow">
                <span className="arch-flow-label">รางวัลพร้อมถอน</span>
              </div>
              <div className="arch-flow-node arch-flow-node-result">
                <div className="arch-flow-icon">💰</div>
                <div>
                  <strong>Pending Rewards Ready for User Claim</strong>
                </div>
              </div>
            </div>
            <div className="arch-info-box">
              <strong>🛡️ Idempotency &amp; Late Callback Protection:</strong>
              <p>
                คำขอทุกชุดถูกกำกับด้วย <code>requestId</code> และสถานะ <code>REQUESTED</code>
                หาก Callback ตอบสนองช้าจนเกินเวลา Timeout คำขอจะถูกตัดสิทธิ์และปลดเงินล็อกคืน
                เพื่อไม่ให้ระบบค้างชะงัก
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="arch-section">
            <div className="arch-section-number">04</div>
            <h2 className="arch-section-title">
              สถาปัตยกรรมการเงินและความปลอดภัย <span className="arch-en">Security Threat Model</span>
            </h2>
            <div className="arch-security-grid">
              <div className="arch-security-card">
                <div className="arch-security-icon">🔐</div>
                <h3>Checks-Effects-Interactions (CEI)</h3>
                <p>
                  ทุกฟังก์ชันในสัญญาอัจฉริยะจะปรับปรุงสถานะทางบัญชีภายใน (Internal Storage) ให้เสร็จสิ้น
                  ก่อนส่ง Interaction หรือโอนเหรียญออกภายนอกเสมอ
                </p>
              </div>
              <div className="arch-security-card">
                <div className="arch-security-icon">⬇️</div>
                <h3>Pull-Payment Pattern</h3>
                <p>
                  รางวัลจะไม่ถูกโอนเข้ากระเป๋าผู้เล่นโดยตรงในขณะคำนวณผล (เพื่อป้องกัน Denial-of-Service
                  และ Reentrancy Attack) แต่จะถูกเก็บไว้ใน <code>pendingRewards[address]</code>{" "}
                  เพื่อให้ผู้เล่นเป็นผู้สั่งถอนด้วยตนเองผ่าน <code>claimReward()</code>
                </p>
              </div>
              <div className="arch-security-card">
                <div className="arch-security-icon">🧾</div>
                <h3>SafeERC20 &amp; Exact Receipt Check</h3>
                <p>
                  สัญญาคำนวณยอด Balance จริงของสัญญาก่อนและหลังโอน เพื่อดักจับโทเคนที่อาจมีพฤติกรรม
                  หักค่าธรรมเนียมแฝง (Fee-on-transfer)
                </p>
              </div>
              <div className="arch-security-card arch-security-card-highlight">
                <div className="arch-security-icon">⏸️</div>
                <h3>Selective Pause Semantics</h3>
                <p>
                  หากผู้ดูแลระบบสั่งเปิดโหมดหยุดฉุกเฉิน (pause) ระบบจะระงับเฉพาะคำสั่ง <code>play()</code>{" "}
                  แต่จะเปิดให้ผู้เล่นถอนเงินรางวัลเดิมออกได้ตลอดเวลา — <strong>Strictly No Admin Rug-pull</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="arch-section">
            <div className="arch-section-number">05</div>
            <h2 className="arch-section-title">
              สถาปัตยกรรมระบบข้อมูล <span className="arch-en">Data Architecture &amp; Source of Truth</span>
            </h2>
            <div className="arch-data-stack">
              <div className="arch-data-layer">
                <div className="arch-data-label">Layer 1 — Canonical State</div>
                <div className="arch-data-content">
                  <strong>🏛️ Single Source of Truth</strong>
                  <p>
                    สัญญาอัจฉริยะบน BNB Smart Chain เป็นฐานข้อมูลหลักเพียงจุดเดียวที่มีผลผูกพันทางบัญชี
                  </p>
                </div>
              </div>
              <div className="arch-data-layer">
                <div className="arch-data-label">Layer 2 — Real-time Reads</div>
                <div className="arch-data-content">
                  <strong>⚡ Real-time Engine</strong>
                  <p>
                    หน้าเว็บดึงข้อมูลเวลาและยอดคงเหลือโดยตรงจาก Node RPC (ผ่าน Wagmi/Viem)
                    เพื่อความแม่นยำในการทำธุรกรรม
                  </p>
                </div>
              </div>
              <div className="arch-data-layer">
                <div className="arch-data-label">Layer 3 — Historical Index</div>
                <div className="arch-data-content">
                  <strong>📊 The Graph Indexer</strong>
                  <p>
                    ใช้จับ Events บนบล็อกเชนเพื่อประมวลผลกระดานสถิติย้อนหลังและ Leaderboard
                    โดยตัดการพึ่งพาฐานข้อมูลแบบรวมศูนย์ออกทั้งหมด
                  </p>
                </div>
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="arch-footer">
          <p>
            SquidPot Academic Prototype · BNB Smart Chain Testnet ·{" "}
            <span className="arch-footer-warn">Tokens Have No Real-World Value</span>
          </p>
          <a href="/" className="arch-back-link">← กลับสู่หน้าเกม</a>
        </footer>
      </div>
    </div>
  );
}
