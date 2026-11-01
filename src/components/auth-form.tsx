"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "./ui";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const router = useRouter();
  const [f, setF] = useState({ username: "", email: "", password: "", confirm: "", agree: false });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (signup) {
      if (f.password !== f.confirm) return setErr("Passwords do not match");
      if (!f.agree) return setErr("Please accept the Terms to continue");
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signup ? { username: f.username, email: f.email, password: f.password } : { email: f.email, password: f.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      const dest = !signup && next && next.startsWith("/") && data.redirect === "/dashboard" ? next : data.redirect;
      router.push(dest);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-8" />
          <h1 className="text-3xl font-extrabold tracking-tight">{signup ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1.5 text-sm text-muted">
            {signup ? "Start your programming journey today." : "Log in to continue your journey."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {signup && (
              <div>
                <label className="label" htmlFor="username">Username</label>
                <input id="username" className="input" placeholder="code_ninja" value={f.username} onChange={set("username")} required minLength={3} maxLength={20} autoComplete="username" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" placeholder="you@example.com" value={f.email} onChange={set("email")} required autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" type={show ? "text" : "password"} className="input pr-10" placeholder={signup ? "At least 8 characters" : "Your password"} value={f.password} onChange={set("password")} required minLength={signup ? 8 : 1} autoComplete={signup ? "new-password" : "current-password"} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label="Toggle password visibility">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {signup && (
              <>
                <div>
                  <label className="label" htmlFor="confirm">Confirm password</label>
                  <input id="confirm" type={show ? "text" : "password"} className="input" placeholder="Repeat password" value={f.confirm} onChange={set("confirm")} required autoComplete="new-password" />
                </div>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted">
                  <input type="checkbox" checked={f.agree} onChange={set("agree")} className="mt-0.5 h-4 w-4 accent-[#7c5cff]" />
                  <span>I agree to the <span className="text-brand-soft underline">Terms</span> and Privacy Policy</span>
                </label>
              </>
            )}
            {!signup && (
              <div className="text-right text-sm">
                <button type="button" onClick={() => setErr("Password reset is not part of the MVP yet — ask an admin or create a new account.")} className="text-brand-soft hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            {err && <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{err}</div>}

            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy && <Loader2 size={16} className="animate-spin" />}
              {signup ? "Create Account" : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {signup ? (
              <>Already have an account? <Link href="/login" className="font-semibold text-brand-soft hover:underline">Log in</Link></>
            ) : (
              <>Don&apos;t have an account? <Link href="/signup" className="font-semibold text-brand-soft hover:underline">Sign up</Link></>
            )}
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-[#3b82f6] lg:block">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #fff 0, transparent 40%), radial-gradient(circle at 80% 70%, #22d3a5 0, transparent 35%)" }} />
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-white">
          <div className="animate-float text-8xl">⚔️</div>
          <h2 className="mt-8 text-center text-4xl font-black leading-tight">Every bug you squash<br />is XP in your pocket.</h2>
          <div className="mt-8 flex gap-3 text-sm font-semibold">
            <span className="rounded-full bg-white/15 px-4 py-1.5">🔥 Streaks</span>
            <span className="rounded-full bg-white/15 px-4 py-1.5">🏆 Badges</span>
            <span className="rounded-full bg-white/15 px-4 py-1.5">🪙 Coins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
