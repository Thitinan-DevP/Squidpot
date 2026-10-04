const allocations = [
  ["สะสมเป็นรางวัลประจำรอบ", "4.00 PIGGY"],
  ["สำรองจ่ายรางวัลสุ่ม", "3.00 PIGGY"],
  ["แบ่งให้ผู้เล่นก่อนหน้า", "1.50 PIGGY"],
  ["สะสมไว้รอบถัดไป", "1.00 PIGGY"],
  ["นำออกจากระบบตามกติกาสัญญา", "0.50 PIGGY"],
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
          <p className="eyebrow">เริ่มต้นใช้งาน</p>
          <h1>วิธีเล่น SquidPot</h1>
          <p>ทำตามทีละขั้น ระบบจะแสดงว่าต้องทำอะไรต่อ ทุกยอดและผลรางวัลอ่านจากสัญญาบนเครือข่ายจริง</p>
        </div>
        <div className="intro-stamp" aria-label="ค่าเล่นต่อครั้ง">
          <span className="stamp-label">ค่าเล่นต่อครั้ง</span>
          <strong>10 PIGGY</strong>
          <span>เครือข่ายทดลอง BNB Smart Chain</span>
        </div>
      </header>

      <section className="card">
        <h2>เล่นตาม 5 ขั้นตอน</h2>
        <ol className="how-steps">
          <li><strong>เชื่อมต่อกระเป๋า</strong><span>กด “เชื่อมต่อกระเป๋า” แล้วเลือกกระเป๋าที่ติดตั้งไว้ เช่น MetaMask</span></li>
          <li><strong>เลือกเครือข่ายทดลอง</strong><span>เปลี่ยนเป็นเครือข่ายทดลอง BNB Smart Chain เมื่อกระเป๋าถาม หรือกดปุ่มเปลี่ยนเครือข่ายในหน้าเว็บ</span></li>
          <li><strong>อนุมัติการใช้ PIGGY</strong><span>หากยังไม่ได้อนุมัติ ระบบจะแนะนำให้อนุมัติ 10 PIGGY ก่อนเริ่มหมุนวงล้อ</span></li>
          <li><strong>กดหมุน Spin for 10 PIGGY</strong><span>ยืนยันรายการในกระเป๋า แล้วรอเครือข่ายบันทึกรายการเล่น วงล้อจะเริ่มหมุนเมื่อรายการยืนยันแล้ว</span></li>
          <li><strong>รอผลสุ่มและกด Stop & Reveal</strong><span>วงล้อจะหมุนระหว่างรอผลสุ่ม Chainlink VRF v2.5 เมื่อยืนยันแล้วกด &ldquo;Stop &amp; Reveal&rdquo; เพื่อดูผล และกดรับรางวัล PIGGY ได้ทันที</span></li>
        </ol>
        <p className="inline-warning">ต้องมี PIGGY สำหรับค่าเล่น และ tBNB บนเครือข่ายทดลองสำหรับค่าธรรมเนียม</p>
      </section>

      <section className="card">
        <h2>เงิน 10 PIGGY ถูกแบ่งอย่างไร</h2>
        <p>สัญญาแบ่งค่าเล่นแต่ละครั้งตามกติกานี้ ยอดจริงตรวจสอบได้บนบล็อกเชน</p>
        <div className="table-wrap"><table><thead><tr><th scope="col">นำไปใช้</th><th scope="col">ต่อครั้ง</th></tr></thead><tbody>{allocations.map(([label, amount]) => <tr key={label}><th scope="row">{label}</th><td>{amount}</td></tr>)}</tbody></table></div>
        <p className="muted">หากยังไม่มีผู้เล่นก่อนหน้า หรือคนเดิมเล่นติดกัน ส่วนแบ่งผู้เล่นก่อนหน้าจะถูกสะสมไว้รอบถัดไป</p>
      </section>

      <details className="card advanced-rules">
        <summary>ดูโอกาสและกติกาโดยละเอียด</summary>
        <div className="details-content">
          <h2>โอกาสได้รับรางวัลจากการสุ่ม</h2>
          <p>ผลสุ่มมี 10,000 ระดับ ระบบจะยังไม่ทราบผลจนกว่า Chainlink VRF จะส่งผลกลับมายังสัญญา</p>
          <div className="table-wrap"><table><thead><tr><th scope="col">ผลสุ่ม</th><th scope="col">โอกาส</th><th scope="col">รางวัล</th></tr></thead><tbody>{tiers.map(([roll, probability, reward]) => <tr key={roll}><th scope="row">{roll}</th><td>{probability}</td><td>{reward}</td></tr>)}</tbody></table></div>
          <p>รางวัลที่แสดงจะกลายเป็นยอดรับได้หลังสัญญายืนยันผลเท่านั้น คำขอสุ่มที่หมดเวลาไม่ได้รับเงินค่าเล่นคืน</p>

          <h2>รอบและการรับรางวัลประจำรอบ</h2>
          <p>รอบเริ่มเมื่อมีคนเล่นครั้งแรก การเล่นครั้งต่อไปจะขยายเวลารอบได้ไม่เกิน 24 ชั่วโมง เมื่อหมดเวลา ใครก็ได้กดปิดรอบ แต่ผู้ปิดรอบไม่ได้เป็นผู้ชนะ สัญญาจะบันทึกผู้เล่นคนสุดท้ายเป็นผู้มีสิทธิ์รับรางวัลประจำรอบ</p>
          <p>การปิดรอบเป็นเพียงการบันทึกผล ผู้มีสิทธิ์ต้องไปกดรับ PIGGY แยกในหน้ากระเป๋า รางวัลจากการสุ่ม ส่วนแบ่งผู้เล่นก่อนหน้า และรางวัลประจำรอบเป็นคนละยอดกัน</p>

          <h2>ข้อจำกัดที่ควรรู้</h2>
          <ul className="plain-list">
            <li>โทเคน PIGGY ใช้บนเครือข่ายทดลองและไม่มีมูลค่าเงินจริง</li>
            <li>การใช้หลายกระเป๋าอาจหลบการตรวจการเล่นซ้ำจากกระเป๋าเดียวได้</li>
            <li>ระบบสุ่มและเวลารอเป็นการทดลอง ไม่ใช่การรับประกันผลหรือระยะเวลา</li>
          </ul>
        </div>
      </details>
    </article>
  );
}
