import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { awardForSolve, isUnlocked, recordAttempt } from "@/lib/gamification";
import { runAll, type LangKey } from "@/lib/judge";

const schema = z.object({
  problemId: z.number().int(),
  language: z.enum(["python", "cpp", "java"]),
  code: z.string().min(1).max(50_000),
});

/** SUBMIT = every test case (sample + hidden). Stores the submission and awards XP on ACCEPTED. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { problemId, language, code } = parsed.data;

  const problem = await db.problem.findUnique({ where: { id: problemId }, include: { testCases: true } });
  if (!problem || !problem.active) return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  if (user.role !== "ADMIN" && !(await isUnlocked(user.id, problem)))
    return NextResponse.json({ error: "This level is still locked" }, { status: 403 });

  const starter = (problem.starterCode as Record<string, string>)[language] ?? "";
  let out;
  try {
    out = await runAll(
      language as LangKey,
      code,
      starter,
      problem.testCases.map((t) => ({ input: t.input, expected: t.expectedOutput }))
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Execution service unavailable" }, { status: 502 });
  }

  const submission = await db.submission.create({
    data: {
      userId: user.id,
      problemId,
      language,
      code,
      status: out.status,
      passed: out.passed,
      total: out.total,
      executionTime: out.time,
      memoryUsed: out.memory,
    },
  });

  const attempts = await db.submission.count({ where: { userId: user.id, problemId } });

  if (out.status === "ACCEPTED") {
    const award = await awardForSolve(user.id, problemId);
    return NextResponse.json({
      submissionId: submission.id,
      status: out.status,
      passed: out.passed,
      total: out.total,
      time: out.time,
      attempts,
      mock: out.mock,
      award,
    });
  }

  await recordAttempt(user.id, problemId);
  // Reveal the first failing *visible* case only; hidden cases stay hidden.
  const failIdx = out.results.findIndex((r) => r.verdict !== "PASSED");
  const failing = failIdx >= 0 ? problem.testCases[failIdx] : null;
  return NextResponse.json({
    submissionId: submission.id,
    status: out.status,
    passed: out.passed,
    total: out.total,
    time: out.time,
    attempts,
    mock: out.mock,
    error: out.results[failIdx]?.stderr?.slice(0, 800) || "",
    failing:
      failing && !failing.hidden
        ? { input: failing.input, expected: failing.expectedOutput, output: out.results[failIdx].stdout }
        : null,
  });
}
