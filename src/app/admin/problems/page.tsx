import Link from "next/link";
import { db } from "@/lib/db";
import { DifficultyChip, PageHeader } from "@/components/ui";
import { DeleteProblemButton } from "@/components/admin-forms";

export default async function AdminProblems() {
  const rows = await db.problem.findMany({
    orderBy: { order: "asc" },
    include: { topic: true, world: true, _count: { select: { submissions: true } } },
  });
  return (
    <>
      <PageHeader title="Manage problems" subtitle={`${rows.length} problems`} right={<Link href="/admin/problems/new" className="btn-primary">+ Create Problem</Link>} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-3">#</th><th className="p-3">Title</th><th className="p-3">Difficulty</th><th className="p-3">Topic</th><th className="p-3">World</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line/60 last:border-0">
                <td className="p-3 text-muted">{p.order}</td>
                <td className="p-3 font-semibold">{p.title} {p.isDaily && <span className="chip ml-1 border-coin/30 bg-coin/10 text-coin">Daily</span>}</td>
                <td className="p-3"><DifficultyChip d={p.difficulty} /></td>
                <td className="p-3">{p.topic.name}</td>
                <td className="p-3 text-muted">{p.world.name}</td>
                <td className={`p-3 font-semibold ${p.active ? "text-xp" : "text-muted"}`}>{p.active ? "Active" : "Hidden"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/problems/${p.id}`} className="btn-ghost px-3 py-1.5">Edit</Link>
                    <DeleteProblemButton id={p.id} title={p.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
