import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!user || !ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  if (!user.active) return NextResponse.json({ error: "This account has been deactivated" }, { status: 403 });

  await createSession(user.id, user.role);
  const redirect = user.role === "ADMIN" ? "/admin" : user.onboarded ? "/dashboard" : "/onboarding";
  return NextResponse.json({ ok: true, redirect });
}
