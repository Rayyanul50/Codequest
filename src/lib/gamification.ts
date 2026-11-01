import type { Difficulty, Problem, User } from "@prisma/client";
import { db } from "./db";
import { daysBetween, startOfDay } from "./utils";

/* ---------- XP & levels ---------- */

export const BASE_XP: Record<Difficulty, number> = { EASY: 100, MEDIUM: 150, HARD: 250 };
export const BASE_COINS: Record<Difficulty, number> = { EASY: 10, MEDIUM: 20, HARD: 30 };
export const DAILY_XP_BONUS = 50;
export const DAILY_COIN_BONUS = 10;
export const FIRST_SOLVE_OF_DAY_XP = 20;

/** XP needed to *finish* a level: level × 250. Level 1 = 0..250, Level 2 = 250..500 (+250 each time). */
export function xpForLevel(level: number) {
  return level * 250;
}

/** Total cumulative XP needed to reach `level` (level 1 = 0). */
export function totalXpToReach(level: number) {
  // sum_{i=1}^{level-1} i*250
  return (250 * (level - 1) * level) / 2;
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xp >= totalXpToReach(level + 1)) level++;
  return level;
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const base = totalXpToReach(level);
  const need = xpForLevel(level);
  return { level, into: xp - base, need, pct: Math.min(100, Math.round(((xp - base) / need) * 100)) };
}

/* ---------- Streak ---------- */

export function nextStreak(user: Pick<User, "currentStreak" | "longestStreak" | "lastSolvedAt">, now = new Date()) {
  if (!user.lastSolvedAt) return { current: 1, longest: Math.max(1, user.longestStreak), firstToday: true };
  const gap = daysBetween(user.lastSolvedAt, now);
  if (gap === 0) return { current: Math.max(1, user.currentStreak), longest: user.longestStreak, firstToday: false };
  const current = gap === 1 ? user.currentStreak + 1 : 1;
  return { current, longest: Math.max(user.longestStreak, current), firstToday: true };
}

/** Streak shown on dashboard: broken if the last solve was before yesterday. */
export function effectiveStreak(user: Pick<User, "currentStreak" | "lastSolvedAt">, now = new Date()) {
  if (!user.lastSolvedAt) return 0;
  return daysBetween(user.lastSolvedAt, now) <= 1 ? user.currentStreak : 0;
}

/* ---------- Achievements ---------- */

export const ACHIEVEMENTS = [
  { key: "first_blood", name: "First Blood", description: "Solve your first challenge", icon: "🥇" },
  { key: "on_fire", name: "On Fire", description: "Reach a 3-day streak", icon: "🔥" },
  { key: "unstoppable", name: "Unstoppable", description: "Reach a 7-day streak", icon: "⚡" },
  { key: "array_apprentice", name: "Array Apprentice", description: "Solve 5 array problems", icon: "🧠" },
  { key: "problem_hunter", name: "Problem Hunter", description: "Solve 10 problems", icon: "⚔️" },
  { key: "code_warrior", name: "Code Warrior", description: "Solve 25 problems", icon: "🏆" },
  { key: "world_1", name: "Foundation Built", description: "Complete World 1", icon: "🏗️" },
  { key: "level_5", name: "Rising Star", description: "Reach level 5", icon: "⭐" },
  { key: "hard_mode", name: "Hard Mode", description: "Solve a Hard challenge", icon: "💎" },
  { key: "daily_hero", name: "Daily Hero", description: "Complete a daily challenge", icon: "🎯" },
] as const;

/* ---------- Unlocking ---------- */

/** The next level the user can play = lowest `order` active problem that is not yet solved. */
export async function getUnlockedFrontier(userId: string) {
  const [problems, solved] = await Promise.all([
    db.problem.findMany({ where: { active: true }, orderBy: { order: "asc" }, select: { id: true, order: true } }),
    db.userProblem.findMany({ where: { userId, status: "SOLVED" }, select: { problemId: true } }),
  ]);
  const solvedSet = new Set(solved.map((s) => s.problemId));
  const next = problems.find((p) => !solvedSet.has(p.id));
  return { frontierOrder: next?.order ?? Infinity, nextId: next?.id ?? null, solvedSet, problems };
}

export async function isUnlocked(userId: string, problem: Pick<Problem, "id" | "order" | "isDaily">) {
  // The daily challenge is always playable, wherever it sits in the journey.
  if (problem.isDaily) return true;
  const { frontierOrder, solvedSet } = await getUnlockedFrontier(userId);
  return problem.order <= frontierOrder || solvedSet.has(problem.id);
}

/* ---------- Award ---------- */

export type AwardResult = {
  xpEarned: number;
  coinsEarned: number;
  bonuses: string[];
  leveledUp: boolean;
  newLevel: number;
  streak: number;
  newAchievements: { key: string; name: string; icon: string; description: string }[];
  nextProblem: { id: number; title: string } | null;
  alreadySolved: boolean;
};

/**
 * Called after an ACCEPTED submission. Idempotent per problem: re-solving
 * a problem never grants XP again.
 */
export async function awardForSolve(userId: string, problemId: number): Promise<AwardResult> {
  const [user, problem, existing] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.problem.findUniqueOrThrow({ where: { id: problemId }, include: { topic: true } }),
    db.userProblem.findUnique({ where: { userId_problemId: { userId, problemId } } }),
  ]);

  if (existing?.status === "SOLVED") {
    const { problems, solvedSet } = await getUnlockedFrontier(userId);
    const nxt = problems.find((p) => p.order > problem.order && !solvedSet.has(p.id));
    const nextProblem = nxt
      ? await db.problem.findUnique({ where: { id: nxt.id }, select: { id: true, title: true } })
      : null;
    return {
      xpEarned: 0,
      coinsEarned: 0,
      bonuses: [],
      leveledUp: false,
      newLevel: user.level,
      streak: effectiveStreak(user),
      newAchievements: [],
      nextProblem,
      alreadySolved: true,
    };
  }

  const bonuses: string[] = [];
  let xp = problem.xpReward;
  let coins = problem.coinReward;

  const streak = nextStreak(user);
  if (streak.firstToday) {
    xp += FIRST_SOLVE_OF_DAY_XP;
    bonuses.push(`First solve of the day +${FIRST_SOLVE_OF_DAY_XP} XP`);
  }
  if (problem.isDaily) {
    xp += DAILY_XP_BONUS;
    coins += DAILY_COIN_BONUS;
    bonuses.push(`Daily challenge +${DAILY_XP_BONUS} XP, +${DAILY_COIN_BONUS} coins`);
  }

  const newXp = user.xp + xp;
  const newLevel = levelFromXp(newXp);

  await db.$transaction([
    db.userProblem.upsert({
      where: { userId_problemId: { userId, problemId } },
      update: { status: "SOLVED", solvedAt: new Date() },
      create: { userId, problemId, status: "SOLVED", attempts: 1, solvedAt: new Date() },
    }),
    db.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        coins: user.coins + coins,
        level: newLevel,
        currentStreak: streak.current,
        longestStreak: streak.longest,
        lastSolvedAt: new Date(),
      },
    }),
    db.xpEvent.create({ data: { userId, amount: xp } }),
  ]);

  const newAchievements = await checkAchievements(userId, { problem, streak: streak.current, level: newLevel });

  const { problems, solvedSet } = await getUnlockedFrontier(userId);
  const nxt = problems.find((p) => !solvedSet.has(p.id));
  const nextProblem = nxt
    ? await db.problem.findUnique({ where: { id: nxt.id }, select: { id: true, title: true } })
    : null;

  return {
    xpEarned: xp,
    coinsEarned: coins,
    bonuses,
    leveledUp: newLevel > user.level,
    newLevel,
    streak: streak.current,
    newAchievements,
    nextProblem,
    alreadySolved: false,
  };
}

async function checkAchievements(
  userId: string,
  ctx: { problem: Problem & { topic: { name: string } }; streak: number; level: number }
) {
  const [solvedRows, owned, allAch] = await Promise.all([
    db.userProblem.findMany({
      where: { userId, status: "SOLVED" },
      include: { problem: { include: { topic: true } } },
    }),
    db.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
    db.achievement.findMany(),
  ]);
  const have = new Set(owned.map((o) => o.achievement.key));
  const solvedCount = solvedRows.length;
  const arrays = solvedRows.filter((s) => s.problem.topic.name === "Arrays").length;

  // World 1 complete?
  const world1 = await db.world.findFirst({ where: { order: 1 }, include: { problems: { where: { active: true } } } });
  const solvedIds = new Set(solvedRows.map((s) => s.problemId));
  const world1Done = !!world1 && world1.problems.length > 0 && world1.problems.every((p) => solvedIds.has(p.id));

  const earned: string[] = [];
  const test: Record<string, boolean> = {
    first_blood: solvedCount >= 1,
    on_fire: ctx.streak >= 3,
    unstoppable: ctx.streak >= 7,
    array_apprentice: arrays >= 5,
    problem_hunter: solvedCount >= 10,
    code_warrior: solvedCount >= 25,
    world_1: world1Done,
    level_5: ctx.level >= 5,
    hard_mode: ctx.problem.difficulty === "HARD",
    daily_hero: ctx.problem.isDaily,
  };
  for (const [key, ok] of Object.entries(test)) if (ok && !have.has(key)) earned.push(key);

  const created = [];
  for (const key of earned) {
    const a = allAch.find((x) => x.key === key);
    if (!a) continue;
    await db.userAchievement.create({ data: { userId, achievementId: a.id } }).catch(() => null);
    created.push({ key: a.key, name: a.name, icon: a.icon, description: a.description });
  }
  return created;
}

/** Called on every failed submission so we can show attempts. */
export async function recordAttempt(userId: string, problemId: number) {
  await db.userProblem.upsert({
    where: { userId_problemId: { userId, problemId } },
    update: { attempts: { increment: 1 } },
    create: { userId, problemId, status: "ATTEMPTED", attempts: 1 },
  });
}

export { startOfDay };
