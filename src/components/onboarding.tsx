"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Logo } from "./ui";
import { cn } from "@/lib/utils";

const LEVELS = [
  { key: "BEGINNER", emoji: "🌱", title: "Beginner", text: "I'm new to programming" },
  { key: "INTERMEDIATE", emoji: "⚡", title: "Intermediate", text: "I know the basics and want practice" },
  { key: "ADVANCED", emoji: "🔥", title: "Advanced", text: "I'm comfortable and want a challenge" },
] as const;

const INTERESTS = ["Arrays", "Strings", "Algorithms", "Problem Solving", "Python", "C++", "Java"];

export function Onboarding({ username }: { username: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<string>("BEGINNER");
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const toggle = (i: string) => setInterests((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  async function finish() {
    setBusy(true);
    setErr("");
    const lang = interests.includes("C++") ? "cpp" : interests.includes("Java") ? "java" : "python";
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experienceLevel: level, interests, preferredLanguage: lang }),
    });
    if (!res.ok) {
      setErr("Could not save your choices. Please try again.");
      setBusy(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-5 py-10">
      <Logo />
      <div className="mt-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-2 w-12 rounded-full transition-all", i <= step ? "bg-brand" : "bg-line")} />
        ))}
      </div>

      <div className="mt-10 w-full max-w-xl animate-pop">
        {step === 0 && (
          <div className="text-center">
            <div className="text-7xl">👋</div>
            <h1 className="mt-6 text-4xl font-black tracking-tight">Welcome to CodeQuest, {username}!</h1>
            <p className="mt-3 text-lg text-muted">Your programming journey starts here. Let&apos;s set up your path — it takes 20 seconds.</p>
            <button className="btn-primary mt-8 px-8 py-3 text-base" onClick={() => setStep(1)}>Let&apos;s Go</button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-center text-3xl font-extrabold">How much do you already code?</h1>
            <p className="mt-2 text-center text-muted">We&apos;ll use this to shape your starting path.</p>
            <div className="mt-8 space-y-3">
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setLevel(l.key)}
                  className={cn("card flex w-full items-center gap-4 p-5 text-left transition hover:border-brand/60", level === l.key && "border-brand bg-brand/10")}
                >
                  <span className="text-3xl">{l.emoji}</span>
                  <span className="flex-1">
                    <span className="block text-lg font-bold">{l.title}</span>
                    <span className="text-sm text-muted">{l.text}</span>
                  </span>
                  {level === l.key && <Check className="text-brand-soft" />}
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button className="btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(2)}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-center text-3xl font-extrabold">What are you interested in?</h1>
            <p className="mt-2 text-center text-muted">Pick as many as you like — or skip. Choose a language you like too.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {INTERESTS.map((i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={cn("rounded-full border px-5 py-2.5 text-sm font-semibold transition", interests.includes(i) ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand/60")}
                >
                  {i}
                </button>
              ))}
            </div>
            {err && <div className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-center text-sm text-danger">{err}</div>}
            <div className="mt-10 flex justify-between">
              <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button className="btn-success" onClick={finish} disabled={busy}>
                {busy && <Loader2 size={16} className="animate-spin" />} Start my journey
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
