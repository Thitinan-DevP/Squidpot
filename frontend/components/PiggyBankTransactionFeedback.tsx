"use client";

import { useReducedMotion } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";

type Props = { confirmedEventId?: string };

export function PiggyBankTransactionFeedback({ confirmedEventId }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <section className="card piggy-card" aria-labelledby="piggy-feedback-heading">
      <div className="section-heading">
        <div><p className="eyebrow">ภาพตอบรับหลังเล่น</p><h2 id="piggy-feedback-heading">ยืนยันการเล่น</h2></div>
        <span className={`status-pill ${confirmedEventId ? "status-ok" : "status-neutral"}`}>
          {confirmedEventId ? "ยืนยันแล้ว" : "ยังไม่มีรายการล่าสุด"}
        </span>
      </div>
      <div className="piggy-stage" aria-live="polite">
        {confirmedEventId && <div className="coin-rail" aria-hidden="true"><span /></div>}
        <AnimatePresence mode="wait">
          {confirmedEventId && !reduceMotion ? (
            <motion.div
              key={confirmedEventId}
              className="coin"
              aria-hidden="true"
              initial={{ opacity: 0, y: -30, scale: 0.78 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-30, 4, 40, 58], scale: [0.78, 1, 1, 0.72] }}
              transition={{ duration: 1.05, times: [0, 0.18, 0.72, 1], ease: "easeInOut" }}
            >P</motion.div>
          ) : null}
        </AnimatePresence>
        {confirmedEventId && reduceMotion && <p className="success-badge" role="status">ยืนยันการเล่นบนเครือข่ายแล้ว</p>}
        <motion.div
          key={confirmedEventId ? `bank-${confirmedEventId}` : "bank-static"}
          className="piggy-bank"
          aria-label="ภาพกระปุกออมสินประกอบ"
          initial={false}
          animate={confirmedEventId && !reduceMotion ? { scaleX: [1, 1.04, 0.98, 1], scaleY: [1, 0.96, 1.025, 1] } : { scaleX: 1, scaleY: 1 }}
          transition={{ duration: 0.42, delay: 0.82, ease: "easeOut" }}
        >
          <svg viewBox="0 0 180 112" role="img" aria-labelledby="bank-title">
            <title id="bank-title">ภาพกระปุกออมสิน</title>
            <path d="M52 33 42 19l24 8c13-5 31-5 45 0l18-8-3 23c9 9 11 23 4 34h-9v16h-17V81H74v11H57V76c-11-6-17-17-16-29l-9-8 20-6Z" fill="#D97A56" stroke="#8C4939" strokeWidth="5" strokeLinejoin="round" />
            <path d="M70 29V21h38v8" fill="none" stroke="#8C4939" strokeWidth="5" strokeLinecap="round" />
            <circle cx="113" cy="48" r="3.5" fill="#263238" />
            <path d="M134 57c7-2 9 4 4 8" fill="none" stroke="#8C4939" strokeWidth="4" strokeLinecap="round" />
            <path d="M76 54h18" stroke="#8C4939" strokeWidth="4" strokeLinecap="round" />
            <path d="M70 100h54" stroke="#E7B75A" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </div>
      <p className="muted">ภาพนี้ไม่ใช่ยอดเงินหรือรางวัล เหรียญจะเคลื่อนที่เมื่อเครือข่ายยืนยันการเล่นแล้วเท่านั้น</p>
    </section>
  );
}
