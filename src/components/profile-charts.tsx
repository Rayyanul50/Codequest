"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#7c5cff", "#22d3a5", "#fbbf24", "#fb7a3c", "#f43f5e", "#38bdf8", "#a78bfa", "#34d399"];

const tooltipStyle = {
  contentStyle: { background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, fontSize: 12 },
  labelStyle: { color: "rgb(var(--muted))" },
  cursor: { fill: "rgb(var(--surface2) / 0.6)" },
};
const axis = { stroke: "rgb(var(--muted))", fontSize: 11, tickLine: false, axisLine: false } as const;

export function ProfileCharts({
  weeks,
  days,
  distribution,
}: {
  weeks: { label: string; solved: number }[];
  days: { label: string; xp: number }[];
  distribution: { name: string; value: number }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="font-bold">Problems solved per week</h3>
        <div className="mt-4 h-56">
          <ResponsiveContainer>
            <BarChart data={weeks}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
              <XAxis dataKey="label" {...axis} />
              <YAxis allowDecimals={false} {...axis} width={28} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="solved" name="Solved" fill="#7c5cff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold">XP earned (last 14 days)</h3>
        <div className="mt-4 h-56">
          <ResponsiveContainer>
            <LineChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
              <XAxis dataKey="label" {...axis} interval={2} />
              <YAxis {...axis} width={34} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="xp" name="XP" stroke="#22d3a5" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5 lg:col-span-2">
        <h3 className="font-bold">Topic distribution</h3>
        {distribution.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Solve some challenges to see your topic mix.</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-6">
            <div className="h-56 w-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none">
                    {distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="grid flex-1 gap-2 text-sm sm:grid-cols-2">
              {distribution.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="font-semibold">{d.name}</span>
                  <span className="text-muted">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
