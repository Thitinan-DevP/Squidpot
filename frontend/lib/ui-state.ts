export type UiState =
  | "DISCONNECTED" | "WRONG_NETWORK" | "CONTRACT_NOT_CONFIGURED" | "READY_TO_APPROVE"
  | "APPROVAL_PENDING" | "READY_TO_PLAY" | "PLAY_WALLET_CONFIRMATION" | "PLAY_TRANSACTION_PENDING"
  | "VRF_WAITING" | "VRF_FULFILLED" | "VRF_EXPIRED" | "ROUND_EXPIRED" | "SETTLEMENT_PENDING"
  | "CLAIM_PENDING" | "TRANSACTION_REJECTED" | "TRANSACTION_FAILED" | "PAUSED"
  | "INSUFFICIENT_SLOT_CAPACITY" | "CONTRACT_NOT_INITIALIZED";

export const uiStateMessages: Record<UiState, string> = {
  DISCONNECTED: "ขั้นแรก เชื่อมต่อกระเป๋าเพื่อดูยอด PIGGY และเริ่มเล่น",
  WRONG_NETWORK: "เปลี่ยนเครือข่ายในกระเป๋าเป็นเครือข่ายทดลอง BNB Smart Chain ก่อนทำรายการ",
  CONTRACT_NOT_CONFIGURED: "ระบบยังเชื่อมต่อสัญญาไม่สำเร็จ กรุณาตั้งค่าเครือข่ายทดลองก่อนใช้งาน",
  READY_TO_APPROVE: "ขั้นต่อไป อนุมัติให้สัญญาใช้ 10 PIGGY เพื่อเล่นหนึ่งครั้ง",
  APPROVAL_PENDING: "ส่งคำขออนุมัติแล้ว กรุณารอเครือข่ายยืนยัน คำขอนี้ยังไม่ใช่การเล่น",
  READY_TO_PLAY: "พร้อมแล้ว กดปุ่มเล่นได้ ระบบจะนับรายการเมื่อเครือข่ายยืนยันเท่านั้น",
  PLAY_WALLET_CONFIRMATION: "กรุณายืนยันการเล่น 10 PIGGY ในกระเป๋า ยังไม่มีการหักเหรียญหรือสุ่มรางวัล",
  PLAY_TRANSACTION_PENDING: "ส่งรายการเล่นแล้ว กำลังรอเครือข่ายยืนยัน",
  VRF_WAITING: "ยืนยันการเล่นแล้ว กำลังรอ Chainlink สุ่มผล ยังไม่ทราบรางวัล",
  VRF_FULFILLED: "สุ่มผลเสร็จแล้ว รางวัลนี้อ่านจากสัญญาบนเครือข่ายโดยตรง",
  VRF_EXPIRED: "คำขอสุ่มหมดเวลา ระบบไม่ได้คืนค่าเล่น 10 PIGGY และไม่มีรางวัลจากคำขอนี้",
  ROUND_EXPIRED: "หมดเวลารอบแล้ว ใครก็ได้สามารถปิดรอบได้ ผู้เล่นคนสุดท้ายที่บันทึกไว้จะได้รับสิทธิ์รับรางวัล",
  SETTLEMENT_PENDING: "ส่งคำขอปิดรอบแล้ว กำลังรอเครือข่ายยืนยัน",
  CLAIM_PENDING: "ส่งคำขอรับ PIGGY แล้ว ยอดจะเปลี่ยนเมื่อเครือข่ายยืนยัน",
  TRANSACTION_REJECTED: "คุณยกเลิกรายการในกระเป๋า ไม่มีการยืนยันธุรกรรม",
  TRANSACTION_FAILED: "ทำรายการไม่สำเร็จ ตรวจสอบเครือข่ายและยอด tBNB สำหรับค่าธรรมเนียม แล้วลองอีกครั้ง",
  PAUSED: "ระบบพักการเล่นชั่วคราว ยังเล่นรอบใหม่ไม่ได้ แต่ตรวจสอบยอดและปิดรอบได้ตามสถานะสัญญา",
  INSUFFICIENT_SLOT_CAPACITY: "ระบบยังไม่พร้อมรับรายการเล่นใหม่ สัญญาจะไม่เก็บค่าเล่นของรายการที่ถูกปฏิเสธ",
  CONTRACT_NOT_INITIALIZED: "คลัง PIGGY ยังไม่ได้เริ่มระบบ จึงยังเล่นไม่ได้",
};

export const uiStateTitles: Record<UiState, string> = {
  DISCONNECTED: "เชื่อมต่อกระเป๋า",
  WRONG_NETWORK: "เปลี่ยนเครือข่าย",
  CONTRACT_NOT_CONFIGURED: "ระบบยังไม่พร้อมใช้งาน",
  READY_TO_APPROVE: "อนุมัติ PIGGY ก่อนเล่น",
  APPROVAL_PENDING: "กำลังรออนุมัติ",
  READY_TO_PLAY: "พร้อมเล่น",
  PLAY_WALLET_CONFIRMATION: "รอยืนยันในกระเป๋า",
  PLAY_TRANSACTION_PENDING: "กำลังยืนยันรายการเล่น",
  VRF_WAITING: "กำลังสุ่มผล",
  VRF_FULFILLED: "สุ่มผลเรียบร้อย",
  VRF_EXPIRED: "คำขอสุ่มหมดเวลา",
  ROUND_EXPIRED: "ถึงเวลาปิดรอบ",
  SETTLEMENT_PENDING: "กำลังปิดรอบ",
  CLAIM_PENDING: "กำลังส่งคำขอรับ PIGGY",
  TRANSACTION_REJECTED: "ยกเลิกรายการแล้ว",
  TRANSACTION_FAILED: "รายการไม่สำเร็จ",
  PAUSED: "พักการเล่นชั่วคราว",
  INSUFFICIENT_SLOT_CAPACITY: "รางวัลไม่พร้อมจ่าย",
  CONTRACT_NOT_INITIALIZED: "ระบบยังไม่เปิดรอบ",
};

export function roundPhaseText(phase: string): string {
  return ({ Waiting: "ยังไม่มีรอบ", Open: "กำลังเปิดรอบ", Expired: "หมดเวลารอบแล้ว" } as Record<string, string>)[phase]
    ?? "กำลังอ่านข้อมูล";
}

export function requestStatusText(status: string): string {
  return ({ NONE: "ยังไม่มีคำขอ", REQUESTED: "กำลังสุ่มผล", FULFILLED: "สุ่มผลแล้ว", EXPIRED: "หมดเวลา" } as Record<string, string>)[status]
    ?? "กำลังตรวจสอบ";
}

export function activityStatusText(status: string): string {
  return ({ SUBMITTED: "ส่งแล้ว · กำลังยืนยัน", CONFIRMED: "ยืนยันแล้ว", REJECTED: "ยกเลิกแล้ว", FAILED: "ไม่สำเร็จ" } as Record<string, string>)[status]
    ?? "กำลังตรวจสอบ";
}

export function friendlyWalletError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const code = typeof error === "object" && error !== null && "code" in error
    ? (error as { code?: number }).code : undefined;
  if (/ไม่พบกระเป๋า|no connector|connector not found/i.test(message)) {
    return "ไม่พบกระเป๋า Web3 (เช่น MetaMask) ในเบราว์เซอร์ กรุณาติดตั้งส่วนขยายกระเป๋าเงินก่อน";
  }
  if (code === 4001 || /user rejected|denied transaction|request rejected|user denied/i.test(message)) {
    return "ยกเลิกคำขอในกระเป๋าแล้ว หากต้องการทำรายการให้กดปุ่มอีกครั้ง";
  }
  if (/insufficient funds|insufficient balance/i.test(message)) {
    return "ยอด tBNB ไม่พอจ่ายค่าธรรมเนียม เติม BNB Testnet ในกระเป๋าแล้วลองอีกครั้ง";
  }
  if (/chain|network/i.test(message)) {
    return "เครือข่ายในกระเป๋าไม่ตรง กรุณาเลือกเครือข่ายทดลอง BNB Smart Chain";
  }
  return "กระเป๋าทำรายการไม่สำเร็จ ตรวจสอบเครือข่ายแล้วลองอีกครั้ง";
}

export type DerivedInputs = {
  configured: boolean;
  connected: boolean;
  correctNetwork: boolean;
  transactionState?: UiState;
  allowance?: bigint;
  entryFee?: bigint;
  paused?: boolean;
  reserve?: bigint;
  maxReward?: bigint;
  activeRequests?: bigint;
  maxRequests?: bigint;
  roundExpired?: boolean;
  fundingInitialized?: boolean;
  requestStatus?: string;
};

export function deriveUiState(input: DerivedInputs): UiState {
  if (!input.configured) return "CONTRACT_NOT_CONFIGURED";
  if (!input.connected) return "DISCONNECTED";
  if (!input.correctNetwork) return "WRONG_NETWORK";
  if (input.transactionState) return input.transactionState;
  if (input.paused) return "PAUSED";
  if (input.roundExpired) return "ROUND_EXPIRED";
  if (input.requestStatus === "REQUESTED") return "VRF_WAITING";
  if (input.requestStatus === "FULFILLED") return "VRF_FULFILLED";
  if (input.requestStatus === "EXPIRED") return "VRF_EXPIRED";
  if (input.reserve !== undefined && input.maxReward !== undefined && input.activeRequests !== undefined && input.maxRequests !== undefined
    && (input.reserve < input.maxReward || input.activeRequests >= input.maxRequests)) return "INSUFFICIENT_SLOT_CAPACITY";
  if (input.allowance !== undefined && input.entryFee !== undefined && input.allowance < input.entryFee) return "READY_TO_APPROVE";
  if (input.fundingInitialized === false) return "CONTRACT_NOT_INITIALIZED";
  return "READY_TO_PLAY";
}

export function transactionErrorState(error: unknown): "TRANSACTION_REJECTED" | "TRANSACTION_FAILED" {
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 4001) {
    return "TRANSACTION_REJECTED";
  }
  if (error instanceof Error && /user rejected|denied transaction|request rejected|user denied/i.test(error.message)) {
    return "TRANSACTION_REJECTED";
  }
  return "TRANSACTION_FAILED";
}
