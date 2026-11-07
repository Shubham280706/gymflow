import Link from "next/link";
import { requireGym } from "@/lib/auth";
import { signOut } from "../login/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Payments" },
  { href: "/plans", label: "Plans" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { gym } = await requireGym();
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-semibold text-slate-900">{gym.name}</span>
          <nav className="flex flex-1 gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={signOut}>
            <button className="text-sm text-slate-500 hover:text-slate-800">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
