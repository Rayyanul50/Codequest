"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, Play, Search } from "lucide-react";
import { DifficultyChip, Empty } from "./ui";
import { cn } from "@/lib/utils";

type Row = {
  id: number;
  order: number;
  title: string;
  topic: string;
  world: string;
  difficulty: string;
  xpReward: number;
  status: "completed" | "current" | "locked";
  isDaily: boolean;
};

const DIFFS = ["ALL", "EASY", "MEDIUM", "HARD"] as const;

export function ChallengeList({ rows, topics }: { rows: Row[]; topics: string[] }) {
  const [diff, setDiff] = useState<(typeof DIFFS)[number]>("ALL");
  const [topic, setTopic] = useState("ALL");
  const [q, setQ] = useState("");

  const list = useMemo(
    () =>
      rows.filter(
        (r) =>
          (diff === "ALL" || r.difficulty === diff) &&
          (topic === "ALL" || r.topic === topic) &&
          r.title.toLowerCase().includes(q.toLowerCase())
      ),
    [rows, diff, topic, q]
  );

  const pill = (active: boolean) =>
    cn("rounded-full border px-4 py-1.5 text-sm font-semibold transition", active ? "border-brand bg-brand text-white" : "border-line bg-surface text-muted hover:text-ink");

  return (
    <>
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search challenges…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {DIFFS.map((d) => (
            <button key={d} className={pill(diff === d)} onClick={() => setDiff(d)}>
              {d === "ALL" ? "All" : d[0] + d.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", ...topics].map((t) => (
            <button key={t} className={pill(topic === t)} onClick={() => setTopic(t)}>
              {t === "ALL" ? "All topics" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {list.map((r) => {
          const body = (
            <div
              className={cn(
                "card flex h-full items-center gap-4 p-4 transition",
                r.status === "locked" ? "opacity-55" : "hover:-translate-y-0.5 hover:border-brand/60",
                r.status === "current" && "border-brand/60"
              )}
            >
              <div className="text-sm font-black text-muted">#{String(r.order).padStart(2, "0")}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{r.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{r.topic}</span>
                  <DifficultyChip d={r.difficulty} />
                  <span className="font-semibold text-xp">+{r.xpReward} XP</span>
                  {r.isDaily && <span className="chip border-coin/30 bg-coin/10 text-coin">Daily</span>}
                </div>
              </div>
              {r.status === "completed" && <span className="flex items-center gap-1 text-xs font-semibold text-xp"><CheckCircle2 size={16} /> Done</span>}
              {r.status === "current" && <span className="flex items-center gap-1 text-xs font-semibold text-brand-soft"><Play size={16} /> Play</span>}
              {r.status === "locked" && <Lock size={16} className="text-muted" />}
            </div>
          );
          return r.status === "locked" && !r.isDaily ? (
            <div key={r.id} title="Locked">{body}</div>
          ) : (
            <Link key={r.id} href={`/challenge/${r.id}`}>{body}</Link>
          );
        })}
      </div>
      {list.length === 0 && <div className="mt-6"><Empty>No challenges match your filters.</Empty></div>}
    </>
  );
}
