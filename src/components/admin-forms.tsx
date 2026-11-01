"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProblemFormValues = {
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: string;
  worldId: number;
  xpReward: number;
  coinReward: number;
  starterCode: { python: string; cpp: string; java: string };
  solutionExplanation: string;
  isDaily: boolean;
  active: boolean;
  testCases: { input: string; expectedOutput: string; hidden: boolean }[];
};

const DEFAULTS = { EASY: [100, 10], MEDIUM: [150, 20], HARD: [250, 30] } as const;

const EMPTY: ProblemFormValues = {
  title: "",
  description: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  difficulty: "EASY",
  topic: "",
  worldId: 0,
  xpReward: 100,
  coinReward: 10,
  starterCode: {
    python: "# read input and write your code here\n",
    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // write your code here\n    return 0;\n}\n",
    java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // write your code here\n    }\n}\n",
  },
  solutionExplanation: "",
  isDaily: false,
  active: true,
  testCases: [
    { input: "", expectedOutput: "", hidden: false },
    { input: "", expectedOutput: "", hidden: true },
  ],
};

export function ProblemForm({
  worlds,
  topics,
  initial,
  id,
}: {
  worlds: { id: number; name: string }[];
  topics: string[];
  initial?: ProblemFormValues;
  id?: number;
}) {
  const router = useRouter();
  const [f, setF] = useState<ProblemFormValues>(initial ?? { ...EMPTY, worldId: worlds[0]?.id ?? 0 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const up = <K extends keyof ProblemFormValues>(k: K, v: ProblemFormValues[K]) => setF((p) => ({ ...p, [k]: v }));
  const setCase = (i: number, patch: Partial<ProblemFormValues["testCases"][number]>) =>
    up("testCases", f.testCases.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const body = { ...f, testCases: f.testCases.filter((c) => c.input.trim() || c.expectedOutput.trim()).map((c) => ({ ...c, input: c.input.endsWith("\n") ? c.input : c.input + "\n" })) };
    const res = await fetch(id ? `/api/admin/problems/${id}` : "/api/admin/problems", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Could not save");
      setBusy(false);
      return;
    }
    router.push("/admin/problems");
    router.refresh();
  }

  const samples = f.testCases.map((c, i) => ({ c, i })).filter((x) => !x.c.hidden);
  const hidden = f.testCases.map((c, i) => ({ c, i })).filter((x) => x.c.hidden);

  const caseEditor = ({ c, i }: { c: ProblemFormValues["testCases"][number]; i: number }) => (
    <div key={i} className="grid gap-3 rounded-xl border border-line bg-surface2/50 p-3 sm:grid-cols-[1fr_1fr_auto]">
      <div>
        <label className="label">Input</label>
        <textarea className="input min-h-[70px] font-mono" value={c.input} onChange={(e) => setCase(i, { input: e.target.value })} />
      </div>
      <div>
        <label className="label">Expected output</label>
        <textarea className="input min-h-[70px] font-mono" value={c.expectedOutput} onChange={(e) => setCase(i, { expectedOutput: e.target.value })} />
      </div>
      <button type="button" className="btn-ghost self-start px-3 py-2 text-danger" onClick={() => up("testCases", f.testCases.filter((_, j) => j !== i))} aria-label="Remove test case"><Trash2 size={16} /></button>
    </div>
  );

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <section className="card space-y-4 p-6">
        <div>
          <label className="label">Title</label>
          <input className="input" value={f.title} onChange={(e) => up("title", e.target.value)} required />
        </div>
        <div>
          <label className="label">Description (use `backticks` for inline code)</label>
          <textarea className="input min-h-[120px]" value={f.description} onChange={(e) => up("description", e.target.value)} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label">Input format</label><textarea className="input min-h-[70px]" value={f.inputFormat} onChange={(e) => up("inputFormat", e.target.value)} /></div>
          <div><label className="label">Output format</label><textarea className="input min-h-[70px]" value={f.outputFormat} onChange={(e) => up("outputFormat", e.target.value)} /></div>
          <div><label className="label">Constraints</label><textarea className="input min-h-[70px]" value={f.constraints} onChange={(e) => up("constraints", e.target.value)} /></div>
        </div>
      </section>

      <section className="card grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Difficulty</label>
          <select className="input" value={f.difficulty} onChange={(e) => { const d = e.target.value as ProblemFormValues["difficulty"]; setF((p) => ({ ...p, difficulty: d, xpReward: DEFAULTS[d][0], coinReward: DEFAULTS[d][1] })); }}>
            <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
          </select>
        </div>
        <div>
          <label className="label">Topic</label>
          <input className="input" list="topics" value={f.topic} onChange={(e) => up("topic", e.target.value)} required />
          <datalist id="topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
        </div>
        <div>
          <label className="label">World</label>
          <select className="input" value={f.worldId} onChange={(e) => up("worldId", Number(e.target.value))}>
            {worlds.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">XP</label><input type="number" min={0} className="input" value={f.xpReward} onChange={(e) => up("xpReward", Number(e.target.value))} /></div>
          <div><label className="label">Coins</label><input type="number" min={0} className="input" value={f.coinReward} onChange={(e) => up("coinReward", Number(e.target.value))} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-[#7c5cff]" checked={f.isDaily} onChange={(e) => up("isDaily", e.target.checked)} /> Daily challenge</label>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-[#7c5cff]" checked={f.active} onChange={(e) => up("active", e.target.checked)} /> Active (visible)</label>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-bold">Starter code</h2>
        {(["python", "cpp", "java"] as const).map((l) => (
          <div key={l}>
            <label className="label">{l === "cpp" ? "C++" : l[0].toUpperCase() + l.slice(1)}</label>
            <textarea className="input min-h-[110px] font-mono text-xs" value={f.starterCode[l]} onChange={(e) => up("starterCode", { ...f.starterCode, [l]: e.target.value })} />
          </div>
        ))}
        <div>
          <label className="label">Solution explanation</label>
          <textarea className="input min-h-[80px]" value={f.solutionExplanation} onChange={(e) => up("solutionExplanation", e.target.value)} />
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Sample test cases <span className="text-xs font-normal text-muted">(visible to players, used by Run)</span></h2>
          <button type="button" className="btn-ghost px-3 py-1.5" onClick={() => up("testCases", [...f.testCases, { input: "", expectedOutput: "", hidden: false }])}><Plus size={14} /> Add</button>
        </div>
        {samples.map(caseEditor)}
        <div className="flex items-center justify-between pt-2">
          <h2 className="font-bold">Hidden test cases <span className="text-xs font-normal text-muted">(only used by Submit)</span></h2>
          <button type="button" className="btn-ghost px-3 py-1.5" onClick={() => up("testCases", [...f.testCases, { input: "", expectedOutput: "", hidden: true }])}><Plus size={14} /> Add</button>
        </div>
        {hidden.map(caseEditor)}
      </section>

      {err && <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{err}</div>}
      <div className="flex gap-3">
        <button className={cn("btn-primary px-8")} disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />} Save Problem</button>
        <button type="button" className="btn-ghost" onClick={() => router.push("/admin/problems")}>Cancel</button>
      </div>
    </form>
  );
}

export function DeleteProblemButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  return (
    <button
      className="btn-ghost px-3 py-1.5 text-danger"
      onClick={async () => {
        if (!confirm(`Delete "${title}"? Submissions and progress for it will be removed.`)) return;
        await fetch(`/api/admin/problems/${id}`, { method: "DELETE" });
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}

export function UserActiveToggle({ userId, active, disabled }: { userId: string; active: boolean; disabled?: boolean }) {
  const router = useRouter();
  return (
    <button
      disabled={disabled}
      className={cn("btn-ghost px-3 py-1.5", active ? "text-danger" : "text-xp")}
      onClick={async () => {
        await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, active: !active }) });
        router.refresh();
      }}
    >
      {active ? "Deactivate" : "Reactivate"}
    </button>
  );
}

export function WorldForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", description: "", emoji: "🌍" });
  const [err, setErr] = useState("");
  return (
    <form
      className="card grid gap-4 p-5 sm:grid-cols-[4rem_1fr_2fr_auto]"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr("");
        const res = await fetch("/api/admin/worlds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        if (!res.ok) return setErr((await res.json()).error || "Failed");
        setF({ name: "", description: "", emoji: "🌍" });
        router.refresh();
      }}
    >
      <div><label className="label">Icon</label><input className="input text-center" value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} maxLength={4} /></div>
      <div><label className="label">Name</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
      <div><label className="label">Description</label><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required /></div>
      <button className="btn-primary self-end">Add world</button>
      {err && <div className="text-sm text-danger sm:col-span-4">{err}</div>}
    </form>
  );
}

export function DeleteWorldButton({ id }: { id: number }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  return (
    <>
      <button
        className="btn-ghost px-3 py-1.5 text-danger"
        onClick={async () => {
          const res = await fetch(`/api/admin/worlds?id=${id}`, { method: "DELETE" });
          if (!res.ok) return setErr((await res.json()).error || "Failed");
          router.refresh();
        }}
      >
        Delete
      </button>
      {err && <span className="ml-2 text-xs text-danger">{err}</span>}
    </>
  );
}
