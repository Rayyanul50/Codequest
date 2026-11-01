import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { problemSchema, saveProblem } from "@/lib/admin";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!(await apiUser(true))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = await db.problem.findUnique({ where: { id: Number(params.id) }, include: { testCases: true, topic: true } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(p);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await apiUser(true))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = problemSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    const p = await saveProblem(Number(params.id), parsed.data);
    return NextResponse.json({ ok: true, id: p.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!(await apiUser(true))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db.problem.delete({ where: { id: Number(params.id) } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
