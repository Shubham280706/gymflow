import { requireGym } from "@/lib/auth";
import { todayIST } from "@/lib/format";
import Logo from "@/components/Logo";
import Nav from "@/components/Nav";
import { IconLogout } from "@/components/Icons";
import { signOut } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, gym, user } = await requireGym();
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("due_date", todayIST());
  const overdue = count ?? 0;

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-3 py-5 md:flex">
        <Logo className="px-2" />
        <div className="mx-2 mt-6 rounded-xl bg-paper px-3 py-2.5">
          <p className="truncate text-sm font-semibold">{gym.name}</p>
          <p className="truncate text-xs text-ink-3">{user.email}</p>
        </div>
        <nav className="mt-5 flex-1" aria-label="Main">
          <Nav variant="side" overdue={overdue} />
        </nav>
        <form action={signOut}>
          <button className="btn btn-ghost w-full justify-start px-3">
            <IconLogout /> Sign out
          </button>
        </form>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur md:hidden">
          <Logo />
          <span className="max-w-[45%] truncate text-sm font-semibold text-ink-2">{gym.name}</span>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-10">{children}</main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <Nav variant="tabs" overdue={overdue} />
      </nav>
    </div>
  );
}
