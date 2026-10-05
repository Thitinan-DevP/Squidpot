import type { Metadata } from "next";
import "./architecture.css";

export const metadata: Metadata = {
  title: "Technical Architecture Specification — SquidPot",
  description:
    "เอกสารสถาปัตยกรรมเชิงวิศวกรรม: DeFi Solvency Invariant, Asynchronous VRF Settlement, และ Stochastic House Edge Modeling บน BNB Smart Chain Testnet",
};

export default function ArchitecturePage() {
  return (
    <div className="arch-root">
      <div className="arch-bg" aria-hidden="true">
        <div className="arch-bg-grid" />
        <div className="arch-bg-glow arch-bg-glow-1" />
        <div className="arch-bg-glow arch-bg-glow-2" />
      </div>

      <div className="arch-shell">
        {/* Header */}
        <header className="arch-header">
          <div className="arch-header-badge">Technical Architecture Specification</div>
          <h1 className="arch-title">
            เอกสารสถาปัตยกรรมระบบ
            <span className="arch-title-sub">SquidPot — Lucky Carnival Wheel</span>
          </h1>
          <p className="arch-subtitle">
            การศึกษาวิศวกรรมระบบกระจายศูนย์ด้าน DeFi Solvency Invariant และ Asynchronous Settlement Management
          </p>
          <div className="arch-meta-row">
            <span className="arch-meta-chip">BNB Smart Chain Testnet</span>
            <span className="arch-meta-chip">Chainlink VRF v2.5</span>
            <span className="arch-meta-chip arch-meta-chip-warn">Academic Prototype — Tokens Have No Real-World Value</span>
          </div>
        </header>

        {/* TOC */}
        <nav className="arch-toc" aria-label="สารบัญ">
          <p className="arch-toc-label">สารบัญเอกสาร</p>
          <ol className="arch-toc-list">
            <li><a href="#section-1">1. บทนำและขอบเขตเชิงวิศวกรรม (Engineering Scope &amp; Architecture Overview)</a></li>
            <li><a href="#section-2">2. แบบจำลอง Solvency Invariant และกลไก Pre-locking</a></li>
            <li><a href="#section-3">3. การประสานงานผลสุ่มแบบอะซิงโครนัส (Chainlink VRF v2.5)</a></li>
            <li><a href="#section-4">4. รูปแบบความปลอดภัยของสัญญาอัจฉริยะ (Security Patterns)</a></li>
            <li><a href="#section-5">5. สถาปัตยกรรมระบบข้อมูลและแหล่งข้อมูลหลัก (Data Architecture)</a></li>
          </ol>
        </nav>

        <main className="arch-content">

          {/* ══ Section 1 ══ */}
          <section id="section-1" className="arch-section">
            <div className="arch-section-number">01</div>
            <h2 className="arch-section-title">
              บทนำและขอบเขตเชิงวิศวกรรม
              <span className="arch-en">Engineering Scope &amp; Architecture Overview</span>
            </h2>

            <p className="arch-paragraph">
              <strong>SquidPot (Lucky Carnival Wheel)</strong> เป็นระบบจำลองสัญญาอัจฉริยะแบบกระจายศูนย์บนเครือข่าย BNB Smart Chain Testnet 
              ที่พัฒนาขึ้นเพื่อศึกษา <strong>การรักษาสภาพคล่องทางการเงินโดยไร้ตัวกลาง (DeFi Solvency Invariant)</strong> และ <strong>การประสานงานผลสุ่มแบบอะซิงโครนัส (Asynchronous Verifiable Randomness)</strong>
            </p>

            {/* Core Research Question Callout */}
            <div className="arch-quote-box">
              <div className="arch-quote-tag">โจทย์ปัญหาหลักทางวิศวกรรม (Primary Research Question)</div>
              <blockquote className="arch-quote-text">
                &ldquo;ในระบบคาสิโนแบบกระจายศูนย์ที่ผลลัพธ์จาก Oracle กลับมาแบบไม่พร้อมกัน (Asynchronous Callback) สัญญาอัจฉริยะจะรักษาสภาพคล่องและป้องกันการล้มละลายได้อย่างไร หากเกิดกรณีที่มีผู้เล่นสุ่มได้รางวัลใหญ่พร้อมกันหลายคน?&rdquo;
              </blockquote>
              <p className="arch-quote-desc">
                นี่คือโจทย์เชิงวิศวกรรมที่ระบบนี้ให้คำตอบผ่านการพิสูจน์ Invariant เชิงคณิตศาสตร์และกลไก Pre-locking
              </p>
            </div>

            <p className="arch-lead">
              ระบบมุ่งเน้นการแก้ปัญหาคอขวดเชิงโครงสร้างของแอปพลิเคชันเสี่ยงโชคบนบล็อกเชน (On-chain Gaming) ใน 3 มิติ:
            </p>

            <div className="arch-problem-list">
              <div className="arch-problem-item">
                <div className="arch-problem-num">1</div>
                <div className="arch-problem-body">
                  <h3>ความไม่พร้อมกันของผลสุ่มและสภาพคล่อง (Asynchronous Settlement &amp; Solvency)</h3>
                  <p>
                    ในระบบบล็อกเชน การเรียกผลสุ่มจากภายนอก (Chainlink VRF) ต้องใช้เวลาข้ามบล็อก หากไม่มีการจัดการเงินสำรองที่ดี 
                    สัญญาอาจรับภาระหนี้สินเกินสภาพคล่องจริง ระบบนี้จึงนำเสนอกลไก <strong>Maximum Liability Pre-locking</strong> เพื่อกันสำรองเงินสูงสุดของทุกคำขอก่อนส่งคำสั่ง 
                    ทำให้ระบบรักษาสมดุลบัญชี <code>Contract Balance ≥ Total Liabilities</code> ได้ตลอดเวลา
                  </p>
                </div>
              </div>

              <div className="arch-problem-item">
                <div className="arch-problem-num">2</div>
                <div className="arch-problem-body">
                  <h3>ความโปร่งใสที่ตรวจสอบย้อนหลังได้ (Provably Fair &amp; Deterministic Logic)</h3>
                  <p>
                    ขจัดดุลยพินิจของตัวกลางด้วยการแปลงผลสุ่มเชิงวิทยาการเข้ารหัสลับ (Cryptographic Proof) ผ่านสมการคณิตศาสตร์แบบคงที่บนสัญญาอัจฉริยะ 
                    ทุกทรานแซกชันสามารถตรวจสอบความถูกต้องได้บนเชนสาธารณะ
                  </p>
                </div>
              </div>

              <div className="arch-problem-item">
                <div className="arch-problem-num">3</div>
                <div className="arch-problem-body">
                  <h3>การควบคุมความเสี่ยงเชิงสถิติ (Stochastic House Edge Modeling)</h3>
                  <p>
                    แบบจำลองคณิตศาสตร์กำหนดค่าคาดหมายผลตอบแทน (Expected Value) ให้สร้างส่วนต่างสะสม (Expected Margin) เพื่อรองรับความผันผวนทางสถิติในระยะสั้น 
                    พร้อมกลไกตัดอุปทานหมุนเวียน (Token Sink) เพื่อศึกษาพลวัตของกระแสโทเคนในระบบ
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Scope Defense */}
            <div className="arch-defense-card">
              <h3 className="arch-defense-title">ข้อชี้แจงขอบเขตทางวิชาการและข้อสมมุติฐานเชิงวิศวกรรม (Academic Clarifications)</h3>
              <div className="arch-defense-grid">
                <div className="arch-defense-item">
                  <strong>[1] การจำแนกประเภท: โมเดล Single-Player vs Contract ไม่ใช่ทฤษฎีเกม (Game Theory)</strong>
                  <p>
                    ในระบบเดิมที่มีนาฬิกานับถอยหลังแย่งตำแหน่งผู้เล่นคนสุดท้าย เกิดการแข่งขันเชิงกลยุทธ์ (Strategic Interaction &amp; Bluffing) จัดเป็น Game Theory อย่างแท้จริง 
                    แต่เมื่อเปลี่ยนมาเป็นวงล้อหมุนสุ่มรับเงินทันที การมีปฏิสัมพันธ์เชิงกลยุทธ์ระหว่างผู้เล่นถูกตัดออก ระบบนี้จึงจัดเป็น <em>Single-Player vs House Contract</em> 
                    มุ่งเน้นศึกษาด้าน <strong>DeFi Solvency และ Invariant Management</strong> ไม่ใช่ Game Theory
                  </p>
                </div>

                <div className="arch-defense-item">
                  <strong>[2] การประเมินความเสี่ยงตามจริงแทนการใช้ภาษาชวนเชื่อ (No Marketing Fluff)</strong>
                  <p>
                    ในเชิงวิศวกรรมคอมพิวเตอร์ ไม่มีระบบบนบล็อกเชนใดที่การันตี &ldquo;Zero Default Risk&rdquo; ได้ 100% ตราบใดที่ยังมีความเสี่ยงจาก Smart Contract Bugs, 
                    Reentrancy, Chain Reorganization, หรือ Oracle Liveness Failure ระบบนี้จึงนำเสนอในรูปแบบ <em>Mathematical Solvency Invariant</em> 
                    ภายใต้ข้อกำหนดการทำงานปกติ พร้อมกลไกบรรเทาความเสี่ยง (Timeout Fallback, SafeERC20, ReentrancyGuard)
                  </p>
                </div>

                <div className="arch-defense-item">
                  <strong>[3] ระบบกระจายสภาพคล่องที่มีการดูดซับอุปทาน (Liquidity Redistribution with Token Sink)</strong>
                  <p>
                    ระบบมีการโอน 5% ของ Entry Fee ไปยัง Dead Address (Token Sink) เพื่อลดอุปทานหมุนเวียนอย่างถาวร 
                    และมีการเติมเงินประเดิมจาก Treasury ในตอนต้น จึงไม่ใช่ระบบวงปิดสมบูรณ์ (Pure Closed-loop) 
                    แต่เป็นแบบจำลองการกระจายสภาพคล่องที่มีการดูดซับอุปทาน
                  </p>
                </div>

                <div className="arch-defense-item">
                  <strong>[4] คุณค่าทางวิศวกรรมที่แท้จริง</strong>
                  <p>
                    จุดเด่นไม่ใช่เพียงการเรียก Chainlink VRF แต่คือการพิสูจน์ว่าในสภาวะที่มีคำขอสุ่มหลายรายการค้างอยู่พร้อมกันแบบอะซิงโครนัส 
                    สัญญาอัจฉริยะสามารถรักษาสภาพคล่องได้อย่างเข้มงวดโดยไม่เกิดสภาวะหนี้สูญหรือการล้มละลาย (Insolvency Prevention)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ══ Section 2 ══ */}
          <section id="section-2" className="arch-section">
            <div className="arch-section-number">02</div>
            <h2 className="arch-section-title">
              แบบจำลอง Solvency Invariant และกลไก Pre-locking
              <span className="arch-en">Solvency Invariant &amp; Maximum Liability Pre-locking</span>
            </h2>

            <h3 className="arch-h3">
              2.1 สมการ Solvency Invariant
              <span className="arch-en">Contract Solvency Invariant</span>
            </h3>
            <p>
              สัญญาอัจฉริยะบังคับ Invariant ต่อไปนี้ให้เป็นจริงในทุก State Transition:
            </p>
            <div className="arch-formula-block">
              <div className="arch-formula">
                <code>Contract Balance ≥ Total Liabilities</code>
              </div>
              <div className="arch-formula-detail">
                <p className="arch-formula-label">
                  Total Liabilities คือผลรวมของ Liability ทั้ง 5 ประเภทที่สัญญาติดตามแยกกัน:
                </p>
                <ul className="arch-formula-list">
                  <li><code>availableSlotReserve</code> — กองทุนสล็อตที่พร้อมรับคำขอใหม่</li>
                  <li><code>reservedSlotLiability</code> — เงินที่ Pre-lock ไว้รองรับคำขอที่ยังรอผล VRF</li>
                  <li><code>totalPendingSlotRewards</code> — รางวัลที่คำนวณแล้วแต่ยังไม่ได้ถอน</li>
                  <li><code>rolloverReserve</code> — เงินสำรองสำหรับรอบถัดไป</li>
                  <li><code>tokenSinkAllocation</code> — ส่วนที่จัดสรรสำหรับ Deflationary Burn</li>
                </ul>
              </div>
            </div>

            <h3 className="arch-h3">
              2.2 กลไก Maximum Liability Pre-locking
              <span className="arch-en">Pre-lock Pattern</span>
            </h3>
            <p>
              เพื่อรับประกัน Solvency Invariant ในช่วงเวลาที่ผลสุ่มยังไม่กลับมา (VRF Pending State)
              ระบบใช้ Pre-lock Pattern ดังนี้:
            </p>
            <div className="arch-steps">
              <div className="arch-step">
                <div className="arch-step-num">Step 1</div>
                <div>
                  <strong>Pre-lock ก่อนส่งคำขอ:</strong> สัญญาโอน R<sub>max</sub> = 50 PIGGY
                  {" "}จาก <code>availableSlotReserve</code> ไปยัง <code>reservedSlotLiability</code> ทันที
                  เพื่อให้ Contract Balance ยังคงรองรับ Worst-case ได้แม้ยังไม่ทราบผล
                </div>
              </div>
              <div className="arch-step">
                <div className="arch-step-num">Step 2</div>
                <div>
                  <strong>Settlement เมื่อทราบ R<sub>actual</sub>:</strong><br />
                  <code>reservedSlotLiability ← reservedSlotLiability − R<sub>max</sub></code><br />
                  <code>availableSlotReserve ← availableSlotReserve + (R<sub>max</sub> − R<sub>actual</sub>)</code>
                </div>
              </div>
              <div className="arch-step">
                <div className="arch-step-num">Step 3</div>
                <div>
                  <strong>Credit รางวัลผู้ชนะ (Pull-Payment):</strong>{" "}
                  <code>pendingRewards[user] ← pendingRewards[user] + R<sub>actual</sub></code>
                </div>
              </div>
            </div>

            <h3 className="arch-h3">
              2.3 ตารางการกระจายรางวัลและการวิเคราะห์ Expected Value
              <span className="arch-en">Reward Distribution &amp; EV Analysis</span>
            </h3>
            <p>
              การกระจายรางวัลต่อค่าตั๋ว 10 PIGGY ถูกออกแบบให้ Expected Margin เป็นบวกเพื่อรองรับความผันผวนทางสถิติ:
            </p>
            <div className="arch-table-wrapper">
              <table className="arch-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>Outcome</th>
                    <th>Roll Range (0–9,999)</th>
                    <th>P</th>
                    <th>Payout (R)</th>
                    <th>E = P × R</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="arch-badge arch-badge-none">No Reward</span></td>
                    <td>ไม่ได้รับรางวัล</td>
                    <td>0 – 7,999</td>
                    <td>80.00%</td>
                    <td>0 PIGGY</td>
                    <td>0.000</td>
                  </tr>
                  <tr>
                    <td><span className="arch-badge arch-badge-small">Small</span></td>
                    <td>คืนทุน (Break-even)</td>
                    <td>8,000 – 9,499</td>
                    <td>15.00%</td>
                    <td>10 PIGGY</td>
                    <td>1.500</td>
                  </tr>
                  <tr>
                    <td><span className="arch-badge arch-badge-medium">Medium</span></td>
                    <td>2× Entry Fee</td>
                    <td>9,500 – 9,949</td>
                    <td>4.50%</td>
                    <td>20 PIGGY</td>
                    <td>0.900</td>
                  </tr>
                  <tr className="arch-table-highlight">
                    <td><span className="arch-badge arch-badge-large">Large</span></td>
                    <td>R<sub>max</sub> (Jackpot)</td>
                    <td>9,950 – 9,999</td>
                    <td>0.50%</td>
                    <td>50 PIGGY</td>
                    <td>0.250</td>
                  </tr>
                  <tr className="arch-table-total">
                    <td colSpan={3}><strong>รวม / Total</strong></td>
                    <td><strong>100.00%</strong></td>
                    <td>—</td>
                    <td><strong>EV = 2.650</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="arch-formula-block arch-margin-top">
              <div className="arch-formula">
                <code>Expected Slot Margin = Slot Allocation − EV = 3.00 − 2.65 = +0.350 PIGGY/play</code>
              </div>
              <p className="arch-formula-label">
                จาก Entry Fee 10 PIGGY ส่วนที่จัดสรรเข้า Slot Reserve คือ 3.00 PIGGY
                Expected Margin +0.350 PIGGY/play ทำให้ Reserve เติบโตในระยะยาวตามกฎของจำนวนมาก (Law of Large Numbers)
                รองรับความผันผวนทางสถิติในระยะสั้น
              </p>
            </div>
          </section>

          {/* ══ Section 3 ══ */}
          <section id="section-3" className="arch-section">
            <div className="arch-section-number">03</div>
            <h2 className="arch-section-title">
              การประสานงานผลสุ่มแบบอะซิงโครนัส
              <span className="arch-en">Asynchronous VRF Coordination — Chainlink VRF v2.5</span>
            </h2>
            <p>
              ระบบหลีกเลี่ยงการพึ่งพาตัวแปรที่คาดเดาได้บนบล็อกเชน (<code>block.timestamp</code>,{" "}
              <code>blockhash</code>) ซึ่งเสี่ยงต่อการ Manipulate โดย Miner
              และใช้ <strong>Request-Fulfill Pattern</strong> แบบ 2 Transaction แทน:
            </p>
            <div className="arch-flow">
              <div className="arch-flow-node arch-flow-node-user">
                <div className="arch-flow-icon-plain">TX 1</div>
                <div>
                  <strong>play() — User Transaction</strong>
                  <p>โอน 10 PIGGY Entry Fee + Pre-lock 50 PIGGY ไปยัง <code>reservedSlotLiability</code></p>
                </div>
              </div>
              <div className="arch-flow-arrow">
                <span className="arch-flow-label">เรียก <code>requestRandomWords()</code> ไปยัง VRF Coordinator</span>
              </div>
              <div className="arch-flow-node arch-flow-node-vrf">
                <div className="arch-flow-icon-plain">VRF</div>
                <div>
                  <strong>Chainlink VRF Coordinator</strong>
                  <p>Off-chain Oracle node คำนวณ Verifiable Random Function Proof ทางคณิตศาสตร์</p>
                </div>
              </div>
              <div className="arch-flow-arrow arch-flow-arrow-return">
                <span className="arch-flow-label">ส่ง Cryptographic Proof + Random Words กลับผ่าน Callback</span>
              </div>
              <div className="arch-flow-node arch-flow-node-callback">
                <div className="arch-flow-icon-plain">TX 2</div>
                <div>
                  <strong>fulfillRandomWords() — Callback Transaction</strong>
                  <ul className="arch-flow-steps">
                    <li>Idempotency check: ตรวจสอบสถานะ <code>requestId</code> ป้องกัน Double-Settle</li>
                    <li>Settlement: ปลดล็อก Reserve + คำนวณ Payout tier</li>
                    <li>Credit: บันทึกรางวัลใน <code>pendingRewards[user]</code></li>
                  </ul>
                </div>
              </div>
              <div className="arch-flow-arrow">
                <span className="arch-flow-label">ผู้เล่นเรียก <code>claimReward()</code> เพื่อถอนรางวัล</span>
              </div>
              <div className="arch-flow-node arch-flow-node-result">
                <div className="arch-flow-icon-plain">OK</div>
                <div>
                  <strong>Pending Rewards — Pull-Payment Complete</strong>
                </div>
              </div>
            </div>
            <div className="arch-info-box">
              <strong>Late Callback &amp; Timeout Protection:</strong>
              <p>
                คำขอทุกชุดถูกกำกับด้วย <code>requestId</code> ที่มีสถานะ <code>REQUESTED</code>
                หาก Callback ล่าช้าเกิน Timeout ที่กำหนด สัญญาจะ Expire คำขอนั้น
                ปลดล็อก <code>reservedSlotLiability</code> กลับคืน เพื่อป้องกันเงินค้างล็อกไม่มีกำหนด
              </p>
            </div>
          </section>

          {/* ══ Section 4 ══ */}
          <section id="section-4" className="arch-section">
            <div className="arch-section-number">04</div>
            <h2 className="arch-section-title">
              รูปแบบความปลอดภัยของสัญญาอัจฉริยะ
              <span className="arch-en">Smart Contract Security Patterns</span>
            </h2>
            <div className="arch-security-grid">
              <div className="arch-security-card">
                <div className="arch-security-label">Pattern 1</div>
                <h3>Checks-Effects-Interactions (CEI)</h3>
                <p>
                  ทุกฟังก์ชันอัปเดต Storage State ให้สมบูรณ์ก่อนส่ง External Call หรือโอนโทเคนออก
                  ป้องกัน Reentrancy Attack ที่ผู้โจมตีเรียก Callback กลับมาก่อนที่ State จะอัปเดตเสร็จ
                </p>
              </div>
              <div className="arch-security-card">
                <div className="arch-security-label">Pattern 2</div>
                <h3>Pull-Payment Pattern</h3>
                <p>
                  รางวัลถูกบันทึกใน <code>pendingRewards[address]</code> แทนการ Push โอนตรงในขณะคำนวณผล
                  ป้องกัน Denial-of-Service จากผู้รับที่ Revert และป้องกัน Reentrancy
                  ผู้เล่นต้องเรียก <code>claimReward()</code> เองเพื่อถอน
                </p>
              </div>
              <div className="arch-security-card">
                <div className="arch-security-label">Pattern 3</div>
                <h3>SafeERC20 &amp; Exact Receipt Verification</h3>
                <p>
                  สัญญาตรวจสอบ Balance ก่อนและหลังโอน และ Assert ผลต่างตรงกับจำนวนที่ส่ง
                  ป้องกัน Fee-on-transfer Token ที่อาจทำให้ยอดรับน้อยกว่าที่โอน
                </p>
              </div>
              <div className="arch-security-card arch-security-card-highlight">
                <div className="arch-security-label">Pattern 4</div>
                <h3>Selective Pause — Asymmetric Emergency Stop</h3>
                <p>
                  ฟังก์ชัน <code>pause()</code> ระงับเฉพาะ <code>play()</code> (ไม่รับ Risk ใหม่)
                  แต่ <code>claimReward()</code> ยังทำงานได้ตลอดเวลา
                  ไม่มี Admin Withdrawal path สำหรับดึง User Liability ออกไป
                </p>
              </div>
            </div>
          </section>

          {/* ══ Section 5 ══ */}
          <section id="section-5" className="arch-section">
            <div className="arch-section-number">05</div>
            <h2 className="arch-section-title">
              สถาปัตยกรรมระบบข้อมูลและแหล่งข้อมูลหลัก
              <span className="arch-en">Data Architecture &amp; Source of Truth</span>
            </h2>
            <div className="arch-data-stack">
              <div className="arch-data-layer">
                <div className="arch-data-label">Layer 1<br />Canonical State</div>
                <div className="arch-data-content">
                  <strong>On-chain Smart Contract — Single Source of Truth</strong>
                  <p>
                    สัญญาอัจฉริยะบน BNB Smart Chain เป็นฐานข้อมูลหลักที่มีผลผูกพันทางบัญชี
                    ทุก State Transition บันทึกถาวรและตรวจสอบได้สาธารณะ
                  </p>
                </div>
              </div>
              <div className="arch-data-layer">
                <div className="arch-data-label">Layer 2<br />Real-time Reads</div>
                <div className="arch-data-content">
                  <strong>Direct RPC Reads via Wagmi/Viem</strong>
                  <p>
                    Frontend ดึงข้อมูล Round State, Balance, และ Pending Rewards โดยตรงจาก Node RPC
                    โดยไม่ผ่านฐานข้อมูล Off-chain เพื่อรับประกันความสอดคล้องกับ On-chain State
                  </p>
                </div>
              </div>
              <div className="arch-data-layer">
                <div className="arch-data-label">Layer 3<br />Historical Index</div>
                <div className="arch-data-content">
                  <strong>The Graph Indexer — Decentralized Event Index</strong>
                  <p>
                    จับ On-chain Events (เช่น <code>SlotPlayed</code>, <code>RewardClaimed</code>)
                    เพื่อประมวลผลกระดานสถิติย้อนหลังและ Leaderboard
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
