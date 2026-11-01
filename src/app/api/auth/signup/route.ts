import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

const schema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(20).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and _ only"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { username, email, password } = parsed.data;

  const exists = await db.user.findFirst({
    where: { OR: [{ email }, { username: { equals: username, mode: "insensitive" } }] },
  });
  if (exists) {
    return NextResponse.json(
      { error: exists.email === email ? "Email already registered" : "Username already taken" },
      { status: 409 }
    );
  }

  const user = await db.user.create({
    data: {
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      preference: { create: {} },
    },
  });
  await createSession(user.id, user.role);
  return NextResponse.json({ ok: true, redirect: "/onboarding" });
}
