import { requireGym } from "@/lib/auth";
import FormShell from "@/components/FormShell";
import { IconLogout } from "@/components/Icons";
import { signOut } from "../../login/actions";
import { updateGym } from "../actions";

export const metadata = { title: "Settings" };

const CHOICES = [
  { day: -3, label: "3 days before the due date" },
  { day: -1, label: "1 day before" },
  { day: 0, label: "On the due date" },
  { day: 1, label: "1 day late" },
  { day: 3, label: "3 days late" },
  { day: 7, label: "7 days late" },
];

export default async function SettingsPage() {
  const { gym, user } = await requireGym();
  const chosen = new Set<number>(gym.reminder_days as number[]);

  return (
    <div className="max-w-2xl space-y-6 md:space-y-8">
      <h1 className="h-display text-4xl font-bold md:text-5xl">Settings</h1>

      <FormShell action={updateGym} submitLabel="Save settings" successMessage="Saved" className="space-y-6">
        <section className="panel space-y-4 p-5 md:p-6" aria-labelledby="gym">
          <h2 id="gym" className="h-display text-2xl font-semibold">Your gym</h2>
          <div>
            <label htmlFor="g-name" className="label">Gym name</label>
            <input id="g-name" name="name" defaultValue={gym.name} required className="input" />
            <p className="mt-1.5 text-xs text-ink-3">Members see this name in their WhatsApp messages.</p>
          </div>
          <div>
            <label htmlFor="g-phone" className="label">Gym phone</label>
            <input id="g-phone" name="phone" defaultValue={gym.phone ?? ""} inputMode="tel" className="input" placeholder="98765 43210" />
          </div>
        </section>

        <section className="panel p-5 md:p-6" aria-labelledby="rem">
          <h2 id="rem" className="h-display text-2xl font-semibold">When to remind members</h2>
          <p className="mb-4 mt-1 text-[15px] text-ink-2">Members with an unpaid fee get a WhatsApp reminder on each day you tick.</p>
          <fieldset className="grid gap-2.5 sm:grid-cols-2">
            <legend className="sr-only">Reminder days</legend>
            {CHOICES.map((c) => (
              <label key={c.day} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-line px-3.5 text-[15px] has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                <input type="checkbox" name="reminder_days" value={c.day} defaultChecked={chosen.has(c.day)} className="size-4 accent-[var(--color-accent)]" />
                {c.label}
              </label>
            ))}
          </fieldset>
        </section>
      </FormShell>

      <section className="panel p-5 md:p-6" aria-labelledby="acct">
        <h2 id="acct" className="h-display text-2xl font-semibold">Account</h2>
        <p className="mb-4 mt-1 text-[15px] text-ink-2">Signed in as {user.email}</p>
        <form action={signOut}>
          <button className="btn btn-quiet"><IconLogout width={18} height={18} /> Sign out</button>
        </form>
      </section>
    </div>
  );
}
