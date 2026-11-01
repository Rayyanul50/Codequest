import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const problemId = Number(new URL(req.url).searchParams.get("problemId")) || undefined;
  const rows = await db.submission.findMany({
    where: { userId: user.id, ...(problemId ? { problemId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, status: true, language: true, passed: true, total: true, createdAt: true, problem: { select: { title: true } } },
  });
  return NextResponse.json({ rows });
}
