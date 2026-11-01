/**
 * Code execution layer.
 *
 * User code is NEVER executed inside the Next.js process. It is sent to a
 * sandboxed Judge0 instance (hosted on RapidAPI or self-hosted via Docker).
 * If JUDGE0_URL is not configured, a MOCK runner is used so the full game
 * loop can still be demoed offline.
 */

export const LANGUAGES = {
  python: { id: 71, label: "Python", monaco: "python" },
  cpp: { id: 54, label: "C++", monaco: "cpp" },
  java: { id: 62, label: "Java", monaco: "java" },
} as const;

export type LangKey = keyof typeof LANGUAGES;

export type CaseVerdict = "PASSED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "COMPILE_ERROR";

export type CaseResult = {
  verdict: CaseVerdict;
  stdout: string;
  stderr: string;
  time: number | null;
  memory: number | null;
};

export type RunInput = { input: string; expected: string };

export const isMock = () => !process.env.JUDGE0_URL;

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s: string | null | undefined) => (s ? Buffer.from(s, "base64").toString("utf8") : "");

const norm = (s: string) =>
  s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();

function headers() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.JUDGE0_API_KEY) {
    h["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
    h["X-RapidAPI-Host"] = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";
  }
  return h;
}

async function runOne(lang: LangKey, code: string, tc: RunInput): Promise<CaseResult> {
  const base = process.env.JUDGE0_URL!.replace(/\/$/, "");
  const res = await fetch(`${base}/submissions?base64_encoded=true&wait=true&fields=*`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      source_code: b64(code),
      language_id: LANGUAGES[lang].id,
      stdin: b64(tc.input),
      cpu_time_limit: 3,
      memory_limit: 128000,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Judge0 responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const j = await res.json();
  const stdout = unb64(j.stdout);
  const stderr = unb64(j.stderr) || unb64(j.compile_output) || unb64(j.message);
  const time = j.time != null ? Number(j.time) : null;
  const memory = j.memory ?? null;

  // Judge0 status ids: 3 accepted, 4 wrong answer, 5 TLE, 6 compile error, 7-12 runtime errors
  const sid: number = j.status?.id;
  let verdict: CaseVerdict;
  if (sid === 6) verdict = "COMPILE_ERROR";
  else if (sid === 5) verdict = "TIME_LIMIT_EXCEEDED";
  else if (sid >= 7 && sid <= 14) verdict = "RUNTIME_ERROR";
  else verdict = norm(stdout) === norm(tc.expected) ? "PASSED" : "WRONG_ANSWER";

  return { verdict, stdout, stderr, time, memory };
}

function mockOne(code: string, starter: string, tc: RunInput): CaseResult {
  const untouched = norm(code) === norm(starter);
  const tooShort = code.replace(/\s/g, "").length < 20;
  const ok = !untouched && !tooShort;
  return {
    verdict: ok ? "PASSED" : "WRONG_ANSWER",
    stdout: ok ? tc.expected : "",
    stderr: "",
    time: 0.01,
    memory: 1024,
  };
}

export async function runAll(lang: LangKey, code: string, starter: string, cases: RunInput[]) {
  let results: CaseResult[];
  if (isMock()) {
    results = cases.map((c) => mockOne(code, starter, c));
  } else {
    results = await Promise.all(cases.map((c) => runOne(lang, code, c)));
  }
  const passed = results.filter((r) => r.verdict === "PASSED").length;
  const firstFail = results.find((r) => r.verdict !== "PASSED");
  const status = !firstFail
    ? ("ACCEPTED" as const)
    : (firstFail.verdict as Exclude<CaseVerdict, "PASSED">);
  const time = results.reduce((m, r) => Math.max(m, r.time ?? 0), 0);
  const memory = results.reduce((m, r) => Math.max(m, r.memory ?? 0), 0);
  return { results, passed, total: results.length, status, time, memory, mock: isMock() };
}
