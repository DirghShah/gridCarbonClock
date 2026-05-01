import { EMISSION_FACTORS_G_PER_KWH, type FuelKey } from "./emissionFactors";

export type FuelMixMW = Partial<Record<FuelKey, number>>;

export type IntensityTier = "clean" | "mid" | "dirty";

export const TIER_THRESHOLDS = {
  clean: 300,
  mid: 450,
} as const;

export function tierFor(gPerKWh: number): IntensityTier {
  if (gPerKWh <= TIER_THRESHOLDS.clean) return "clean";
  if (gPerKWh <= TIER_THRESHOLDS.mid) return "mid";
  return "dirty";
}

export function tierLabel(tier: IntensityTier): string {
  switch (tier) {
    case "clean":
      return "Cleaner than usual — go for it";
    case "mid":
      return "About average";
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

/**
 * Forecast intensity from load + renewable forecasts.
 * We don't get a fuel-mix forecast directly, so we infer:
 *   thermal = load - wind - solar - nuclear_baseline - hydro_baseline
 * and attribute thermal to gas (ERCOT's marginal fuel ~always).
 *
 * Inputs in MW. Returns gCO2/kWh.
 */
export function forecastIntensity(args: {
  loadMW: number;
  windMW: number;
  solarMW: number;
  nuclearBaselineMW?: number;
  hydroBaselineMW?: number;
  coalBaselineMW?: number;
}): { gPerKWh: number; mix: FuelMixMW } {
  const nuclear = args.nuclearBaselineMW ?? 5000; // ~5 GW ERCOT nuclear baseline
  const hydro = args.hydroBaselineMW ?? 200;
  const coal = args.coalBaselineMW ?? 4500; // ERCOT coal fleet, runs near baseload
  const wind = Math.max(0, args.windMW);
  const solar = Math.max(0, args.solarMW);
  const renewablesAndBase = wind + solar + nuclear + hydro + coal;
  const gas = Math.max(0, args.loadMW - renewablesAndBase);

  const mix: FuelMixMW = {
    WIND: wind,
    SOLAR: solar,
    NUCLEAR: nuclear,
    HYDRO: hydro,
    COAL: coal,
    GAS: gas,
  };
  return { gPerKWh: intensityFromMix(mix), mix };
}
