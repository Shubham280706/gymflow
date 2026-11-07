import { inr, inrCompact } from "@/lib/format";

export type Month = { label: string; paise: number; current?: boolean };

/** Plain CSS bars: monthly money collected. */
export default function RevenueChart({ months }: { months: Month[] }) {
  const max = Math.max(...months.map((m) => m.paise), 1);
  return (
    <ol className="flex h-44 items-end gap-2 sm:gap-3" aria-label="Money collected per month">
      {months.map((m) => (
        <li key={m.label} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center" title={`${m.label}: ${inr(m.paise)}`}>
          <span className="num mb-1 text-[13px] font-semibold text-ink-2">{m.paise ? inrCompact(m.paise) : ""}</span>
          <span
            className={`block w-full rounded-t-[6px] ${m.current ? "bg-accent" : "bg-accent/25"}`}
            style={{ height: `${Math.max((m.paise / max) * 100, m.paise ? 4 : 1.5)}%`, minHeight: 3 }}
          />
          <span className={`mt-2 text-xs ${m.current ? "font-semibold text-ink" : "text-ink-3"}`}>{m.label}</span>
        </li>
      ))}
    </ol>
  );
}
