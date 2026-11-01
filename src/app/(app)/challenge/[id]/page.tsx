import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isUnlocked } from "@/lib/gamification";
import { isMock } from "@/lib/judge";
import { Workspace, type WorkspaceProblem } from "@/components/workspace";

export default async function ChallengePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const problem = await db.problem.findUnique({
    where: { id },
    include: { topic: true, world: true, testCases: { where: { hidden: false }, orderBy: { id: "asc" } } },
  });
  if (!problem || !problem.active) notFound();
  if (user.role !== "ADMIN" && !(await isUnlocked(user.id, problem))) redirect("/journey");

  const [progress, pref] = await Promise.all([
    db.userProblem.findUnique({ where: { userId_problemId: { userId: user.id, problemId: id } } }),
    db.userPreference.findUnique({ where: { userId: user.id } }),
  ]);

  const data: WorkspaceProblem = {
    id: problem.id,
    order: problem.order,
    title: problem.title,
    topic: problem.topic.name,
    world: problem.world.name,
    difficulty: problem.difficulty,
    xpReward: problem.xpReward,
    coinReward: problem.coinReward,
    description: problem.description,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    constraints: problem.constraints,
    explanation: problem.solutionExplanation,
    isDaily: problem.isDaily,
    starterCode: problem.starterCode as { python: string; cpp: string; java: string },
    samples: problem.testCases.map((t) => ({ input: t.input, output: t.expectedOutput })),
    solved: progress?.status === "SOLVED",
    attempts: progress?.attempts ?? 0,
  };

  const lang = (pref?.preferredLanguage as "python" | "cpp" | "java") || "python";
  return <Workspace problem={data} defaultLang={lang} mock={isMock()} />;
}
