import { requireGym } from "@/lib/auth";
import { inr } from "@/lib/format";
import FormShell from "@/components/FormShell";
import { addPlan, togglePlan } from "../actions";

export default async function PlansPage() {
  const { supabase } = await requireGym();
  const { data: plans } = await supabase.from("plans").select("*").order("created_at");
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Plans</h1>
      <FormShell action={addPlan} submitLabel="Add plan" className="card flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium text-slate-700">
          Name
          <input name="name" required className="input mt-1 w-44" placeholder="Monthly" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Price (₹)
          <input name="price" type="number" min="1" step="1" required className="input mt-1 w-28" placeholder="1500" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Duration (days)
          <input name="days" type="number" min="1" step="1" required className="input mt-1 w-28" placeholder="30" />
        </label>
      </FormShell>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr><th className="th">Plan</th><th className="th">Price</th><th className="th">Duration</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(plans ?? []).map((p) => (
              <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                <td className="td font-medium">{p.name}</td>
                <td className="td">{inr(p.price_paise)}</td>
                <td className="td">{p.duration_days} days</td>
                <td className="td text-right">
                  <form action={togglePlan}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={String(!p.active)} />
                    <button className="btn-secondary btn-sm">{p.active ? "Archive" : "Restore"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {!plans?.length && (
              <tr><td className="td text-slate-500" colSpan={4}>No plans yet. Add your first one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
