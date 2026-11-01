import Link from "next/link";
import { CheckCircle2, Lock, Play, Zap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getJourney } from "@/lib/queries";
import { Container } from "@/components/app-shell";
import { PageHeader, ProgressBar, DifficultyChip } from "@/components/ui";
import { cn } from "@/lib/utils";

export default async function Journey() {
  const user = await requireUser();
  const worlds = await getJourney(user.id);
  const total = worlds.reduce((a, w) => a + w.problems.length, 0);
  const done = worlds.reduce((a, w) => a + w.problems.filter((p) => p.status === "completed").length, 0);

  return (
    <Container>
      <PageHeader
        title="Programming Journey"
        subtitle="Clear each level to unlock the next one."
        right={
          <div className="w-56">
            <div className="mb-1 flex justify-between text-xs font-semibold text-muted">
              <span>Overall</span>
              <span>{done}/{total}</span>
            </div>
            <ProgressBar pct={total ? (done / total) * 100 : 0} />
          </div>
        }
      />

      <div className="space-y-14">
        {worlds.map((w) => {
          const wDone = w.problems.filter((p) => p.status === "completed").length;
          const worldLocked = w.problems.length > 0 && w.problems.every((p) => p.status === "locked");
          return (
            <section key={w.id}>
              <div className={cn("card flex items-center gap-4 p-5", worldLocked && "opacity-60")}>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-3xl">{w.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold uppercase tracking-widest text-brand-soft">World {w.order}</div>
                  <h2 className="text-xl font-extrabold">{w.name}</h2>
                  <p className="truncate text-sm text-muted">{w.description}</p>
                </div>
                <div className="hidden w-36 sm:block">
                  <div className="mb-1 text-right text-xs font-semibold text-muted">{wDone}/{w.problems.length}</div>
                  <ProgressBar pct={w.problems.length ? (wDone / w.problems.length) * 100 : 0} />
                </div>
              </div>

              {/* winding path */}
              <ol className="relative mx-auto mt-6 flex max-w-md flex-col items-stretch">
                {w.problems.map((p, i) => {
                  const offset = ["translate-x-0", "sm:translate-x-10", "sm:translate-x-16", "sm:translate-x-10", "translate-x-0", "sm:-translate-x-10", "sm:-translate-x-16", "sm:-translate-x-10"][i % 8];
                  const prevDone = i > 0 && w.problems[i - 1].status === "completed";
                  const inner = (
                    <div
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border p-4 transition",
                        p.status === "completed" && "border-xp/40 bg-xp/10 hover:border-xp",
                        p.status === "current" && "animate-pulseRing border-brand bg-brand/15 hover:bg-brand/20",
                        p.status === "locked" && "border-line bg-surface opacity-60"
                      )}
                    >
                      <div
                        className={cn(
                          "grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-black",
                          p.status === "completed" && "bg-xp text-[#04251d]",
                          p.status === "current" && "bg-brand text-white",
                          p.status === "locked" && "bg-surface2 text-muted"
                        )}
                      >
                        {p.status === "completed" ? <CheckCircle2 size={22} /> : p.status === "current" ? <Play size={20} /> : <Lock size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                          Level {p.order} · {p.topic}
                        </div>
                        <div className="truncate font-bold">{p.title}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <DifficultyChip d={p.difficulty} />
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-xp"><Zap size={12} />{p.xpReward}</span>
                          {p.isDaily && <span className="chip border-coin/30 bg-coin/10 text-coin">Daily</span>}
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <li key={p.id} className={cn("flex flex-col items-stretch", offset)}>
                      {i > 0 && <div className={cn("mx-auto h-6 w-1 rounded-full", prevDone ? "bg-xp" : "bg-line")} />}
                      {p.status === "locked" ? (
                        <div aria-disabled title="Complete the previous level to unlock">{inner}</div>
                      ) : (
                        <Link href={`/challenge/${p.id}`}>{inner}</Link>
                      )}
                    </li>
                  );
                })}
                {w.problems.length === 0 && <li className="text-center text-sm text-muted">No levels in this world yet.</li>}
              </ol>
            </section>
          );
        })}
      </div>
    </Container>
  );
}
