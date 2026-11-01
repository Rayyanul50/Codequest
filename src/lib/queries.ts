import { db } from "./db";
import { startOfDay, startOfWeek } from "./utils";

export type LeaderRow = { rank: number; userId: string; username: string; xp: number; solved: number; level: number; isYou: boolean };

export async function getLeaderboard(period: "weekly" | "all", meId: string): Promise<LeaderRow[]> {
  if (period === "all") {
    const users = await db.user.findMany({
      where: { active: true, role: "USER" },
      orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
      take: 25,
      select: { id: true, username: true, xp: true, level: true, _count: { select: { progress: { where: { status: "SOLVED" } } } } },
    });
    return users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username,
      xp: u.xp,
      level: u.level,
      solved: u._count.progress,
      isYou: u.id === meId,
    }));
  }

  const since = startOfWeek(new Date());
  const grouped = await db.xpEvent.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since }, user: { active: true, role: "USER" } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 25,
  });
  const ids = grouped.map((g) => g.userId);
  const [users, solved] = await Promise.all([
    db.user.findMany({ where: { id: { in: ids } }, select: { id: true, username: true, level: true } }),
    db.userProblem.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: "SOLVED", solvedAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);
  const uMap = new Map(users.map((u) => [u.id, u]));
  const sMap = new Map(solved.map((s) => [s.userId, s._count._all]));
  return grouped.map((g, i) => ({
    rank: i + 1,
    userId: g.userId,
    username: uMap.get(g.userId)?.username ?? "unknown",
    level: uMap.get(g.userId)?.level ?? 1,
    xp: g._sum.amount ?? 0,
    solved: sMap.get(g.userId) ?? 0,
    isYou: g.userId === meId,
  }));
}

export async function getRank(userId: string) {
  const me = await db.user.findUnique({ where: { id: userId }, select: { xp: true } });
  if (!me) return null;
  const ahead = await db.user.count({ where: { active: true, role: "USER", xp: { gt: me.xp } } });
  return ahead + 1;
}

/** Last 7 calendar days (Mon..Sun of current week) with solved flag. */
export async function getWeekActivity(userId: string) {
  const start = startOfWeek(new Date());
  const solved = await db.userProblem.findMany({
    where: { userId, status: "SOLVED", solvedAt: { gte: start } },
    select: { solvedAt: true },
  });
  const days = new Set(solved.map((s) => startOfDay(s.solvedAt!).getTime()));
  const today = startOfDay(new Date()).getTime();
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const t = d.getTime();
    return { label, done: days.has(t), today: t === today, future: t > today };
  });
}

/** World/problem map with per-user status. */
export async function getJourney(userId: string) {
  const [worlds, solved, attempts] = await Promise.all([
    db.world.findMany({
      orderBy: { order: "asc" },
      include: {
        problems: { where: { active: true }, orderBy: { order: "asc" }, include: { topic: true } },
      },
    }),
    db.userProblem.findMany({ where: { userId, status: "SOLVED" }, select: { problemId: true } }),
    db.userProblem.findMany({ where: { userId }, select: { problemId: true, attempts: true } }),
  ]);
  const solvedSet = new Set(solved.map((s) => s.problemId));
  const attemptMap = new Map(attempts.map((a) => [a.problemId, a.attempts]));
  let currentFound = false;
  const out = worlds.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    emoji: w.emoji,
    order: w.order,
    problems: w.problems.map((p) => {
      let status: "completed" | "current" | "locked";
      if (solvedSet.has(p.id)) status = "completed";
      else if (!currentFound) {
        status = "current";
        currentFound = true;
      } else status = "locked";
      return {
        id: p.id,
        order: p.order,
        title: p.title,
        topic: p.topic.name,
        difficulty: p.difficulty,
        xpReward: p.xpReward,
        isDaily: p.isDaily,
        attempts: attemptMap.get(p.id) ?? 0,
        status,
      };
    }),
  }));
  return out;
}

export async function getDailyChallenge() {
  const p = await db.problem.findFirst({ where: { isDaily: true, active: true }, include: { topic: true } });
  return p;
}
