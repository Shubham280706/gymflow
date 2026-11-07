import { requireGym } from "@/lib/auth";
import { inr } from "@/lib/format";
import FormShell from "@/components/FormShell";
import { addPlan, togglePlan } from "../actions";

export const metadata = { title: "Plans" };

export default async function PlansPage() {
  const { supabase } = await requireGym();
  const [{ data: plans }, { data: members }] = await Promise.all([
    supabase.from("plans").select("*").order("created_at"),
    supabase.from("clients").select("plan_id").eq("status", "active"),
  ]);
  const used = new Map<string, number>();
  for (const m of members ?? []) if (m.plan_id) used.set(m.plan_id, (used.get(m.plan_id) ?? 0) + 1);

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="h-display text-4xl font-bold md:text-5xl">Plans</h1>
        <p className="mt-2 max-w-[52ch] text-[15px] text-ink-2">
          A plan sets how much a member pays and how long it lasts. When a member pays, their next due date moves forward by the plan&rsquo;s length.
        </p>
      </div>

      <section className="panel p-5 md:p-6" aria-labelledby="new-plan">
        <h2 id="new-plan" className="h-display mb-4 text-2xl font-semibold">New plan</h2>
        <FormShell
          action={addPlan}
          submitLabel="Add plan"
          resetOnSuccess
          successMessage="Plan added"
          className="grid gap-4 sm:grid-cols-3"
        >
          <div>
            <label htmlFor="p-name" className="label">Name</label>
            <input id="p-name" name="name" required className="input" placeholder="Monthly" />
          </div>
          <div>
            <label htmlFor="p-price" className="label">Price in rupees</label>
            <input id="p-price" name="price" type="number" min="1" step="1" required inputMode="numeric" className="input" placeholder="1500" />
          </div>
          <div>
            <label htmlFor="p-days" className="label">Lasts for (days)</label>
            <input id="p-days" name="days" type="number" min="1" step="1" required inputMode="numeric" className="input" placeholder="30" />
          </div>
        </FormShell>
      </section>

      {!plans?.length ? (
        <div className="panel px-6 py-12 text-center">
          <p className="h-display text-3xl font-semibold">No plans yet</p>
          <p className="mx-auto mt-2 max-w-[40ch] text-ink-2">Add your first plan above, for example Monthly at ₹1,500 for 30 days.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <li key={p.id} className={`panel flex flex-col p-5 ${p.active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="h-display text-2xl font-semibold">{p.name}</h3>
                {!p.active && <span className="pill bg-line-2 text-ink-2">Archived</span>}
              </div>
              <p className="num mt-3 text-5xl font-bold">{inr(p.price_paise)}</p>
              <p className="mt-1 text-[15px] text-ink-2">
                every {p.duration_days} day{p.duration_days === 1 ? "" : "s"}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-line-2 pt-4">
                <p className="text-sm text-ink-3">
                  {used.get(p.id) ?? 0} active member{used.get(p.id) === 1 ? "" : "s"}
                </p>
                <form action={togglePlan}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="active" value={String(!p.active)} />
                  <button className="btn btn-ghost btn-sm">{p.active ? "Archive" : "Restore"}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
