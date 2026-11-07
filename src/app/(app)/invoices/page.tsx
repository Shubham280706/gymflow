import Link from "next/link";
import { requireGym } from "@/lib/auth";
import { diffDays, fmtDate, inr, todayIST } from "@/lib/format";
import { dueText } from "@/lib/members";
import Avatar from "@/components/Avatar";
import CopyButton from "@/components/CopyButton";
import StatusPill from "@/components/StatusPill";
import { IconBell, IconCheck } from "@/components/Icons";
import { markPaidCash, sendReminderNow } from "../actions";

export const metadata = { title: "Payments" };

const TABS = [
  { key: "pending", label: "Waiting" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
  { key: "all", label: "All" },
] as const;

const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const { supabase } = await requireGym();
  const today = todayIST();

  const { data } = await supabase
    .from("invoices")
    .select("id, client_id, amount_paise, due_date, status, paid_at, payment_link_url, clients(name, phone)")
    .neq("status", "cancelled")
    .order("due_date", { ascending: status === "pending" || status === "overdue" })
    .limit(300);
  const all = data ?? [];
  const isOverdue = (i: (typeof all)[number]) => i.status === "pending" && i.due_date < today;
  const counts = {
    pending: all.filter((i) => i.status === "pending").length,
    overdue: all.filter(isOverdue).length,
    paid: all.filter((i) => i.status === "paid").length,
    all: all.length,
  };
  const list = all.filter((i) =>
    status === "all" ? true : status === "paid" ? i.status === "paid" : status === "overdue" ? isOverdue(i) : i.status === "pending",
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <h1 className="h-display text-4xl font-bold md:text-5xl">Payments</h1>

      <nav aria-label="Filter payments" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {TABS.map((t) => {
          const on = status === t.key;
          return (
            <Link
              key={t.key}
              href={`/invoices?status=${t.key}`}
              aria-current={on ? "true" : undefined}
              className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold ${
                on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:bg-line-2"
              }`}
            >
              {t.label}
              <span className={`num text-[13px] ${on ? "text-white/70" : "text-ink-3"}`}>{counts[t.key]}</span>
            </Link>
          );
        })}
      </nav>

      {list.length === 0 ? (
        <div className="panel px-6 py-14 text-center">
          <p className="h-display text-3xl font-semibold">
            {status === "paid" ? "No payments yet" : status === "overdue" ? "Nobody is overdue" : "Nothing here"}
          </p>
          <p className="mx-auto mt-2 max-w-[42ch] text-ink-2">
            {status === "paid"
              ? "Paid fees appear here as soon as a member pays or you mark a cash payment."
              : "Fees are created automatically a few days before each member's due date."}
          </p>
        </div>
      ) : (
        <ul className="panel divide-y divide-line-2 overflow-hidden">
          {list.map((i) => {
            const c = first(i.clients);
            const late = isOverdue(i);
            return (
              <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 md:px-5">
                <Link href={`/clients/${i.client_id}`} className="flex min-w-0 flex-1 basis-52 items-center gap-3">
                  <Avatar name={c?.name ?? "?"} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c?.name}</p>
                    <p className={`text-[13px] ${late ? "font-semibold text-bad-ink" : "text-ink-3"}`}>
                      {i.status === "paid" ? `Due ${fmtDate(i.due_date)}` : `${dueText(diffDays(today, i.due_date))} · ${fmtDate(i.due_date)}`}
                    </p>
                  </div>
                </Link>
                <p className="num text-2xl font-semibold">{inr(i.amount_paise)}</p>
                <div className="w-[5.5rem] text-right">
                  <StatusPill kind={i.status === "paid" ? "paid" : late ? "overdue" : "pending"} />
                </div>
                {i.status === "pending" && (
                  <div className="flex w-full flex-wrap justify-end gap-2">
                    {i.payment_link_url && <CopyButton text={i.payment_link_url} />}
                    <form action={sendReminderNow}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn btn-quiet btn-sm"><IconBell width={16} height={16} /> Remind</button>
                    </form>
                    <form action={markPaidCash}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn btn-accent btn-sm"><IconCheck width={16} height={16} /> Mark paid in cash</button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
