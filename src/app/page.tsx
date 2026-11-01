import Link from "next/link";
import { ArrowRight, Flame, Trophy, Lock, Zap, Map, Code2, Star, CheckCircle2, Play } from "lucide-react";
import { Logo } from "@/components/ui";
import { getSessionUserId } from "@/lib/auth";

const FEATURES = [
  { icon: Map, title: "A journey, not a list", text: "Worlds, topics and levels. Each solved challenge unlocks the next step on your path." },
  { icon: Zap, title: "XP & levels", text: "Every accepted solution earns XP. Level up as you grow from variables to algorithms." },
  { icon: Flame, title: "Daily streaks", text: "Solve one challenge a day to keep the flame alive and earn bonus rewards." },
  { icon: Trophy, title: "Badges & leaderboard", text: "Unlock achievements and climb the weekly leaderboard." },
  { icon: Code2, title: "Real coding arena", text: "Monaco editor, Python / C++ / Java, sandboxed execution against hidden test cases." },
  { icon: Star, title: "Coins & daily quest", text: "Earn coins on every win and take on a special daily challenge for bonus XP." },
];

const STEPS = [
  { n: 1, t: "Pick your path", d: "Tell us your level and interests during a 30-second onboarding." },
  { n: 2, t: "Enter a world", d: "Choose the next unlocked level on your journey map." },
  { n: 3, t: "Solve the challenge", d: "Write code, run the samples, submit against hidden tests." },
  { n: 4, t: "Level up", d: "Collect XP, coins and badges — and unlock what's next." },
];

export default async function Landing() {
  const signedIn = !!(await getSessionUserId());
  const start = signedIn ? "/dashboard" : "/signup";

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#journey" className="hover:text-ink">Journey</a>
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Link href="/dashboard" className="btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Log in</Link>
                <Link href="/signup" className="btn-primary hidden sm:inline-flex">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-2 lg:pt-24">
        <div>
          <span className="chip border-brand/40 bg-brand/10 text-brand-soft">
            <Zap size={12} /> Duolingo-style progression · LeetCode-style coding
          </span>
          <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Learn to Code.
            <br />
            <span className="bg-gradient-to-r from-brand-soft via-brand to-xp bg-clip-text text-transparent">Level Up.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            Skip the 2,000-problem list. Follow a guided journey through worlds and levels, earn XP for every solution and
            unlock the next challenge as you grow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={start} className="btn-primary px-6 py-3 text-base">
              Start Your Journey <ArrowRight size={18} />
            </Link>
            <Link href={signedIn ? "/challenges" : "/login?next=/challenges"} className="btn-ghost px-6 py-3 text-base">
              Explore Challenges
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-xp" /> 30 hand-made challenges</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-xp" /> Python · C++ · Java</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-xp" /> Free to play</span>
          </div>
        </div>

        {/* hero mock card */}
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand/20 blur-3xl" />
          <div className="card animate-float p-5 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>WORLD 2 · ARRAYS</span>
              <span className="flex items-center gap-3">
                <span className="text-flame">🔥 7</span>
                <span className="text-coin">🪙 340</span>
              </span>
            </div>
            <div className="mt-3 text-xl font-extrabold">Level 11 · Find Maximum Element</div>
            <div className="mt-3 rounded-xl bg-surface2 p-4 font-mono text-sm leading-relaxed">
              <div><span className="text-brand-soft">def</span> maximum(arr):</div>
              <div className="pl-5">best = arr[<span className="text-coin">0</span>]</div>
              <div className="pl-5"><span className="text-brand-soft">for</span> x <span className="text-brand-soft">in</span> arr:</div>
              <div className="pl-10 text-muted"># ...</div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-xp/30 bg-xp/10 p-3 text-sm">
              <span className="font-semibold text-xp">✅ 5 / 5 tests passed</span>
              <span className="font-bold">+100 XP · +10 🪙</span>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted"><span>Level 8</span><span>1,740 / 2,000 XP</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface2"><div className="h-full w-[87%] rounded-full bg-xp" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-line/60 bg-surface/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-extrabold">How it works</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted">One simple loop. Everything in CodeQuest revolves around it.</p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-black text-white shadow-[0_4px_0_0_#4a30c9]">{s.n}</div>
                <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-3xl font-extrabold">Practice that feels like a game</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted">Six focused systems — no clutter, no lives, no paywalls.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6 transition hover:-translate-y-1 hover:border-brand/50">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand-soft"><Icon size={22} /></div>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* JOURNEY PREVIEW */}
      <section id="journey" className="border-t border-line/60 bg-surface/40 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold">Your programming journey</h2>
            <p className="mt-3 text-muted">
              Three worlds take you from your first <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-sm">print</code> to
              recursion, stacks and binary search. Finish a level to unlock the next.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex gap-3"><span className="text-xl">🌱</span><span><b>World 1 · Foundations</b><br /><span className="text-muted">Variables, conditions, loops, functions</span></span></li>
              <li className="flex gap-3"><span className="text-xl">🧱</span><span><b>World 2 · Data Structures</b><br /><span className="text-muted">Arrays, strings, searching, sorting</span></span></li>
              <li className="flex gap-3"><span className="text-xl">🚀</span><span><b>World 3 · Algorithms</b><br /><span className="text-muted">Recursion, binary search, stacks, queues</span></span></li>
            </ul>
          </div>
          <div className="mx-auto flex w-full max-w-xs flex-col items-center">
            {[
              { t: "Variables", s: "done" },
              { t: "Conditions", s: "done" },
              { t: "Loops", s: "current" },
              { t: "Functions", s: "locked" },
            ].map((n, i) => (
              <div key={n.t} className="flex w-full flex-col items-center">
                {i > 0 && <div className={`h-6 w-1 rounded ${n.s === "locked" ? "bg-line" : "bg-xp"}`} />}
                <div
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 font-bold ${
                    n.s === "done"
                      ? "border-xp/40 bg-xp/10 text-xp"
                      : n.s === "current"
                      ? "animate-pulseRing border-brand bg-brand/15 text-brand-soft"
                      : "border-line bg-surface text-muted"
                  }`}
                >
                  {n.t}
                  {n.s === "done" && <CheckCircle2 size={20} />}
                  {n.s === "current" && <Play size={18} />}
                  {n.s === "locked" && <Lock size={18} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <h2 className="text-4xl font-black tracking-tight">Ready to start your quest?</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">Create a free account and solve your first challenge in under five minutes.</p>
        <Link href={start} className="btn-primary mt-8 px-8 py-3.5 text-base">
          Start Your Journey <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="border-t border-line/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted sm:flex-row">
          <Logo />
          <span>© {new Date().getFullYear()} CodeQuest · A gamified programming platform</span>
        </div>
      </footer>
    </div>
  );
}
