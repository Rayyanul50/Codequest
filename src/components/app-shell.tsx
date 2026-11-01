"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  ListChecks,
  Trophy,
  Medal,
  User,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { Logo } from "./ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journey", label: "Journey", icon: Map },
  { href: "/challenges", label: "Challenges", icon: ListChecks },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/achievements", label: "Achievements", icon: Medal },
  { href: "/profile", label: "Profile", icon: User },
];

export type ShellUser = {
  username: string;
  level: number;
  streak: number;
  coins: number;
  xpPct: number;
  isAdmin: boolean;
};

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const active = (href: string) => path === href || path.startsWith(href + "/") || (href === "/journey" && path.startsWith("/challenge/"));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface/70 p-4 backdrop-blur lg:flex">
        <Logo className="px-2 pt-1" />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                active(href) ? "bg-brand/15 text-brand-soft" : "text-muted hover:bg-surface2 hover:text-ink"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <div className="mt-auto space-y-1 border-t border-line pt-3">
            {user.isAdmin && (
              <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-coin hover:bg-surface2">
                <Shield size={18} /> Admin
              </Link>
            )}
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                active("/settings") ? "bg-brand/15 text-brand-soft" : "text-muted hover:bg-surface2 hover:text-ink"
              )}
            >
              <Settings size={18} /> Settings
            </Link>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface2 hover:text-danger">
              <LogOut size={18} /> Log out
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur lg:px-8">
          <div className="lg:hidden"><Logo /></div>
          <div className="hidden items-center gap-3 text-sm text-muted lg:flex">
            <span className="font-semibold text-ink">{user.username}</span>
            <span className="chip border-brand/40 bg-brand/10 text-brand-soft">Lv {user.level}</span>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-surface2">
              <div className="h-full rounded-full bg-xp" style={{ width: `${user.xpPct}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span title="Day streak" className="chip border-flame/30 bg-flame/10 text-sm text-flame">🔥 {user.streak}</span>
            <span title="Coins" className="chip border-coin/30 bg-coin/10 text-sm text-coin">🪙 {user.coins}</span>
            <Link href="/settings" className="lg:hidden grid h-8 w-8 place-items-center rounded-lg border border-line text-muted" aria-label="Settings"><Settings size={16} /></Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
      </div>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        {NAV.filter((n) => n.href !== "/achievements").map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn("flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold", active(href) ? "text-brand-soft" : "text-muted")}>
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Container({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={cn("mx-auto p-5 lg:p-8", wide ? "max-w-7xl" : "max-w-5xl")}>{children}</div>;
}
