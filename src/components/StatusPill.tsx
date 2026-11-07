const STYLES = {
  active: "bg-ok-soft text-ok-ink",
  paid: "bg-ok-soft text-ok-ink",
  pending: "bg-warn-soft text-warn-ink",
  "due-soon": "bg-warn-soft text-warn-ink",
  overdue: "bg-bad-soft text-bad-ink",
  paused: "bg-line-2 text-ink-2",
  left: "bg-line-2 text-ink-3",
} as const;

const LABELS: Record<keyof typeof STYLES, string> = {
  active: "Active",
  paid: "Paid",
  pending: "Pending",
  "due-soon": "Due soon",
  overdue: "Overdue",
  paused: "Paused",
  left: "Left",
};

export type PillKind = keyof typeof STYLES;

export default function StatusPill({ kind, label }: { kind: PillKind; label?: string }) {
  return (
    <span className={`pill ${STYLES[kind]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label ?? LABELS[kind]}
    </span>
  );
}
