import Link from "next/link";

export default function NotFound() {
  return (
    <section className="card config-state" aria-labelledby="not-found-title">
      <p className="eyebrow">ไม่พบหน้านี้</p>
      <h1 id="not-found-title">หน้านี้ไม่มีอยู่</h1>
      <p className="muted">ลิงก์อาจไม่ถูกต้อง หรือหน้านี้อาจถูกย้ายแล้ว</p>
      <Link className="button button-primary" href="/">กลับไปหน้าเล่นเกม</Link>
    </section>
  );
}
