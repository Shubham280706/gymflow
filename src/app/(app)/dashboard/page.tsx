import Link from "next/link";
import { requireGym } from "@/lib/auth";
import { addDays, diffDays, fmtDateShort, hourIST, inr, monthKeyIST, todayIST } from "@/lib/format";
import { dueText, reminderText, whatsappLink } from "@/lib/members";
import Avatar from "@/components/Avatar";
import RevenueChart, { type Month } from "@/components/RevenueChart";
import { IconBell, IconChat } from "@/components/Icons";
import { sendReminderNow } from "../actions";

export const metadata = { title: "Home" };

const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export default async function Dashboard() {
  const { supabase, gym } = await requireGym();
  const today = todayIST();
  const [y, m] = today.split("-").map(Number);
  const sixAgo = new Date(Date.UTC(y, m - 6, 1)).toISOString().slice(0, 10);

  const [{ count: activeMembers }, { data: pending }, { data: paid }, { data: recent }] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("invoices")
      .select("id, amount_paise, due_date, clients(name, phone)")
      .eq("status", "pending")
      .order("due_date"),
    supabase.from("payments").select("amount_paise, paid_at").gte("paid_at", sixAgo + "T00:00:00+05:30"),
    supabase
      .from("payments")
      .select("id, amount_paise, method, paid_at, clients(name)")
      .order("paid_at", { ascending: false })
      .limit(5),
  ]);

  const pendingList = pending ?? [];
  const overdue = pendingList.filter((i) => i.due_date < today);
  const dueSoon = pendingList.filter((i) => i.due_date >= today && i.due_date <= addDays(today, 7));
  const attention = [...overdue, ...dueSoon].slice(0, 8);
  const sum = (rows: { amount_paise: number }[]) => rows.reduce((s, r) => s + r.amount_paise, 0);

  const byMonth = new Map<string, number>();
  for (const p of paid ?? []) {
    const k = monthKeyIST(p.paid_at);
    byMonth.set(k, (byMonth.get(k) ?? 0) + p.amount_paise);
  }
  const months: Month[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (5 - i), 1));
    const key = d.toISOString().slice(0, 7);
    return {
      label: d.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }),
      paise: byMonth.get(key) ?? 0,
      current: i === 5,
    };
  });
  const collected = byMonth.get(today.slice(0, 7)) ?? 0;
  const hour = hourIST();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <p className="text-sm text-ink-3">{new Date(today + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</p>
        <h1 className="h-display mt-1 text-4xl font-bold md:text-5xl">{greeting}</h1>
      </div>

      <section aria-label="Money" className="panel grid grid-cols-2 divide-line md:grid-cols-[1.3fr_1fr_1fr] md:divide-x">
        <div className="col-span-2 border-b border-line-2 p-5 md:col-span-1 md:border-b-0 md:p-6">
          <p className="text-sm font-semibold text-ink-2">Collected this month</p>
          <p className="num mt-1 text-6xl font-bold md:text-7xl">{inr(collected)}</p>
          <p className="mt-1 text-sm text-ink-3">{activeMembers ?? 0} active member{activeMembers === 1 ? "" : "s"}</p>
        </div>
        <div className="border-r border-line-2 p-5 md:border-r-0 md:p-6">
          <p className="text-sm font-semibold text-ink-2">Waiting to be paid</p>
          <p className="num mt-1 text-4xl font-bold md:text-5xl">{inr(sum(pendingList))}</p>
          <p className="mt-1 text-sm text-ink-3">{pendingList.length} fee{pendingList.length === 1 ? "" : "s"}</p>
        </div>
        <div className="p-5 md:p-6">
          <p className="text-sm font-semibold text-ink-2">Overdue</p>
          <p className={`num mt-1 text-4xl font-bold md:text-5xl ${overdue.length ? "text-bad" : ""}`}>{inr(sum(overdue))}</p>
          <p className="mt-1 text-sm text-ink-3">{overdue.length} member{overdue.length === 1 ? "" : "s"} late</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <section className="panel" aria-labelledby="attn">
          <div className="flex items-center justify-between px-5 pb-1 pt-5">
            <h2 id="attn" className="h-display text-2xl font-semibold">Needs attention</h2>
            <Link href="/invoices?status=pending" className="text-sm font-semibold text-accent-ink hover:underline">See all</Link>
          </div>
          {attention.length === 0 ? (
            <p className="px-5 pb-6 pt-2 text-[15px] text-ink-2">
              Nobody is late and nobody is due this week. New members you register will show up here when their fee is near.
            </p>
          ) : (
            <ul className="divide-y divide-line-2 pt-2">
              {attention.map((i) => {
                const c = first(i.clients);
                const days = diffDays(today, i.due_date);
                return (
                  <li key={i.id} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar name={c?.name ?? "?"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c?.name}</p>
                      <p className={`text-[13px] ${days < 0 ? "font-semibold text-bad-ink" : "text-warn-ink"}`}>
                        {dueText(days)} <span className="font-normal text-ink-3">&middot; {fmtDateShort(i.due_date)}</span>
                      </p>
                    </div>
                    <p className="num hidden text-xl font-semibold sm:block">{inr(i.amount_paise)}</p>
                    <div className="flex gap-1.5">
                      <a
                        href={whatsappLink(c?.phone ?? "", reminderText(c?.name ?? "", gym.name))}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Message ${c?.name} on WhatsApp`}
                        className="btn btn-quiet size-10 px-0"
                      >
                        <IconChat width={18} height={18} />
                      </a>
                      <form action={sendReminderNow}>
                        <input type="hidden" name="id" value={i.id} />
                        <button aria-label={`Send automatic reminder to ${c?.name}`} title="Queue an automatic reminder" className="btn btn-quiet size-10 px-0">
                          <IconBell width={18} height={18} />
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="panel p-5" aria-labelledby="rev">
            <h2 id="rev" className="h-display mb-4 text-2xl font-semibold">Last 6 months</h2>
            <RevenueChart months={months} />
          </section>

          <section className="panel" aria-labelledby="rec">
            <h2 id="rec" className="h-display px-5 pb-1 pt-5 text-2xl font-semibold">Recent payments</h2>
            {(recent ?? []).length === 0 ? (
              <p className="px-5 pb-6 pt-2 text-[15px] text-ink-2">Payments show up here the moment a member pays.</p>
            ) : (
              <ul className="divide-y divide-line-2 pt-2">
                {(recent ?? []).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{first(p.clients)?.name}</p>
                      <p className="text-[13px] capitalize text-ink-3">
                        {p.method} &middot; {fmtDateShort(new Date(Date.parse(p.paid_at) + 5.5 * 3600_000).toISOString().slice(0, 10))}
                      </p>
                    </div>
                    <p className="num text-xl font-semibold text-ok-ink">+{inr(p.amount_paise)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
