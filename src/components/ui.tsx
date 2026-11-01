import Link from "next/link";
import { Swords } from "lucide-react";
import { cn, DIFF_LABEL, DIFF_STYLE } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-extrabold tracking-tight", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white shadow-[0_3px_0_0_#4a30c9]">
        <Swords size={18} />
      </span>
      <span className="text-lg">
        Code<span className="text-brand-soft">Quest</span>
      </span>
    </Link>
  );
}

export function ProgressBar({
  pct,
  color = "bg-xp",
  className,
}: {
  pct: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-surface2", className)}>
      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function DifficultyChip({ d }: { d: string }) {
  return <span className={cn("chip", DIFF_STYLE[d])}>{DIFF_LABEL[d] ?? d}</span>;
}

export function Stat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <span className={accent}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card p-10 text-center text-sm text-muted">{children}</div>;
}
