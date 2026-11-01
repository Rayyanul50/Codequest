import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { effectiveStreak, levelProgress } from "@/lib/gamification";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.onboarded && user.role !== "ADMIN") redirect("/onboarding");
  const lp = levelProgress(user.xp);
  return (
    <AppShell
      user={{
        username: user.username,
        level: lp.level,
        streak: effectiveStreak(user),
        coins: user.coins,
        xpPct: lp.pct,
        isAdmin: user.role === "ADMIN",
      }}
    >
      {children}
    </AppShell>
  );
}
