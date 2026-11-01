import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, Stat } from "@/components/ui";
import { Users, ListChecks, Send, CheckCircle2 } from "lucide-react";

export default async function AdminHome() {
  const [users, problems, submissions, accepted, recent] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.problem.count(),
    db.submission.count(),
    db.submission.count({ where: { status: "ACCEPTED" } }),
    db.submission.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { username: true } }, problem: { select: { title: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Platform overview" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Users size={14} />} label="Users" value={users} />
        <Stat icon={<ListChecks size={14} />} label="Problems" value={problems} />
        <Stat icon={<Send size={14} />} label="Submissions" value={submissions} />
        <Stat icon={<CheckCircle2 size={14} />} accent="text-xp" label="Accepted" value={accepted} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/problems/new" className="btn-primary">+ Create problem</Link>
        <Link href="/admin/problems" className="btn-ghost">Manage problems</Link>
        <Link href="/admin/users" className="btn-ghost">Manage users</Link>
        <Link href="/admin/worlds" className="btn-ghost">Worlds</Link>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-extrabold">Recent submissions</h2>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-3">User</th><th className="p-3">Problem</th><th className="p-3">Language</th><th className="p-3">Result</th><th className="p-3">When</th></tr>
          </thead>
          <tbody>
            {recent.map((s) => (
              <tr key={s.id} className="border-b border-line/60 last:border-0">
                <td className="p-3 font-semibold">{s.user.username}</td>
                <td className="p-3">{s.problem.title}</td>
                <td className="p-3 text-muted">{s.language}</td>
                <td className={`p-3 font-semibold ${s.status === "ACCEPTED" ? "text-xp" : "text-danger"}`}>{s.status.replace(/_/g, " ")} ({s.passed}/{s.total})</td>
                <td className="p-3 text-muted">{s.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted">No submissions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
