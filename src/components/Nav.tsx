"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconSliders, IconTicket, IconUsers, IconWallet } from "./Icons";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: IconHome },
  { href: "/clients", label: "Members", icon: IconUsers },
  { href: "/invoices", label: "Payments", icon: IconWallet },
  { href: "/plans", label: "Plans", icon: IconTicket },
  { href: "/settings", label: "Settings", icon: IconSliders },
];

export default function Nav({ variant, overdue }: { variant: "side" | "tabs"; overdue: number }) {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(href + "/");

  if (variant === "tabs") {
    return (
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                active(href) ? "text-accent" : "text-ink-3"
              }`}
            >
              <Icon width={22} height={22} />
              {label}
              {href === "/invoices" && overdue > 0 && (
                <span className="absolute right-[calc(50%-20px)] top-2.5 grid min-w-4 place-items-center rounded-full bg-bad px-1 text-[10px] font-bold leading-4 text-white">
                  {overdue}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-1">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={active(href) ? "page" : undefined}
            className={`flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition-colors ${
              active(href) ? "bg-accent-soft text-accent-ink" : "text-ink-2 hover:bg-line-2 hover:text-ink"
            }`}
          >
            <Icon />
            {label}
            {href === "/invoices" && overdue > 0 && (
              <span className="ml-auto rounded-full bg-bad px-1.5 text-[11px] font-bold leading-5 text-white">{overdue}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
