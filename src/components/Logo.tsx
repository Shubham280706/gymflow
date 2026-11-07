import { IconDumbbell } from "./Icons";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid size-8 place-items-center rounded-[9px] bg-ink text-white">
        <IconDumbbell width={18} height={18} />
      </span>
      <span className="h-display text-[22px] font-bold">GymFlow</span>
    </span>
  );
}
