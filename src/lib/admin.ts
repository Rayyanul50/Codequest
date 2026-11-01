import { z } from "zod";
import { db } from "./db";

const tc = z.object({ input: z.string(), expectedOutput: z.string(), hidden: z.boolean() });

export const problemSchema = z.object({
  title: z.string().trim().min(3, "Title is required"),
  description: z.string().trim().min(10, "Description is required"),
  inputFormat: z.string().default(""),
  outputFormat: z.string().default(""),
  constraints: z.string().default(""),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topic: z.string().trim().min(1, "Topic is required"),
  worldId: z.number().int(),
  xpReward: z.number().int().min(0).max(5000),
  coinReward: z.number().int().min(0).max(1000),
  starterCode: z.object({ python: z.string(), cpp: z.string(), java: z.string() }),
  solutionExplanation: z.string().default(""),
  isDaily: z.boolean().default(false),
  active: z.boolean().default(true),
  testCases: z.array(tc).min(1, "Add at least one test case"),
});

export type ProblemInput = z.infer<typeof problemSchema>;

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function saveProblem(id: number | null, data: ProblemInput) {
  const world = await db.world.findUnique({ where: { id: data.worldId } });
  if (!world) throw new Error("World not found");
  if (!data.testCases.some((t) => !t.hidden)) throw new Error("Add at least one sample (visible) test case");

  const topic = await db.topic.upsert({ where: { name: data.topic }, update: {}, create: { name: data.topic } });

  const { testCases, topic: _t, ...rest } = data;
  void _t;

  if (data.isDaily) await db.problem.updateMany({ where: { isDaily: true, ...(id ? { NOT: { id } } : {}) }, data: { isDaily: false } });

  if (id) {
    await db.testCase.deleteMany({ where: { problemId: id } });
    return db.problem.update({
      where: { id },
      data: { ...rest, topicId: topic.id, testCases: { create: testCases } },
    });
  }

  const last = await db.problem.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  let slug = slugify(data.title);
  if (await db.problem.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  return db.problem.create({
    data: { ...rest, slug, topicId: topic.id, order: (last?.order ?? 0) + 1, testCases: { create: testCases } },
  });
}
