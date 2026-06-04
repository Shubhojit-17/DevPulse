"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: "▤",
    exact: true,
  },
  {
    label: "Pull Requests",
    href: "/dashboard/pull-requests",
    icon: "⌥",
    exact: false,
  },
  {
    label: "Reviews",
    href: "/dashboard/reviews",
    icon: "✦",
    exact: false,
  },
  {
    label: "Deployments",
    href: "/dashboard/deployments",
    icon: "◈",
    exact: false,
  },
  {
    label: "Authors",
    href: "/dashboard/authors",
    icon: "◎",
    exact: false,
  },
];

const repoItem = {
  label: "Repositories",
  href: "/dashboard/repositories",
  icon: "⊞",
  exact: false,
};

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex h-full w-full flex-col gap-6 rounded-3xl border border-white/10 bg-panel/70 p-6 shadow-soft">
      <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-sm text-primary-foreground">
          DP
        </span>
        DevPulse
      </div>

      <nav className="flex flex-col gap-1 text-sm font-medium">
        <p className="mb-1 px-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Metrics
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <span className="text-xs opacity-70">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <p className="mb-1 mt-4 px-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Settings
        </p>
        {[repoItem].map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <span className="text-xs opacity-70">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-background/60 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Weekly digest</p>
        <p className="mt-1.5">
          Every Monday at 08:00 UTC — plain-English summary of what changed and
          why.
        </p>
      </div>
    </aside>
  );
}
