import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Container } from "@/components/app-shell";
import { PageHeader, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";

export default async function Achievements() {
  const user = await requireUser();
  const [all, mine] = await Promise.all([
    db.achievement.findMany({ orderBy: { id: "asc" } }),
    db.userAchievement.findMany({ where: { userId: user.id } }),
  ]);
  const got = new Map(mine.map((m) => [m.achievementId, m.unlockedAt]));

  return (
    <Container>
      <PageHeader
        title="Achievements"
        subtitle={`${got.size} of ${all.length} badges unlocked`}
        right={<div className="w-48"><ProgressBar pct={all.length ? (got.size / all.length) * 100 : 0} color="bg-coin" /></div>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((a) => {
          const at = got.get(a.id);
          return (
            <div key={a.id} className={cn("card flex items-center gap-4 p-5 transition", at ? "border-coin/40 bg-coin/5" : "opacity-60")}>
              <div className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl", at ? "bg-coin/15" : "bg-surface2 grayscale")}>{a.icon}</div>
              <div className="min-w-0">
                <div className="font-bold">{a.name}</div>
                <div className="text-sm text-muted">{a.description}</div>
                <div className={cn("mt-1 text-xs font-semibold", at ? "text-coin" : "text-muted")}>
                  {at ? `Unlocked ${at.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "🔒 Locked"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
