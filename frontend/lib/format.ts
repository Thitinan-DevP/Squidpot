import { formatUnits, type Hex } from "viem";

export function formatPiggy(value: bigint | undefined): string {
  if (value === undefined) return "—";
  return `${formatUnits(value, 18)} PIGGY`;
}

export function shortAddress(address: string | undefined): string {
  if (!address) return "ยังไม่ได้เชื่อมต่อ";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatCountdown(deadline: bigint | undefined, blockTimestamp: bigint | undefined): string | null {
  if (!deadline || deadline === BigInt(0) || blockTimestamp === undefined) return null;
  const remaining = deadline > blockTimestamp ? deadline - blockTimestamp : BigInt(0);
  const seconds = Number(remaining);
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function formatChainTimestamp(timestamp: bigint | undefined): string {
  if (timestamp === undefined || timestamp === BigInt(0)) return "—";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" })
    .format(Number(timestamp) * 1000);
}

export type SessionActivity = {
  id: string;
  action: "play" | "approve" | "settle" | "claim-slot" | "claim-previous" | "claim-prize";
  status: "SUBMITTED" | "CONFIRMED" | "REJECTED" | "FAILED";
  hash?: Hex;
  requestId?: string;
  observedAt: number;
};

const STORAGE_KEY = "squidpot.session-activity.v1";
const serverActivity: SessionActivity[] = [];
let activitySnapshot: SessionActivity[] | undefined;
const activityListeners = new Set<() => void>();

export function readSessionActivity(): SessionActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is SessionActivity => {
      if (typeof item !== "object" || item === null) return false;
      const row = item as Record<string, unknown>;
      return typeof row.id === "string" && typeof row.observedAt === "number"
        && ["play", "approve", "settle", "claim-slot", "claim-previous", "claim-prize"].includes(String(row.action))
        && ["SUBMITTED", "CONFIRMED", "REJECTED", "FAILED"].includes(String(row.status));
    }) : [];
  } catch {
    return [];
  }
}

export function getSessionActivitySnapshot(): SessionActivity[] {
  if (activitySnapshot === undefined) activitySnapshot = readSessionActivity();
  return activitySnapshot;
}

export function getServerSessionActivitySnapshot(): SessionActivity[] {
  return serverActivity;
}

export function subscribeSessionActivity(listener: () => void): () => void {
  activityListeners.add(listener);
  return () => activityListeners.delete(listener);
}

export function createSessionActivity(entry: Omit<SessionActivity, "id" | "observedAt"> & { id?: string }): SessionActivity {
  const generatedId = entry.id ?? `${entry.action}:${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
  return { ...entry, id: generatedId, observedAt: Date.now() };
}

export function addSessionActivity(entry: SessionActivity): SessionActivity[] {
  const entries = [entry, ...getSessionActivitySnapshot().filter((current) => current.id !== entry.id)].slice(0, 20);
  if (typeof window !== "undefined") window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  activitySnapshot = entries;
  activityListeners.forEach((listener) => listener());
  return entries;
}
