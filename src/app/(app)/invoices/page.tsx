import Link from "next/link";
import { requireGym } from "@/lib/auth";
import { fmtDate, inr, todayIST } from "@/lib/format";
import CopyButton from "@/components/CopyButton";
import { markPaidCash, sendReminderNow } from "../actions";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
];

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const { supabase } = await requireGym();
  const today = todayIST();

  let q = supabase
    .from("invoices")
    .select("id, amount_paise, due_date, status, paid_at, payment_link_url, clients(name, phone)")
    .neq("status", "cancelled")
    .order("due_date", { ascending: false })
    .limit(200);
  if (status === "pending") q = q.eq("status", "pending");
  if (status === "overdue") q = q.eq("status", "pending").lt("due_date", today);
  if (status === "paid") q = q.eq("status", "paid");
  const { data: invoices } = await q;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Payments</h1>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/invoices?status=${t.key}`}
              className={`rounded-md px-3 py-1 text-sm ${status === t.key ? "bg-white shadow-sm" : "text-slate-600"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <ul className="card divide-y divide-slate-100 p-0">
        {(invoices ?? []).map((i) => {
          const c = Array.isArray(i.clients) ? i.clients[0] : i.clients;
          const overdue = i.status === "pending" && i.due_date < today;
          return (
            <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
              <div className="min-w-0 flex-1 basis-40">
                <div className="truncate font-medium">{c?.name}</div>
                <div className="text-xs text-slate-500">+{c?.phone}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">{inr(i.amount_paise)}</div>
                <div className="whitespace-nowrap text-xs text-slate-500">Due {fmtDate(i.due_date)}</div>
              </div>
              <div className="w-20 text-right">
                {i.status === "paid" ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Paid</span>
                ) : overdue ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">Overdue</span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Pending</span>
                )}
              </div>
              {i.status === "pending" && (
                <div className="flex w-full justify-end gap-1.5 sm:w-auto">
                  {i.payment_link_url && <CopyButton text={i.payment_link_url} />}
                  <form action={sendReminderNow}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="btn-secondary btn-sm">Remind</button>
                  </form>
                  <form action={markPaidCash}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="btn-primary btn-sm">Mark paid (cash)</button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
        {!invoices?.length && <li className="px-4 py-6 text-sm text-slate-500">Nothing here.</li>}
      </ul>
    </div>
  );
}
