import { type IntensityTier, type TopFuel, mixPercentages, type FuelMixMW } from "@/lib/carbon/intensity";
import { tierLabel } from "@/lib/carbon/intensity";

const TIER_RING: Record<IntensityTier, string> = {
  clean: "stroke-[var(--color-clean)]",
  mid: "stroke-[var(--color-mid)]",
  dirty: "stroke-[var(--color-dirty)]",
};

const TIER_GLOW: Record<IntensityTier, string> = {
  clean: "shadow-[0_0_60px_-10px_var(--color-clean)]",
  mid: "shadow-[0_0_60px_-10px_var(--color-mid)]",
  dirty: "shadow-[0_0_60px_-10px_var(--color-dirty)]",
};

export function Dial({
  gPerKWh,
  tier,
  asOf,
  baName,
  topFuel,
  mix,
}: {
  gPerKWh: number;
  tier: IntensityTier;
  asOf: string;
  baName: string;
  topFuel: TopFuel | null;
  mix: FuelMixMW;
}) {
  // Map 50..800 g/kWh to 0..1 for ring fill (covers ~all US BAs)
  const pct = Math.max(0.05, Math.min(1, (gPerKWh - 50) / 750));
  const radius = 90;
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;

  const breakdown = mixPercentages(mix).slice(0, 4);

  return (
    <div className={`flex flex-col items-center gap-4 rounded-3xl bg-[var(--color-card)] p-8 ${TIER_GLOW[tier]}`}>
      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="14" />
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className={TIER_RING[tier]}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold tabular-nums">{Math.round(gPerKWh)}</div>
          <div className="text-xs uppercase tracking-widest text-[var(--color-muted)]">gCO₂ / kWh</div>
        </div>
      </div>

      <div className="text-center">
        <div className="text-lg font-medium">{tierLabel(tier)}</div>
        <div className="text-sm text-[var(--color-muted)]">
          {baName} · as of {new Date(asOf).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>

      {topFuel ? (
        <div className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-center">
          <div className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Powering you right now</div>
          <div className="text-base font-medium">
            {topFuel.label} <span className="text-[var(--color-muted)]">· {topFuel.sharePct}%</span>
          </div>
        </div>
      ) : null}

      {breakdown.length > 0 ? (
        <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
          {breakdown.map((f) => (
            <span key={f.key}>
              {f.label} {f.sharePct}%
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
