import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ProblemForm, type ProblemFormValues } from "@/components/admin-forms";

export default async function EditProblem({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const p = await db.problem.findUnique({ where: { id }, include: { testCases: { orderBy: { id: "asc" } }, topic: true } });
  if (!p) notFound();
  const worlds = await db.world.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } });
  const topics = await db.topic.findMany({ orderBy: { name: "asc" }, select: { name: true } });

  const initial: ProblemFormValues = {
    title: p.title,
    description: p.description,
    inputFormat: p.inputFormat,
    outputFormat: p.outputFormat,
    constraints: p.constraints,
    difficulty: p.difficulty,
    topic: p.topic.name,
    worldId: p.worldId,
    xpReward: p.xpReward,
    coinReward: p.coinReward,
    starterCode: p.starterCode as ProblemFormValues["starterCode"],
    solutionExplanation: p.solutionExplanation,
    isDaily: p.isDaily,
    active: p.active,
    testCases: p.testCases.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput, hidden: t.hidden })),
  };
  return (
    <>
      <PageHeader title={`Edit: ${p.title}`} />
      <ProblemForm worlds={worlds} topics={topics.map((t) => t.name)} initial={initial} id={p.id} />
    </>
  );
}
