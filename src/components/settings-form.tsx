"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsForm({ username, email, isAdmin }: { username: string; email: string; isAdmin: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(username);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function applyTheme(t: "dark" | "light") {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem("cq_theme", t);
    } catch {
      /* ignore */
    }
  }

  async function save(body: object, okText: string) {
    setMsg(null);
    const res = await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg({ ok: false, text: data.error || "Could not save" });
    setMsg({ ok: true, text: okText });
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function del() {
    if (!confirm("Delete your account permanently? All progress will be lost.")) return;
    const res = await fetch("/api/user/profile", { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else setMsg({ ok: false, text: (await res.json()).error || "Could not delete" });
  }

  return (
    <div className="max-w-2xl space-y-6">
      {msg && (
        <div role="status" className={cn("rounded-xl border px-4 py-3 text-sm", msg.ok ? "border-xp/40 bg-xp/10 text-xp" : "border-danger/40 bg-danger/10 text-danger")}>{msg.text}</div>
      )}

      <section className="card p-6">
        <h2 className="font-bold">Profile</h2>
        <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); save({ username: name }, "Username updated."); }}>
          <div>
            <label className="label" htmlFor="s-email">Email</label>
            <input id="s-email" className="input opacity-70" value={email} disabled />
          </div>
          <div>
            <label className="label" htmlFor="s-name">Username</label>
            <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={3} maxLength={20} />
          </div>
          <button className="btn-primary" disabled={name === username}>Save username</button>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Change password</h2>
        <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); save({ currentPassword: cur, newPassword: next }, "Password changed."); setCur(""); setNext(""); }}>
          <div>
            <label className="label" htmlFor="s-cur">Current password</label>
            <input id="s-cur" type="password" className="input" value={cur} onChange={(e) => setCur(e.target.value)} required autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="s-new">New password</label>
            <input id="s-new" type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} autoComplete="new-password" />
          </div>
          <button className="btn-primary">Update password</button>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Preferences</h2>
        <div className="mt-4">
          <div className="label">Theme</div>
          <div className="inline-flex rounded-xl border border-line bg-surface2 p-1">
            {([["dark", Moon, "Dark"], ["light", Sun, "Light"]] as const).map(([t, Icon, label]) => (
              <button key={t} onClick={() => applyTheme(t)} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition", theme === t ? "bg-brand text-white" : "text-muted hover:text-ink")}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Account</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={logout} className="btn-ghost"><LogOut size={16} /> Log out</button>
          {!isAdmin && <button onClick={del} className="btn-danger"><Trash2 size={16} /> Delete account</button>}
        </div>
      </section>
    </div>
  );
}
