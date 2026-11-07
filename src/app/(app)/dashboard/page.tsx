import Link from "next/link";
import { requireGym } from "@/lib/auth";
import { diffDays, fmtDate, inr, todayIST } from "@/lib/format";
import { sendReminderNow } from "../actions";

export default async function Dashboard() {
  const { supabase } = await requireGym();
  const today = todayIST();
  const monthStart = today.slice(0, 8) + "01";

  const [{ count: activeClients }, { data: pending }, { data: paid }] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("invoices")
      .select("id, amount_paise, due_date, clients(name, phone)")
      .eq("status", "pending")
      .order("due_date"),
    supabase.from("payments").select("amount_paise").gte("paid_at", monthStart + "T00:00:00+05:30"),
  ]);

  const overdue = (pending ?? []).filter((i) => i.due_date < today);
  const pendingTotal = (pending ?? []).reduce((s, i) => s + i.amount_paise, 0);
  const overdueTotal = overdue.reduce((s, i) => s + i.amount_paise, 0);
  const collected = (paid ?? []).reduce((s, p) => s + p.amount_paise, 0);

  const stats = [
    { label: "Active clients", value: String(activeClients ?? 0) },
    { label: "Collected this month", value: inr(collected) },
    { label: "Pending", value: inr(pendingTotal), sub: `${pending?.length ?? 0} invoices` },
    { label: "Overdue", value: inr(overdueTotal), sub: `${overdue.length} clients`, danger: overdue.length > 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.danger ? "text-red-600" : "text-slate-900"}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-slate-500">{s.sub}</p>}
          </div>
        ))}
      </div>

      <section className="card p-0">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-medium">Overdue payments</h2>
          <Link href="/invoices?status=overdue" className="text-sm text-emerald-700 hover:underline">View all</Link>
        </div>
        {overdue.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-500">Nobody is overdue. 🎉</p>
        ) : (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {overdue.slice(0, 8).map((i) => {
              const c = Array.isArray(i.clients) ? i.clients[0] : i.clients;
              return (
                <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <div className="min-w-0 flex-1 basis-36">
                    <div className="truncate font-medium">{c?.name}</div>
                    <div className="text-xs text-red-600">
                      {diffDays(i.due_date, today)} days overdue <span className="text-slate-400">({fmtDate(i.due_date)})</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{inr(i.amount_paise)}</div>
                  <form action={sendReminderNow}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="btn-secondary btn-sm">Send reminder</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
