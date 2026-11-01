import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(2),
  emoji: z.string().trim().default("🌍"),
});

export async function POST(req: Request) {
  if (!(await apiUser(true))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
  const last = await db.world.findFirst({ orderBy: { order: "desc" } });
  const w = await db.world.create({ data: { ...parsed.data, order: (last?.order ?? 0) + 1 } });
  return NextResponse.json({ ok: true, id: w.id });
}

export async function DELETE(req: Request) {
  if (!(await apiUser(true))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  const count = await db.problem.count({ where: { worldId: id } });
  if (count > 0) return NextResponse.json({ error: "Move or delete this world's problems first" }, { status: 400 });
  await db.world.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
