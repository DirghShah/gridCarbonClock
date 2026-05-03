import { EMISSION_FACTORS_G_PER_KWH, type FuelKey } from "./emissionFactors";
import { getBA, type BACode } from "@/lib/zones/balancingAuthorities";

export type FuelMixMW = Partial<Record<FuelKey, number>>;

export type IntensityTier = "clean" | "mid" | "dirty";

/** Fallback thresholds used when no BA-specific calibration is available. */
export const DEFAULT_THRESHOLDS = { clean: 250, dirty: 450 } as const;

export function tierFor(gPerKWh: number, ba?: BACode): IntensityTier {
  const t = ba ? getBA(ba) : null;
  const cleanCutoff = t?.cleanCutoff ?? DEFAULT_THRESHOLDS.clean;
  const dirtyCutoff = t?.dirtyCutoff ?? DEFAULT_THRESHOLDS.dirty;
  if (gPerKWh <= cleanCutoff) return "clean";
  if (gPerKWh <= dirtyCutoff) return "mid";
  return "dirty";
}

export function tierLabel(tier: IntensityTier): string {
  switch (tier) {
    case "clean":
      return "Cleaner than usual — go for it";
    case "mid":
      return "About average for your grid";
    case "dirty":
      return "Dirty hour — wait if you can";
  }
}

/**
 * Compute carbon intensity (gCO2/kWh) from a fuel-mix snapshot in MW.
 * intensity = sum(MW_i * EF_i) / sum(MW_i)
 */
export function intensityFromMix(mix: FuelMixMW): number {
  let totalMW = 0;
  let weightedG = 0;
  for (const [fuel, mw] of Object.entries(mix) as [FuelKey, number][]) {
    if (!mw || mw <= 0) continue;
    totalMW += mw;
    weightedG += mw * EMISSION_FACTORS_G_PER_KWH[fuel];
  }
  if (totalMW === 0) return 0;
  return Math.round(weightedG / totalMW);
}

export type TopFuel = { key: FuelKey; label: string; sharePct: number; mw: number };

const FUEL_LABEL: Record<FuelKey, string> = {
  COAL: "Coal",
  GAS: "Natural gas",
  GAS_CC: "Natural gas (combined cycle)",
  GAS_PEAKER: "Natural gas (peaker)",
  OIL: "Oil",
  NUCLEAR: "Nuclear",
  WIND: "Wind",
  SOLAR: "Solar",
  HYDRO: "Hydro",
  BIOMASS: "Biomass",
  OTHER: "Other",
};

export function topFuelFromMix(mix: FuelMixMW): TopFuel | null {
  let total = 0;
  let best: { key: FuelKey; mw: number } | null = null;
  for (const [fuel, mw] of Object.entries(mix) as [FuelKey, number][]) {
    if (!mw || mw <= 0) continue;
    total += mw;
    if (!best || mw > best.mw) best = { key: fuel, mw };
  }
  if (!best || total === 0) return null;
  return {
    key: best.key,
    label: FUEL_LABEL[best.key],
    sharePct: Math.round((best.mw / total) * 100),
    mw: Math.round(best.mw),
  };
}

/**
 * Sorted breakdown of a fuel mix as percentages, descending.
 */
export function mixPercentages(mix: FuelMixMW): { key: FuelKey; label: string; sharePct: number }[] {
  const total = Object.values(mix).reduce<number>((s, v) => s + (v && v > 0 ? v : 0), 0);
  if (total === 0) return [];
  return (Object.entries(mix) as [FuelKey, number][])
    .filter(([, mw]) => mw > 0)
    .map(([key, mw]) => ({ key, label: FUEL_LABEL[key], sharePct: Math.round((mw / total) * 100) }))
    .sort((a, b) => b.sharePct - a.sharePct);
}
