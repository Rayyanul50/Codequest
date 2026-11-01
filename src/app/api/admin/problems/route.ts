import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { problemSchema, saveProblem } from "@/lib/admin";

export async function GET() {
  if (!(await apiUser(true))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db.problem.findMany({
    orderBy: { order: "asc" },
    include: { topic: true, world: true, _count: { select: { testCases: true, submissions: true } } },
  });
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  if (!(await apiUser(true))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = problemSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    const p = await saveProblem(null, parsed.data);
    return NextResponse.json({ ok: true, id: p.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
