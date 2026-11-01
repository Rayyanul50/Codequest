import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ProblemForm } from "@/components/admin-forms";

export default async function NewProblem() {
  const worlds = await db.world.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } });
  const topics = await db.topic.findMany({ orderBy: { name: "asc" }, select: { name: true } });
  return (
    <>
      <PageHeader title="Create problem" subtitle="Problems read from stdin and print to stdout." />
      <ProblemForm worlds={worlds} topics={topics.map((t) => t.name)} />
    </>
  );
}
