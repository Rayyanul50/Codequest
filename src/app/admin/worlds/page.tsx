import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { DeleteWorldButton, WorldForm } from "@/components/admin-forms";

export default async function AdminWorlds() {
  const worlds = await db.world.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { problems: true } } } });
  return (
    <>
      <PageHeader title="Worlds" subtitle="Worlds group levels on the journey map." />
      <WorldForm />
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-3">Order</th><th className="p-3">World</th><th className="p-3">Description</th><th className="p-3">Levels</th><th className="p-3 text-right">Action</th></tr>
          </thead>
          <tbody>
            {worlds.map((w) => (
              <tr key={w.id} className="border-b border-line/60 last:border-0">
                <td className="p-3 text-muted">{w.order}</td>
                <td className="p-3 font-semibold">{w.emoji} {w.name}</td>
                <td className="p-3 text-muted">{w.description}</td>
                <td className="p-3">{w._count.problems}</td>
                <td className="p-3 text-right"><DeleteWorldButton id={w.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
