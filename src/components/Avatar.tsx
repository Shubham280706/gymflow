import { initials } from "@/lib/members";

// A stable tint per name so members are easy to tell apart in a list.
const TINTS = [
  "bg-accent-soft text-accent-ink",
  "bg-ok-soft text-ok-ink",
  "bg-warn-soft text-warn-ink",
  "bg-bad-soft text-bad-ink",
  "bg-line-2 text-ink-2",
];

export default function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const tint = TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`grid shrink-0 place-items-center rounded-full font-bold ${tint}`}
    >
      {initials(name)}
    </span>
  );
}
