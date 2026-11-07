import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import CycleBar from "@/components/CycleBar";
import StatusPill from "@/components/StatusPill";
import Avatar from "@/components/Avatar";
import { IconArrowRight, IconBell, IconChat, IconCheck } from "@/components/Icons";
import type { MemberState } from "@/lib/members";
import type { PillKind } from "@/components/StatusPill";

const SAMPLE: { name: string; plan: string; note: string; state: MemberState; pill: PillKind; daysLeft: number; total: number }[] = [
  { name: "Rahul Sharma", plan: "Monthly", note: "24 days left", state: "active", pill: "paid", daysLeft: 24, total: 30 },
  { name: "Priya Patel", plan: "Monthly", note: "5 days late", state: "overdue", pill: "overdue", daysLeft: -5, total: 30 },
  { name: "Aman Verma", plan: "Quarterly", note: "Due in 3 days", state: "due-soon", pill: "due-soon", daysLeft: 3, total: 90 },
  { name: "Neha Singh", plan: "Annual", note: "212 days left", state: "active", pill: "paid", daysLeft: 212, total: 365 },
];

const FEATURES = [
  {
    icon: IconCheck,
    title: "Payments mark themselves",
    body: "Members pay through a UPI link. The moment it goes through, their fee is paid and their next due date moves forward. Cash payments take one tap.",
  },
  {
    icon: IconChat,
    title: "WhatsApp reminders that go out on time",
    body: "Three days before, on the due date, and when a fee is late. Every message names the member, the amount and carries the payment link.",
  },
  {
    icon: IconBell,
    title: "See who owes you at a glance",
    body: "Each member shows how much of their membership is left. Overdue members rise to the top, with a reminder button beside them.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <Logo />
        <Link href="/login" className="btn btn-quiet btn-sm">Sign in</Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:px-8 md:pb-24 md:pt-16">
          <div>
            <h1 className="h-display text-[clamp(3rem,8vw,5.5rem)] font-bold">
              Know who&rsquo;s paid.
              <br />
              Nudge who hasn&rsquo;t.
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-2">
              GymFlow keeps track of every member&rsquo;s fee, reminds them on WhatsApp before and after the due date, and
              marks payments as paid the moment they arrive.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login" className="btn btn-primary h-12 px-6 text-base">
                Create your gym account <IconArrowRight width={18} height={18} />
              </Link>
              <span className="text-sm text-ink-3">Free to start. Set up in a few minutes.</span>
            </div>
          </div>

          <div className="relative">
            <div className="panel p-2 md:p-3" aria-label="Example member list">
              <div className="flex items-baseline justify-between px-3 pb-2 pt-2">
                <p className="h-display text-2xl font-semibold">Iron Paradise Fitness</p>
                <p className="text-sm text-ink-3">4 members</p>
              </div>
              <ul className="divide-y divide-line-2">
                {SAMPLE.map((m) => (
                  <li key={m.name} className="flex items-center gap-3 px-3 py-3.5">
                    <Avatar name={m.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{m.name}</p>
                        <StatusPill kind={m.pill} />
                      </div>
                      <CycleBar state={m.state} daysLeft={m.daysLeft} totalDays={m.total} className="my-2" />
                      <p className="text-[13px] text-ink-3">
                        {m.plan} &middot; {m.note}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute -bottom-6 right-4 flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-[0_8px_24px_-12px_rgba(20,23,31,0.35)] md:-right-5">
              <span className="grid size-8 place-items-center rounded-full bg-ok text-white">
                <IconChat width={16} height={16} />
              </span>
              <p className="text-[13px] leading-snug">
                <span className="font-semibold">Reminder sent to Priya</span>
                <br />
                <span className="text-ink-3">with a UPI payment link</span>
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3 md:px-8 md:py-20">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-ink">
                  <Icon />
                </span>
                <h2 className="h-display mt-4 text-2xl font-semibold">{title}</h2>
                <p className="mt-2 max-w-[38ch] leading-relaxed text-ink-2">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center md:px-8">
          <h2 className="h-display text-4xl font-bold md:text-5xl">Stop chasing fees on WhatsApp by hand.</h2>
          <Link href="/login" className="btn btn-accent mt-6 h-12 px-6 text-base">
            Create your gym account
          </Link>
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-3">GymFlow</footer>
    </div>
  );
}
