import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { effectiveStreak, levelProgress } from "@/lib/gamification";
import { getDailyChallenge, getJourney, getRank, getWeekActivity } from "@/lib/queries";
import { Container } from "@/components/app-shell";
import { Countdown, Greeting } from "@/components/small-clients";
import { DifficultyChip, ProgressBar, Stat } from "@/components/ui";
import { cn } from "@/lib/utils";

export default async function Dashboard() {
  const user = await requireUser();
  const lp = levelProgress(user.xp);

  const [journey, rank, week, daily, solvedCount, recent, totalProblems] = await Promise.all([
    getJourney(user.id),
    getRank(user.id),
    getWeekActivity(user.id),
    getDailyChallenge(),
    db.userProblem.count({ where: { userId: user.id, status: "SOLVED" } }),
    db.userAchievement.findMany({
      where: { userId: user.id },
      orderBy: { unlockedAt: "desc" },
      take: 4,
      include: { achievement: true },
    }),
    db.problem.count({ where: { active: true } }),
  ]);

  const current = journey.flatMap((w) => w.problems.map((p) => ({ ...p, world: w }))).find((p) => p.status === "current");
  const streak = effectiveStreak(user);
  const dailyDone = daily
    ? !!(await db.userProblem.findFirst({ where: { userId: user.id, problemId: daily.id, status: "SOLVED" } }))
    : false;

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <Greeting name={user.username} />
        </h1>
        <p className="mt-1 text-muted">{streak > 0 ? "Keep your streak alive!" : "Solve a challenge today to start a streak."}</p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat icon={<Zap size={14} />} accent="text-brand-soft" label="Level" value={lp.level} />
        <div className="card col-span-2 p-4 lg:col-span-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">XP</div>
          <div className="mt-2 text-2xl font-extrabold">
            {lp.into.toLocaleString()} <span className="text-sm font-semibold text-muted">/ {lp.need.toLocaleString()}</span>
          </div>
          <ProgressBar pct={lp.pct} className="mt-2" />
        </div>
        <Stat icon="🔥" label="Streak" value={`${streak} day${streak === 1 ? "" : "s"}`} sub={`Best: ${user.longestStreak}`} />
        <Stat icon="✅" label="Solved" value={solvedCount} sub={`of ${totalProblems}`} />
        <Stat icon="🏆" label="Rank" value={rank ? `#${rank}` : "—"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* continue journey */}
        <div className="lg:col-span-2">
          {current ? (
            <div className="card relative overflow-hidden p-6">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand/20 blur-3xl" />
              <div className="relative">
                <div className="text-xs font-bold uppercase tracking-widest text-brand-soft">
                  World {current.world.order} · {current.topic}
                </div>
                <h2 className="mt-2 text-2xl font-extrabold">
                  Level {current.order} — {current.title}
                </h2>
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <DifficultyChip d={current.difficulty} />
                  <span className="font-semibold text-xp">+{current.xpReward} XP</span>
                  {current.attempts > 0 && <span className="text-muted">{current.attempts} attempt{current.attempts > 1 ? "s" : ""}</span>}
                </div>
                <Link href={`/challenge/${current.id}`} className="btn-primary mt-6 px-6">
                  Continue <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="text-5xl">🏆</div>
              <h2 className="mt-3 text-2xl font-extrabold">Journey complete!</h2>
              <p className="mt-1 text-muted">You&apos;ve cleared every level. New challenges will appear here as they&apos;re added.</p>
            </div>
          )}

          {/* weekly streak strip */}
          <div className="card mt-6 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">🔥 {streak} day streak</h3>
              <span className="text-xs text-muted">Solve one challenge a day</span>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2 text-center">
              {week.map((d) => (
                <div key={d.label}>
                  <div className="text-xs font-semibold text-muted">{d.label}</div>
                  <div
                    className={cn(
                      "mx-auto mt-2 grid h-9 w-9 place-items-center rounded-full border text-sm",
                      d.done ? "border-xp bg-xp/15 text-xp" : d.today ? "border-brand bg-brand/10 text-brand-soft" : "border-line text-muted",
                      d.future && "opacity-40"
                    )}
                  >
                    {d.done ? <CheckCircle2 size={18} /> : d.today ? "●" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* daily challenge */}
          <div className="card border-coin/30 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-coin">⚡ Daily Challenge</div>
            {daily ? (
              <>
                <h3 className="mt-2 text-xl font-extrabold">{daily.title}</h3>
                <div className="mt-1 text-sm text-muted">
                  +{daily.xpReward + 50} XP · +{daily.coinReward + 10} 🪙 <span className="text-xs">(bonus included)</span>
                </div>
                <div className="mt-3 text-xs text-muted">
                  Resets in <Countdown />
                </div>
                {dailyDone ? (
                  <div className="btn-ghost mt-4 w-full cursor-default text-xp">✅ Completed</div>
                ) : (
                  <Link href={`/challenge/${daily.id}`} className="btn-success mt-4 w-full">Start Challenge</Link>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">No daily challenge is set. An admin can mark one.</p>
            )}
          </div>

          {/* achievements */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Recent achievements</h3>
              <Link href="/achievements" className="text-xs font-semibold text-brand-soft hover:underline">View all</Link>
            </div>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Solve your first challenge to earn 🥇 First Blood.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface2 text-lg">{r.achievement.icon}</span>
                    <span className="text-sm font-semibold">{r.achievement.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
