import { requireGym } from "@/lib/auth";
import { fmtDate, todayIST } from "@/lib/format";
import FormShell from "@/components/FormShell";
import { addClient, setClientStatus } from "../actions";

const BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
  left: "bg-slate-100 text-slate-500",
};

export default async function ClientsPage() {
  const { supabase } = await requireGym();
  const [{ data: clients }, { data: plans }] = await Promise.all([
    supabase.from("clients").select("id, name, phone, status, next_due_date, plans(name)").order("created_at", { ascending: false }),
    supabase.from("plans").select("id, name").eq("active", true).order("created_at"),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Clients</h1>
      <FormShell action={addClient} submitLabel="Register client" className="card flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 basis-40 text-sm font-medium text-slate-700">
          Name
          <input name="name" required className="input mt-1" />
        </label>
        <label className="min-w-0 flex-1 basis-40 text-sm font-medium text-slate-700">
          WhatsApp number
          <input name="phone" required inputMode="tel" className="input mt-1" placeholder="98765 43210" />
        </label>
        <label className="min-w-0 flex-1 basis-36 text-sm font-medium text-slate-700">
          Plan
          <select name="plan_id" required className="input mt-1" defaultValue="">
            <option value="" disabled>Choose…</option>
            {(plans ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="min-w-0 flex-1 basis-36 text-sm font-medium text-slate-700">
          Joining date
          <input name="start_date" type="date" defaultValue={todayIST()} className="input mt-1" />
        </label>
      </FormShell>

      <ul className="card divide-y divide-slate-100 p-0">
        {(clients ?? []).map((c) => {
          const plan = Array.isArray(c.plans) ? c.plans[0] : c.plans;
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
              <div className="min-w-0 flex-1 basis-40">
                <div className="truncate font-medium">{c.name}</div>
                <div className="text-xs text-slate-500">+{c.phone}</div>
              </div>
              <div className="text-sm">
                <div>{plan?.name ?? "—"}</div>
                <div className="whitespace-nowrap text-xs text-slate-500">Next due {fmtDate(c.next_due_date)}</div>
              </div>
              <div className="w-16 text-right">
                <span className={`rounded-full px-2 py-0.5 text-xs ${BADGE[c.status]}`}>{c.status}</span>
              </div>
              <form action={setClientStatus} className="flex w-full justify-end gap-1.5 sm:w-auto">
                <input type="hidden" name="id" value={c.id} />
                {c.status !== "active" && <button name="status" value="active" className="btn-secondary btn-sm">Activate</button>}
                {c.status === "active" && <button name="status" value="paused" className="btn-secondary btn-sm">Pause</button>}
                {c.status !== "left" && <button name="status" value="left" className="btn-secondary btn-sm">Left</button>}
              </form>
            </li>
          );
        })}
        {!clients?.length && <li className="px-4 py-6 text-sm text-slate-500">No clients yet. Register your first one above.</li>}
      </ul>
    </div>
  );
}
