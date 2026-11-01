import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser, destroySession } from "@/lib/auth";
import { effectiveStreak, levelProgress } from "@/lib/gamification";

export async function GET() {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const solved = await db.userProblem.count({ where: { userId: user.id, status: "SOLVED" } });
  return NextResponse.json({
    username: user.username,
    email: user.email,
    xp: user.xp,
    coins: user.coins,
    streak: effectiveStreak(user),
    solved,
    ...levelProgress(user.xp),
  });
}

const schema = z.object({
  username: z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
});

export async function PUT(req: Request) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { username, currentPassword, newPassword } = parsed.data;

  const data: { username?: string; passwordHash?: string } = {};
  if (username && username !== user.username) {
    const taken = await db.user.findFirst({ where: { username: { equals: username, mode: "insensitive" }, NOT: { id: user.id } } });
    if (taken) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    data.username = username;
  }
  if (newPassword) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }
  if (Object.keys(data).length) await db.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "ADMIN") return NextResponse.json({ error: "Admin accounts cannot be deleted here" }, { status: 400 });
  await db.user.delete({ where: { id: user.id } });
  destroySession();
  return NextResponse.json({ ok: true });
}
