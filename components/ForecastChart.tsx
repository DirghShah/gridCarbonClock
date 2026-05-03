"use client";

import { Bar, BarChart, Cell, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ForecastHour } from "@/lib/types";

const TIER_COLOR = {
  clean: "var(--color-clean)",
  mid: "var(--color-mid)",
  dirty: "var(--color-dirty)",
} as const;

export function ForecastChart({
  hours,
  highlightStart,
  highlightEnd,
}: {
  hours: ForecastHour[];
  highlightStart?: string;
  highlightEnd?: string;
}) {
  const data = hours.map((h) => ({
    ...h,
    hour: new Date(h.ts).toLocaleTimeString([], { hour: "numeric" }).toLowerCase().replace(" ", ""),
  }));

  return (
    <div className="rounded-3xl bg-[var(--color-card)] p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Next 24 hours</h2>
        <div className="flex gap-3 text-xs text-[var(--color-muted)]">
          <Legend color={TIER_COLOR.clean} label="Cleanest" />
          <Legend color={TIER_COLOR.mid} label="Average" />
          <Legend color={TIER_COLOR.dirty} label="Dirtiest" />
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="hour" tick={{ fill: "var(--color-muted)", fontSize: 11 }} interval={2} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            {highlightStart && highlightEnd ? (
              <ReferenceArea
                x1={data.find((d) => d.ts === highlightStart)?.hour}
                x2={data.find((d) => d.ts === highlightEnd)?.hour}
                strokeOpacity={0}
                fill="var(--color-clean)"
                fillOpacity={0.08}
              />
            ) : null}
            <Tooltip
              contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
              labelStyle={{ color: "var(--color-fg)" }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const row = payload[0].payload as ForecastHour & { hour: string };
                return (
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm">
                    <div className="font-medium">{row.hour}</div>
                    <div>{Math.round(row.gPerKWh)} gCO₂/kWh</div>
                    {row.topFuel ? (
                      <div className="text-xs text-[var(--color-muted)]">
                        Mostly {row.topFuel.label.toLowerCase()} ({row.topFuel.sharePct}%)
                      </div>
                    ) : null}
                  </div>
                );
              }}
            />
            <Bar dataKey="gPerKWh" radius={[4, 4, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.ts} fill={TIER_COLOR[d.tier]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
