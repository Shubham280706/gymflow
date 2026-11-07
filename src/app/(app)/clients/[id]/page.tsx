import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGym } from "@/lib/auth";
import { fmtDate, fmtDateShort, inr, todayIST } from "@/lib/format";
import { dueText, memberState, reminderText, whatsappLink } from "@/lib/members";
import Avatar from "@/components/Avatar";
import CopyButton from "@/components/CopyButton";
import CycleBar from "@/components/CycleBar";
import FormShell from "@/components/FormShell";
import StatusPill from "@/components/StatusPill";
import { IconArrowLeft, IconBell, IconChat, IconCheck, IconPhone } from "@/components/Icons";
import { markPaidCash, sendReminderNow, setClientStatus, updateMember } from "../../actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireGym();
  const { data } = await supabase.from("clients").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Member" };
}

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, gym } = await requireGym();
  const today = todayIST();

  const [{ data: c }, { data: invoices }, { data: plans }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone, status, start_date, next_due_date, plan_id, plans(name, price_paise, duration_days)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("id, amount_paise, due_date, status, paid_at, payment_link_url")
      .eq("client_id", id)
      .neq("status", "cancelled")
      .order("due_date", { ascending: false }),
    supabase.from("plans").select("id, name, price_paise").order("created_at"),
  ]);
  if (!c) notFound();

  const plan = Array.isArray(c.plans) ? c.plans[0] : c.plans;
  const { state, daysLeft } = memberState(c, today);
  const open = (invoices ?? []).find((i) => i.status === "pending");
  const totalPaid = (invoices ?? []).filter((i) => i.status === "paid").reduce((s, i) => s + i.amount_paise, 0);

  return (
    <div className="space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
        <IconArrowLeft width={16} height={16} /> Members
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={c.name} size={64} />
        <div className="min-w-0 flex-1 basis-56">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="h-display text-4xl font-bold md:text-5xl">{c.name}</h1>
            <StatusPill kind={state} />
          </div>
          <p className="mt-1 text-[15px] text-ink-2">+{c.phone} &middot; joined {fmtDate(c.start_date)}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <a href={whatsappLink(c.phone, reminderText(c.name, gym.name))} target="_blank" rel="noreferrer" className="btn btn-primary flex-1 sm:flex-none">
            <IconChat width={18} height={18} /> WhatsApp
          </a>
          <a href={`tel:+${c.phone}`} className="btn btn-quiet flex-1 sm:flex-none">
            <IconPhone width={18} height={18} /> Call
          </a>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="space-y-6">
          <section className="panel p-5 md:p-6" aria-labelledby="mem">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="mem" className="h-display text-2xl font-semibold">{plan?.name ?? "No plan"}</h2>
              {plan && <p className="num text-2xl font-semibold">{inr(plan.price_paise)}</p>}
            </div>
            <CycleBar state={state} daysLeft={daysLeft} totalDays={plan?.duration_days ?? 30} className="my-4" />
            <div className="flex flex-wrap justify-between gap-2 text-[15px]">
              <p className={state === "overdue" ? "font-semibold text-bad-ink" : "font-semibold"}>
                {state === "paused" || state === "left" ? "Not being billed" : dueText(daysLeft)}
              </p>
              <p className="text-ink-3">Next due {fmtDate(c.next_due_date)}</p>
            </div>

            {open && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line-2 pt-5">
                <p className="mr-auto text-[15px]">
                  <span className="font-semibold">{inr(open.amount_paise)}</span> waiting to be paid
                </p>
                {open.payment_link_url && <CopyButton text={open.payment_link_url} />}
                <form action={sendReminderNow}>
                  <input type="hidden" name="id" value={open.id} />
                  <button className="btn btn-quiet btn-sm"><IconBell width={16} height={16} /> Remind</button>
                </form>
                <form action={markPaidCash}>
                  <input type="hidden" name="id" value={open.id} />
                  <button className="btn btn-accent btn-sm"><IconCheck width={16} height={16} /> Mark paid in cash</button>
                </form>
              </div>
            )}
          </section>

          <section className="panel" aria-labelledby="hist">
            <div className="flex items-baseline justify-between px-5 pb-1 pt-5">
              <h2 id="hist" className="h-display text-2xl font-semibold">Payment history</h2>
              <p className="text-sm text-ink-3">{inr(totalPaid)} paid in total</p>
            </div>
            {(invoices ?? []).length === 0 ? (
              <p className="px-5 pb-6 pt-2 text-[15px] text-ink-2">No fees billed yet.</p>
            ) : (
              <ul className="divide-y divide-line-2 pt-2">
                {(invoices ?? []).map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="font-semibold">{fmtDate(i.due_date)}</p>
                      <p className="text-[13px] text-ink-3">
                        {i.status === "paid" && i.paid_at
                          ? `Paid ${fmtDateShort(new Date(Date.parse(i.paid_at) + 5.5 * 3600_000).toISOString().slice(0, 10))}`
                          : "Fee due"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="num text-xl font-semibold">{inr(i.amount_paise)}</p>
                      <StatusPill kind={i.status === "paid" ? "paid" : i.due_date < today ? "overdue" : "pending"} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel p-5 md:p-6" aria-labelledby="edit">
            <h2 id="edit" className="h-display mb-4 text-2xl font-semibold">Details</h2>
            <FormShell action={updateMember} submitLabel="Save changes" className="space-y-4" successMessage="Saved">
              <input type="hidden" name="id" value={c.id} />
              <div>
                <label htmlFor="e-name" className="label">Name</label>
                <input id="e-name" name="name" defaultValue={c.name} required className="input" />
              </div>
              <div>
                <label htmlFor="e-phone" className="label">WhatsApp number</label>
                <input id="e-phone" name="phone" defaultValue={c.phone.replace(/^91/, "")} required inputMode="tel" className="input" />
              </div>
              <div>
                <label htmlFor="e-plan" className="label">Plan</label>
                <select id="e-plan" name="plan_id" defaultValue={c.plan_id ?? ""} className="input">
                  <option value="">No plan</option>
                  {(plans ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({inr(p.price_paise)})</option>
                  ))}
                </select>
              </div>
            </FormShell>
          </section>

          <section className="panel p-5 md:p-6" aria-labelledby="stat">
            <h2 id="stat" className="h-display mb-1 text-2xl font-semibold">Membership status</h2>
            <p className="mb-4 text-[15px] text-ink-2">Paused and left members are not billed and get no reminders.</p>
            <form action={setClientStatus} className="flex flex-wrap gap-2">
              <input type="hidden" name="id" value={c.id} />
              {c.status !== "active" && <button name="status" value="active" className="btn btn-primary btn-sm">Resume membership</button>}
              {c.status === "active" && <button name="status" value="paused" className="btn btn-quiet btn-sm">Pause</button>}
              {c.status !== "left" && <button name="status" value="left" className="btn btn-quiet btn-sm">Mark as left</button>}
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
