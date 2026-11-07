// Dates are plain "YYYY-MM-DD" strings in IST. Money is in paise.

export function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
}

export function hourIST(): number {
  return new Date(Date.now() + 5.5 * 3600_000).getUTCHours();
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** whole days from `from` to `to` (positive when `to` is later) */
export function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);
}

export function inr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

/** ₹12.5k / ₹1.2L style, for chart labels */
export function inrCompact(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${+(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${+(r / 1000).toFixed(1)}k`;
  return `₹${Math.round(r)}`;
}

/** "2026-11" for an ISO timestamp, in IST */
export function monthKeyIST(iso: string): string {
  return new Date(Date.parse(iso) + 5.5 * 3600_000).toISOString().slice(0, 7);
}

export function fmtDateShort(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function fmtDate(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Accepts 9876543210, +91 98765 43210, 09876543210 -> 919876543210. Returns null if invalid. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return null;
}
