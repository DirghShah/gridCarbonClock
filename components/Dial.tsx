import { tierFor, tierLabel, type IntensityTier } from "@/lib/carbon/intensity";

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

export function Dial({ gPerKWh, asOf, zone }: { gPerKWh: number; asOf: string; zone: string }) {
  const tier = tierFor(gPerKWh);
  // Map 100..700 g/kWh to 0..1 for ring fill
  const pct = Math.max(0, Math.min(1, (gPerKWh - 100) / 600));
  const radius = 90;
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;

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
          {zone} · as of {new Date(asOf).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
