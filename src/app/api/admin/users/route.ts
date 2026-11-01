import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function GET() {
  if (!(await apiUser(true))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ rows });
}

const schema = z.object({ userId: z.string(), active: z.boolean() });

export async function PATCH(req: Request) {
  const admin = await apiUser(true);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (parsed.data.userId === admin.id) return NextResponse.json({ error: "You cannot deactivate yourself" }, { status: 400 });
  await db.user.update({ where: { id: parsed.data.userId }, data: { active: parsed.data.active } });
  return NextResponse.json({ ok: true });
}
