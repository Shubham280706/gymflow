import type { MemberState } from "@/lib/members";

const SEGMENTS = 12;

const FILL: Record<MemberState, string> = {
  active: "bg-ok",
  "due-soon": "bg-warn",
  overdue: "bg-bad",
  paused: "bg-ink-3",
  left: "bg-line",
};

/** How much of the membership period is left, as a row of small bars. */
export default function CycleBar({
  state,
  daysLeft,
  totalDays,
  className = "",
}: {
  state: MemberState;
  daysLeft: number;
  totalDays: number;
  className?: string;
}) {
  const ratio = totalDays > 0 ? Math.min(Math.max(daysLeft / totalDays, 0), 1) : 0;
  const filled = state === "overdue" || state === "left" ? 0 : Math.max(ratio > 0 ? 1 : 0, Math.round(ratio * SEGMENTS));
  return (
    <div
      role="img"
      aria-label={`${Math.max(daysLeft, 0)} of ${totalDays} days left`}
      className={`flex gap-[3px] ${className}`}
    >
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 rounded-[3px] ${i < filled ? FILL[state] : state === "overdue" ? "bg-bad-soft" : "bg-line-2"}`}
        />
      ))}
    </div>
  );
}
