import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { isUnlocked } from "@/lib/gamification";
import { LANGUAGES, runAll, type LangKey } from "@/lib/judge";

const schema = z.object({
  problemId: z.number().int(),
  language: z.enum(["python", "cpp", "java"]),
  code: z.string().min(1).max(50_000),
});

/** RUN = sample (visible) test cases only. No XP, nothing is stored. */
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

  const samples = problem.testCases.filter((t) => !t.hidden);
  const starter = (problem.starterCode as Record<string, string>)[language] ?? "";
  try {
    const out = await runAll(
      language as LangKey,
      code,
      starter,
      samples.map((s) => ({ input: s.input, expected: s.expectedOutput }))
    );
    return NextResponse.json({
      status: out.status,
      mock: out.mock,
      passed: out.passed,
      total: out.total,
      cases: out.results.map((r, i) => ({
        input: samples[i].input,
        expected: samples[i].expectedOutput,
        output: r.stdout,
        error: r.stderr,
        verdict: r.verdict,
        time: r.time,
      })),
      language: LANGUAGES[language as LangKey].label,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Execution service unavailable" }, { status: 502 });
  }
}
