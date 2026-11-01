import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { effectiveStreak, levelProgress } from "@/lib/gamification";
import { getRank } from "@/lib/queries";
import { startOfDay, startOfWeek } from "@/lib/utils";
import { Container } from "@/components/app-shell";
import { ProgressBar } from "@/components/ui";
import { Avatar } from "@/components/leaderboard-tabs";
import { ProfileCharts } from "@/components/profile-charts";

export default async function Profile() {
  const user = await requireUser();
  const lp = levelProgress(user.xp);

  const since = new Date();
  since.setDate(since.getDate() - 13);
  const weeksBack = startOfWeek(new Date());
  weeksBack.setDate(weeksBack.getDate() - 7 * 5);

  const [solved, topics, problems, ach, xpEvents, rank] = await Promise.all([
    db.userProblem.findMany({ where: { userId: user.id, status: "SOLVED" }, include: { problem: { include: { topic: true } } } }),
    db.topic.findMany({ orderBy: { id: "asc" } }),
    db.problem.findMany({ where: { active: true }, select: { topicId: true } }),
    db.userAchievement.findMany({ where: { userId: user.id }, include: { achievement: true }, orderBy: { unlockedAt: "desc" } }),
    db.xpEvent.findMany({ where: { userId: user.id, createdAt: { gte: startOfDay(since) } } }),
    getRank(user.id),
  ]);

  // topic progress
  const totalByTopic = new Map<number, number>();
  problems.forEach((p) => totalByTopic.set(p.topicId, (totalByTopic.get(p.topicId) ?? 0) + 1));
  const solvedByTopic = new Map<number, number>();
  solved.forEach((s) => solvedByTopic.set(s.problem.topicId, (solvedByTopic.get(s.problem.topicId) ?? 0) + 1));
  const topicProgress = topics
    .map((t) => ({ name: t.name, solved: solvedByTopic.get(t.id) ?? 0, total: totalByTopic.get(t.id) ?? 0 }))
    .filter((t) => t.total > 0);

  // solved per week (last 6 weeks, Monday based)
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weeksBack);
    d.setDate(d.getDate() + i * 7);
    return { start: d, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), solved: 0 };
  });
  solved.forEach((s) => {
    if (!s.solvedAt) return;
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (s.solvedAt >= weeks[i].start) {
        weeks[i].solved++;
        break;
      }
    }
  });

  // xp per day (last 14 days)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = startOfDay(since);
    d.setDate(d.getDate() + i);
    return { start: d, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), xp: 0 };
  });
  xpEvents.forEach((e) => {
    const t = startOfDay(e.createdAt).getTime();
    const d = days.find((x) => x.start.getTime() === t);
    if (d) d.xp += e.amount;
  });

  const distribution = topicProgress.filter((t) => t.solved > 0).map((t) => ({ name: t.name, value: t.solved }));

  return (
    <Container>
      <div className="card flex flex-wrap items-center gap-5 p-6">
        <Avatar name={user.username} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold">{user.username}</h1>
          <div className="mt-0.5 text-sm text-muted">Level {lp.level} · Joined {user.createdAt.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</div>
          <div className="mt-3 max-w-sm">
            <div className="mb-1 flex justify-between text-xs font-semibold text-muted"><span>XP to level {lp.level + 1}</span><span>{lp.into}/{lp.need}</span></div>
            <ProgressBar pct={lp.pct} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-center sm:grid-cols-4">
          <div><div className="text-2xl font-extrabold text-flame">🔥 {effectiveStreak(user)}</div><div className="text-xs text-muted">Day streak</div></div>
          <div><div className="text-2xl font-extrabold text-xp">{user.xp.toLocaleString()}</div><div className="text-xs text-muted">Total XP</div></div>
          <div><div className="text-2xl font-extrabold">{solved.length}</div><div className="text-xs text-muted">Solved</div></div>
          <div><div className="text-2xl font-extrabold text-coin">#{rank ?? "—"}</div><div className="text-xs text-muted">Rank</div></div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold">Topic progress</h2>
          <div className="mt-4 space-y-4">
            {topicProgress.map((t) => {
              const pct = t.total ? Math.round((t.solved / t.total) * 100) : 0;
              return (
                <div key={t.name}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{t.name}</span><span className="text-muted">{t.solved}/{t.total} · {pct}%</span></div>
                  <ProgressBar pct={pct} color="bg-brand" />
                </div>
              );
            })}
            {topicProgress.length === 0 && <p className="text-sm text-muted">No topics yet.</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold">Badges</h2>
          {ach.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No badges yet — solve a challenge to earn your first.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {ach.map((a) => (
                <div key={a.id} title={`${a.achievement.name} — ${a.achievement.description}`} className="grid h-14 w-14 place-items-center rounded-2xl border border-coin/30 bg-coin/10 text-3xl">{a.achievement.icon}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-10 text-xl font-extrabold">Analytics</h2>
      <ProfileCharts weeks={weeks.map((w) => ({ label: w.label, solved: w.solved }))} days={days.map((d) => ({ label: d.label, xp: d.xp }))} distribution={distribution} />
    </Container>
  );
}
