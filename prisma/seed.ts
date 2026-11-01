import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PROBLEMS, starterFor } from "./problems";

const db = new PrismaClient();

const ACHIEVEMENTS = [
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
];

const WORLDS = [
  { order: 1, name: "Foundations", emoji: "🌱", description: "Variables, conditions, loops and functions — the building blocks of every program." },
  { order: 2, name: "Data Structures", emoji: "🧱", description: "Arrays, strings, searching and sorting. Learn to organise and find data." },
  { order: 3, name: "Algorithms", emoji: "🚀", description: "Recursion, binary search, stacks and queues. Think like a problem solver." },
];

const XP = { EASY: [100, 10], MEDIUM: [150, 20], HARD: [250, 30] } as const;

async function main() {
  console.log("Seeding CodeQuest…");

  for (const a of ACHIEVEMENTS) {
    await db.achievement.upsert({ where: { key: a.key }, update: a, create: a });
  }

  const worldIds: Record<number, number> = {};
  for (const w of WORLDS) {
    const row = await db.world.upsert({ where: { order: w.order }, update: w, create: w });
    worldIds[w.order] = row.id;
  }

  // Problems — idempotent by slug.
  let order = 0;
  for (const p of PROBLEMS) {
    order++;
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const topic = await db.topic.upsert({ where: { name: p.topic }, update: {}, create: { name: p.topic } });
    const [xpReward, coinReward] = XP[p.difficulty];
    const data = {
      title: p.title,
      description: p.description,
      inputFormat: p.inputFormat,
      outputFormat: p.outputFormat,
      constraints: p.constraints,
      difficulty: p.difficulty,
      worldId: worldIds[p.world],
      topicId: topic.id,
      xpReward,
      coinReward,
      starterCode: starterFor(p.kind),
      solutionExplanation: p.explanation,
      order,
      isDaily: !!p.daily,
    };
    const cases = p.tests.map((input, i) => ({
      input: input + "\n",
      expectedOutput: p.ref(input),
      hidden: i >= 2,
    }));

    const existing = await db.problem.findUnique({ where: { slug } });
    if (existing) {
      await db.testCase.deleteMany({ where: { problemId: existing.id } });
      await db.problem.update({ where: { id: existing.id }, data: { ...data, testCases: { create: cases } } });
    } else {
      await db.problem.create({ data: { ...data, slug, testCases: { create: cases } } });
    }
  }

  // Admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@codequest.dev";
  const adminPass = process.env.ADMIN_PASSWORD || "admin12345";
  await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      username: "admin",
      passwordHash: await bcrypt.hash(adminPass, 10),
      role: "ADMIN",
      onboarded: true,
      preference: { create: {} },
    },
  });

  // Demo players so the leaderboard looks alive (password: demo12345)
  const demo = [
    { username: "rahul", xp: 2840, solved: 18, week: 640 },
    { username: "arjun", xp: 2710, solved: 17, week: 520 },
    { username: "neha", xp: 2310, solved: 14, week: 710 },
    { username: "priya", xp: 1620, solved: 11, week: 300 },
    { username: "kabir", xp: 980, solved: 7, week: 180 },
  ];
  const hash = await bcrypt.hash("demo12345", 10);
  for (const d of demo) {
    const exists = await db.user.findUnique({ where: { username: d.username } });
    if (exists) continue;
    // level from xp: cumulative 250 * (L-1) * L / 2
    let level = 1;
    while (d.xp >= (250 * level * (level + 1)) / 2) level++;
    const u = await db.user.create({
      data: {
        username: d.username,
        email: `${d.username}@demo.codequest.dev`,
        passwordHash: hash,
        onboarded: true,
        xp: d.xp,
        level,
        coins: d.solved * 15,
        currentStreak: 3,
        longestStreak: 5,
        lastSolvedAt: new Date(),
        preference: { create: {} },
      },
    });
    await db.xpEvent.create({ data: { userId: u.id, amount: d.week } });
  }

  console.log(`Done: ${PROBLEMS.length} problems, ${WORLDS.length} worlds, ${ACHIEVEMENTS.length} achievements.`);
  console.log(`Admin login → ${adminEmail} / ${adminPass}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
