import { diffDays } from "./format";

export type MemberState = "overdue" | "due-soon" | "active" | "paused" | "left";

/** Where a member stands today. Only active members can be overdue or due soon. */
export function memberState(c: { status: string; next_due_date: string }, today: string): { state: MemberState; daysLeft: number } {
  const daysLeft = diffDays(today, c.next_due_date);
  if (c.status === "paused") return { state: "paused", daysLeft };
  if (c.status === "left") return { state: "left", daysLeft };
  if (daysLeft < 0) return { state: "overdue", daysLeft };
  if (daysLeft <= 7) return { state: "due-soon", daysLeft };
  return { state: "active", daysLeft };
}

export function dueText(daysLeft: number): string {
  if (daysLeft < 0) return `${-daysLeft} day${daysLeft === -1 ? "" : "s"} late`;
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "Due tomorrow";
  return `${daysLeft} days left`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function whatsappLink(phone: string, text?: string): string {
  return `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function reminderText(name: string, gym: string): string {
  return `Hi ${name}, a gentle reminder from ${gym} that your membership fee is pending. Please pay when you can. Thank you!`;
}
