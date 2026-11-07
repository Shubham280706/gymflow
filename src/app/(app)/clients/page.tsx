import Link from "next/link";
import { requireGym } from "@/lib/auth";
import { inr, todayIST } from "@/lib/format";
import { dueText, memberState, whatsappLink, type MemberState } from "@/lib/members";
import AddMemberDialog from "@/components/AddMemberDialog";
import Avatar from "@/components/Avatar";
import CycleBar from "@/components/CycleBar";
import StatusPill from "@/components/StatusPill";
import { IconChat, IconSearch } from "@/components/Icons";

export const metadata = { title: "Members" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "due-soon", label: "Due soon" },
  { key: "active", label: "On track" },
  { key: "inactive", label: "Paused or left" },
] as const;

const matches = (filter: string, s: MemberState) =>
  filter === "all" ? true : filter === "inactive" ? s === "paused" || s === "left" : s === filter;

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const { q = "", filter = "all" } = await searchParams;
  const { supabase } = await requireGym();
  const today = todayIST();

  const [{ data: clients }, { data: plans }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone, status, next_due_date, plans(name, duration_days)")
      .order("next_due_date"),
    supabase.from("plans").select("id, name, price_paise").eq("active", true).order("created_at"),
  ]);

  const all = (clients ?? []).map((c) => {
    const plan = Array.isArray(c.plans) ? c.plans[0] : c.plans;
    return { ...c, plan, ...memberState(c, today) };
  });
  const needle = q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const searched = needle
    ? all.filter((c) => c.name.toLowerCase().includes(needle) || (digits && c.phone.includes(digits)))
    : all;
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, searched.filter((c) => matches(f.key, c.state)).length]));
  const list = searched.filter((c) => matches(filter, c.state));

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="h-display text-4xl font-bold md:text-5xl">Members</h1>
        <AddMemberDialog
          today={today}
          plans={(plans ?? []).map((p) => ({ id: p.id, name: p.name, price: inr(p.price_paise) }))}
        />
      </div>

      <form role="search" className="relative">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
        <input type="hidden" name="filter" value={filter} />
        <input
          name="q"
          defaultValue={q}
          type="search"
          aria-label="Search members by name or number"
          placeholder="Search by name or number"
          className="input pl-11"
        />
      </form>

      <nav aria-label="Filter members" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <Link
              key={f.key}
              href={`/clients?filter=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={on ? "true" : undefined}
              className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold ${
                on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:bg-line-2"
              }`}
            >
              {f.label}
              <span className={`num text-[13px] ${on ? "text-white/70" : "text-ink-3"}`}>{counts[f.key]}</span>
            </Link>
          );
        })}
      </nav>

      {all.length === 0 ? (
        <div className="panel px-6 py-14 text-center">
          <p className="h-display text-3xl font-semibold">No members yet</p>
          <p className="mx-auto mt-2 max-w-[40ch] text-ink-2">
            Add your first member and GymFlow will bill them on their joining date and remind them when a fee is due.
          </p>
        </div>
      ) : list.length === 0 ? (
        <div className="panel px-6 py-12 text-center text-ink-2">No members match. Try a different search or filter.</div>
      ) : (
        <ul className="panel divide-y divide-line-2 overflow-hidden">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-2 pr-3 hover:bg-paper/60">
              <Link href={`/clients/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 md:pl-5">
                <Avatar name={c.name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{c.name}</p>
                    <StatusPill kind={c.state} />
                  </div>
                  <CycleBar state={c.state} daysLeft={c.daysLeft} totalDays={c.plan?.duration_days ?? 30} className="my-2 max-w-md" />
                  <p className="truncate text-[13px] text-ink-3">
                    {c.plan?.name ?? "No plan"} &middot; {c.state === "paused" || c.state === "left" ? "Not billed" : dueText(c.daysLeft)} &middot; +{c.phone}
                  </p>
                </div>
              </Link>
              <a
                href={whatsappLink(c.phone)}
                target="_blank"
                rel="noreferrer"
                aria-label={`Message ${c.name} on WhatsApp`}
                className="btn btn-quiet size-10 shrink-0 px-0"
              >
                <IconChat width={18} height={18} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
