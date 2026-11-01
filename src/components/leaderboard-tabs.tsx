"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Empty } from "./ui";
import type { LeaderRow } from "@/lib/queries";

const MEDAL = ["🥇", "🥈", "🥉"];

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-black text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${(h + 50) % 360} 70% 45%))` }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function LeaderboardTabs({ weekly, all }: { weekly: LeaderRow[]; all: LeaderRow[] }) {
  const [tab, setTab] = useState<"weekly" | "all">("weekly");
  const rows = tab === "weekly" ? weekly : all;

  return (
    <>
      <div className="mb-5 inline-flex rounded-xl border border-line bg-surface p-1">
        {(["weekly", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-lg px-5 py-2 text-sm font-bold transition", tab === t ? "bg-brand text-white" : "text-muted hover:text-ink")}>
            {t === "weekly" ? "Weekly" : "All Time"}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty>No one has earned XP {tab === "weekly" ? "this week" : "yet"}. Be the first!</Empty>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[3.5rem_1fr_5rem_5rem] border-b border-line bg-surface2/60 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted sm:grid-cols-[4rem_1fr_6rem_6rem]">
            <span>Rank</span><span>User</span><span className="text-right">XP</span><span className="text-right">Solved</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.userId}
              className={cn(
                "grid grid-cols-[3.5rem_1fr_5rem_5rem] items-center border-b border-line/60 px-4 py-3 last:border-0 sm:grid-cols-[4rem_1fr_6rem_6rem]",
                r.isYou && "bg-brand/10"
              )}
            >
              <span className="text-lg font-black">{r.rank <= 3 ? MEDAL[r.rank - 1] : <span className="text-sm text-muted">{r.rank}</span>}</span>
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={r.username} />
                <span className="truncate font-semibold">{r.username}{r.isYou && <span className="ml-2 chip border-brand/40 bg-brand/15 text-brand-soft">You</span>}</span>
                <span className="hidden text-xs text-muted sm:inline">Lv {r.level}</span>
              </span>
              <span className="text-right font-bold text-xp">{r.xp.toLocaleString()}</span>
              <span className="text-right font-semibold">{r.solved}</span>
            </div>
          ))}
        </div>
      )}
      {!rows.some((r) => r.isYou) && rows.length > 0 && (
        <p className="mt-3 text-center text-sm text-muted">You&apos;re not in the top {rows.length} {tab === "weekly" ? "this week" : "yet"} — solve a challenge to climb!</p>
      )}
    </>
  );
}
