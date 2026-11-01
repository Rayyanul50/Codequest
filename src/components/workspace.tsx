"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, Loader2, Play, RotateCcw, Send, XCircle } from "lucide-react";
import { DifficultyChip } from "./ui";
import { cn } from "@/lib/utils";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading editor…</div>,
});

export type WorkspaceProblem = {
  id: number;
  order: number;
  title: string;
  topic: string;
  world: string;
  difficulty: string;
  xpReward: number;
  coinReward: number;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  explanation: string;
  isDaily: boolean;
  starterCode: { python: string; cpp: string; java: string };
  samples: { input: string; output: string }[];
  solved: boolean;
  attempts: number;
};

type Lang = "python" | "cpp" | "java";
const LANGS: { key: Lang; label: string; monaco: string }[] = [
  { key: "python", label: "Python", monaco: "python" },
  { key: "cpp", label: "C++", monaco: "cpp" },
  { key: "java", label: "Java", monaco: "java" },
];

type RunCase = { input: string; expected: string; output: string; error: string; verdict: string; time: number | null };
type RunResult = { status: string; passed: number; total: number; cases: RunCase[]; mock: boolean };
type Award = {
  xpEarned: number;
  coinsEarned: number;
  bonuses: string[];
  leveledUp: boolean;
  newLevel: number;
  streak: number;
  newAchievements: { key: string; name: string; icon: string; description: string }[];
  nextProblem: { id: number; title: string } | null;
  alreadySolved: boolean;
};
type SubmitResult = {
  status: string;
  passed: number;
  total: number;
  time: number | null;
  attempts: number;
  mock: boolean;
  error?: string;
  failing?: { input: string; expected: string; output: string } | null;
  award?: Award;
};

const STATUS_TEXT: Record<string, string> = {
  ACCEPTED: "Accepted",
  WRONG_ANSWER: "Wrong Answer",
  TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
  RUNTIME_ERROR: "Runtime Error",
  COMPILE_ERROR: "Compile Error",
};

function Rich({ text }: { text: string }) {
  return (
    <div className="prose-cq">
      {text.split(/\n\n+/).map((para, i) => (
        <p key={i}>
          {para.split(/(`[^`]+`)/).map((part, j) =>
            part.startsWith("`") && part.endsWith("`") && part.length > 2 ? <code key={j}>{part.slice(1, -1)}</code> : <span key={j}>{part}</span>
          )}
        </p>
      ))}
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        color: ["#7c5cff", "#22d3a5", "#fbbf24", "#fb7a3c", "#f43f5e"][i % 5],
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  );
}

export function Workspace({ problem, defaultLang, mock }: { problem: WorkspaceProblem; defaultLang: Lang; mock: boolean }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [codes, setCodes] = useState<Record<Lang, string>>(problem.starterCode);
  const [tab, setTab] = useState<"problem" | "code">("problem");
  const [panel, setPanel] = useState<"output" | "result">("output");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runRes, setRunRes] = useState<RunResult | null>(null);
  const [subRes, setSubRes] = useState<SubmitResult | null>(null);
  const [err, setErr] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [dark, setDark] = useState(true);
  const [showExplain, setShowExplain] = useState(false);
  const hydrated = useRef(false);

  // restore drafts + theme
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    try {
      const saved = localStorage.getItem(`cq:code:${problem.id}`);
      if (saved) setCodes({ ...problem.starterCode, ...JSON.parse(saved) });
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, [problem.id, problem.starterCode]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(`cq:code:${problem.id}`, JSON.stringify(codes));
    } catch {
      /* ignore */
    }
  }, [codes, problem.id]);

  const code = codes[lang];
  const busy = running || submitting;

  const call = useCallback(
    async (url: string) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, language: lang, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    },
    [problem.id, lang, code]
  );

  async function run() {
    setErr("");
    setRunning(true);
    setPanel("output");
    try {
      setRunRes(await call("/api/code/run"));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function submit() {
    setErr("");
    setSubmitting(true);
    setPanel("result");
    try {
      const data: SubmitResult = await call("/api/code/submit");
      setSubRes(data);
      if (data.status === "ACCEPTED") setCelebrate(true);
      router.refresh(); // updates XP / coins / streak in the top bar
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    if (confirm("Reset your code to the starter template?")) setCodes((c) => ({ ...c, [lang]: problem.starterCode[lang] }));
  }

  const award = subRes?.award;

  const problemPane = (
    <div className="thin-scroll h-full overflow-y-auto p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold uppercase tracking-wider text-brand-soft">Level {problem.order}</span>
        <span className="text-muted">·</span>
        <span className="text-muted">{problem.world}</span>
        {problem.isDaily && <span className="chip border-coin/30 bg-coin/10 text-coin">⚡ Daily</span>}
        {problem.solved && <span className="chip border-xp/30 bg-xp/10 text-xp"><CheckCircle2 size={12} /> Solved</span>}
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight">{problem.title}</h1>
      <Rich text={problem.description} />

      {problem.inputFormat && (
        <>
          <h3 className="mb-1 mt-5 text-xs font-bold uppercase tracking-wider text-muted">Input</h3>
          <Rich text={problem.inputFormat} />
        </>
      )}
      {problem.outputFormat && (
        <>
          <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wider text-muted">Output</h3>
          <Rich text={problem.outputFormat} />
        </>
      )}
      {problem.constraints && (
        <>
          <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wider text-muted">Constraints</h3>
          <div className="rounded-lg bg-surface2 px-3 py-2 font-mono text-xs">{problem.constraints}</div>
        </>
      )}

      <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-muted">Examples</h3>
      <div className="space-y-3">
        {problem.samples.map((s, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-line">
            <div className="grid sm:grid-cols-2">
              <div className="border-b border-line p-3 sm:border-b-0 sm:border-r">
                <div className="mb-1 text-[11px] font-bold uppercase text-muted">Input</div>
                <pre className="whitespace-pre-wrap font-mono text-sm">{s.input.trim()}</pre>
              </div>
              <div className="p-3">
                <div className="mb-1 text-[11px] font-bold uppercase text-muted">Output</div>
                <pre className="whitespace-pre-wrap font-mono text-sm">{s.output}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {problem.solved && problem.explanation && (
        <div className="mt-6">
          <button onClick={() => setShowExplain(!showExplain)} className="flex items-center gap-1 text-sm font-semibold text-brand-soft">
            Solution hint <ChevronDown size={16} className={cn("transition", showExplain && "rotate-180")} />
          </button>
          {showExplain && <div className="mt-2 rounded-xl bg-surface2 p-4 text-sm"><Rich text={problem.explanation} /></div>}
        </div>
      )}
    </div>
  );

  const editorPane = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          className="rounded-lg border border-line bg-surface2 px-3 py-1.5 text-sm font-semibold outline-none focus:border-brand"
          aria-label="Language"
        >
          {LANGS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="btn-ghost px-3 py-1.5" title="Reset code" disabled={busy}><RotateCcw size={15} /><span className="hidden sm:inline">Reset</span></button>
          <button onClick={run} className="btn-ghost px-3 py-1.5" disabled={busy}>
            {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Run
          </button>
          <button onClick={submit} className="btn-success px-4 py-1.5" disabled={busy}>
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Submit
          </button>
        </div>
      </div>

      <div className="min-h-[260px] flex-1">
        <Editor
          height="100%"
          language={LANGS.find((l) => l.key === lang)!.monaco}
          theme={dark ? "vs-dark" : "light"}
          value={code}
          onChange={(v) => setCodes((c) => ({ ...c, [lang]: v ?? "" }))}
          options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, padding: { top: 12 } }}
        />
      </div>

      {/* output panel */}
      <div className="flex h-[38%] min-h-[190px] flex-col border-t border-line">
        <div className="flex gap-1 border-b border-line px-2 pt-1.5">
          {(["output", "result"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPanel(t)}
              className={cn("rounded-t-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider", panel === t ? "bg-surface2 text-ink" : "text-muted hover:text-ink")}
            >
              {t === "output" ? "Run output" : "Submission"}
            </button>
          ))}
          {mock && <span className="ml-auto self-center pr-2 text-[11px] font-semibold text-coin" title="JUDGE0_URL is not set — results are simulated">MOCK RUNNER</span>}
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto p-3 text-sm">
          {err && (
            <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-danger">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {err}
            </div>
          )}

          {panel === "output" && (
            <>
              {!runRes && !running && <p className="text-muted">Press <b>Run</b> to test your code on the sample inputs.</p>}
              {running && <p className="flex items-center gap-2 text-muted"><Loader2 size={15} className="animate-spin" /> Running…</p>}
              {runRes && !running && (
                <div className="space-y-3">
                  <div className={cn("flex items-center gap-2 font-bold", runRes.status === "ACCEPTED" ? "text-xp" : "text-danger")}>
                    {runRes.status === "ACCEPTED" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    {runRes.status === "ACCEPTED" ? "All samples passed" : STATUS_TEXT[runRes.status] ?? runRes.status} · {runRes.passed}/{runRes.total}
                  </div>
                  {runRes.cases.map((c, i) => (
                    <div key={i} className="rounded-xl border border-line bg-surface2/60 p-3">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-muted">Sample {i + 1}</span>
                        <span className={c.verdict === "PASSED" ? "text-xp" : "text-danger"}>{c.verdict === "PASSED" ? "✅ Passed" : "❌ " + (STATUS_TEXT[c.verdict] ?? c.verdict)}</span>
                      </div>
                      <div className="grid gap-3 font-mono text-xs sm:grid-cols-3">
                        <div><div className="mb-0.5 font-sans text-[11px] font-bold text-muted">Input</div><pre className="whitespace-pre-wrap">{c.input.trim()}</pre></div>
                        <div><div className="mb-0.5 font-sans text-[11px] font-bold text-muted">Your output</div><pre className="whitespace-pre-wrap">{c.output.trim() || "—"}</pre></div>
                        <div><div className="mb-0.5 font-sans text-[11px] font-bold text-muted">Expected</div><pre className="whitespace-pre-wrap">{c.expected}</pre></div>
                      </div>
                      {c.error && <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-danger/10 p-2 font-mono text-xs text-danger">{c.error}</pre>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {panel === "result" && (
            <>
              {!subRes && !submitting && <p className="text-muted">Press <b>Submit</b> to run every test case — including the hidden ones — and earn XP.</p>}
              {submitting && <p className="flex items-center gap-2 text-muted"><Loader2 size={15} className="animate-spin" /> Judging against all test cases…</p>}
              {subRes && !submitting && (
                <div className="space-y-2">
                  <div className={cn("flex items-center gap-2 text-lg font-extrabold", subRes.status === "ACCEPTED" ? "text-xp" : "text-danger")}>
                    {subRes.status === "ACCEPTED" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    {STATUS_TEXT[subRes.status] ?? subRes.status}
                  </div>
                  <div className="text-muted">{subRes.passed} / {subRes.total} test cases passed · Attempts: {subRes.attempts}</div>
                  {subRes.status !== "ACCEPTED" && <p className="text-muted">Review your logic and try again — no penalty for wrong answers.</p>}
                  {subRes.error && <pre className="whitespace-pre-wrap rounded-lg bg-danger/10 p-2 font-mono text-xs text-danger">{subRes.error}</pre>}
                  {subRes.failing && (
                    <div className="rounded-xl border border-line bg-surface2/60 p-3 font-mono text-xs">
                      <div className="mb-1 font-sans text-[11px] font-bold uppercase text-muted">Failing sample</div>
                      <div>Input: <span className="whitespace-pre-wrap">{subRes.failing.input.trim()}</span></div>
                      <div>Expected: {subRes.failing.expected}</div>
                      <div>Got: {subRes.failing.output.trim() || "—"}</div>
                    </div>
                  )}
                  {subRes.status === "ACCEPTED" && award && (
                    <button className="btn-ghost mt-1" onClick={() => setCelebrate(true)}>Show rewards</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem-4rem)] flex-col lg:h-[calc(100vh-4rem)]">
      {/* header strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line bg-surface/60 px-4 py-2.5 text-sm">
        <Link href="/journey" className="flex items-center gap-1 text-muted hover:text-ink"><ArrowLeft size={16} /> Journey</Link>
        <span className="font-bold">Problem #{problem.order}</span>
        <span className="text-muted">{problem.topic}</span>
        <DifficultyChip d={problem.difficulty} />
        <span className="font-bold text-xp">+{problem.xpReward} XP</span>
        <span className="font-bold text-coin">+{problem.coinReward} 🪙</span>
        {problem.attempts > 0 && !problem.solved && <span className="text-xs text-muted">Attempts: {problem.attempts}</span>}
      </div>

      {/* mobile tab switch */}
      <div className="grid grid-cols-2 border-b border-line lg:hidden">
        {(["problem", "code"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("py-2.5 text-sm font-bold capitalize", tab === t ? "border-b-2 border-brand text-brand-soft" : "text-muted")}>{t}</button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className={cn("min-h-0 border-line lg:block lg:border-r", tab === "problem" ? "block" : "hidden")}>{problemPane}</div>
        <div className={cn("min-h-0 lg:block", tab === "code" ? "block" : "hidden")}>{editorPane}</div>
      </div>

      {/* celebration */}
      {celebrate && award && subRes?.status === "ACCEPTED" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="card relative w-full max-w-md animate-pop overflow-hidden p-7 text-center">
            {!award.alreadySolved && <Confetti />}
            <div className="relative">
              <div className="text-6xl">{award.alreadySolved ? "✅" : "🎉"}</div>
              <div className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-xp">
                {award.alreadySolved ? "Already solved" : "Challenge complete"}
              </div>
              <h2 className="mt-1 text-2xl font-black">{problem.title}</h2>
              <div className="mt-3 font-semibold text-xp">✅ {subRes.passed} / {subRes.total} tests passed</div>

              {award.alreadySolved ? (
                <p className="mt-3 text-sm text-muted">XP is only awarded the first time you solve a level.</p>
              ) : (
                <>
                  <div className="mt-5 flex justify-center gap-3">
                    <div className="rounded-2xl border border-xp/30 bg-xp/10 px-5 py-3"><div className="text-2xl font-black text-xp">+{award.xpEarned}</div><div className="text-xs font-bold text-muted">XP</div></div>
                    <div className="rounded-2xl border border-coin/30 bg-coin/10 px-5 py-3"><div className="text-2xl font-black text-coin">+{award.coinsEarned}</div><div className="text-xs font-bold text-muted">COINS</div></div>
                    <div className="rounded-2xl border border-flame/30 bg-flame/10 px-5 py-3"><div className="text-2xl font-black text-flame">🔥 {award.streak}</div><div className="text-xs font-bold text-muted">STREAK</div></div>
                  </div>
                  {award.bonuses.length > 0 && (
                    <ul className="mt-3 space-y-0.5 text-xs text-muted">{award.bonuses.map((b) => <li key={b}>✨ {b}</li>)}</ul>
                  )}
                  {award.leveledUp && (
                    <div className="mt-4 rounded-xl border border-brand/40 bg-brand/15 py-2.5 font-bold text-brand-soft">⭐ LEVEL UP! You&apos;re now level {award.newLevel}</div>
                  )}
                  {award.newAchievements.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {award.newAchievements.map((a) => (
                        <div key={a.key} className="flex items-center gap-3 rounded-xl border border-coin/30 bg-coin/10 p-3 text-left">
                          <span className="text-2xl">{a.icon}</span>
                          <div><div className="text-sm font-bold">Badge unlocked: {a.name}</div><div className="text-xs text-muted">{a.description}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {award.nextProblem && <div className="mt-5 text-sm font-bold uppercase tracking-wider text-brand-soft">🔓 Next level unlocked</div>}
              <div className="mt-4 flex gap-3">
                <button className="btn-ghost flex-1" onClick={() => setCelebrate(false)}>Stay here</button>
                <button
                  className="btn-primary flex-1"
                  onClick={() => router.push(award.nextProblem ? `/challenge/${award.nextProblem.id}` : "/journey")}
                >
                  {award.nextProblem ? "Continue" : "Back to journey"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
