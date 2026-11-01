import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { UserActiveToggle } from "@/components/admin-forms";

export default async function AdminUsers() {
  const admin = await requireAdminPage();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { progress: { where: { status: "SOLVED" } } } } },
  });
  return (
    <>
      <PageHeader title="Users" subtitle={`${users.length} accounts`} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-3">Username</th><th className="p-3">Email</th><th className="p-3">Level</th><th className="p-3">XP</th><th className="p-3">Solved</th><th className="p-3">Joined</th><th className="p-3 text-right">Action</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line/60 last:border-0">
                <td className="p-3 font-semibold">{u.username} {u.role === "ADMIN" && <span className="chip ml-1 border-coin/30 bg-coin/10 text-coin">Admin</span>} {!u.active && <span className="chip ml-1 border-danger/30 bg-danger/10 text-danger">Inactive</span>}</td>
                <td className="p-3 text-muted">{u.email}</td>
                <td className="p-3">{u.level}</td>
                <td className="p-3">{u.xp.toLocaleString()}</td>
                <td className="p-3">{u._count.progress}</td>
                <td className="p-3 text-muted">{u.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                <td className="p-3 text-right"><UserActiveToggle userId={u.id} active={u.active} disabled={u.id === admin.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
