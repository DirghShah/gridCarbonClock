/**
 * Emission factors in gCO2 per kWh of generation.
 * Sources: EPA eGRID 2022 (US averages) + IPCC AR6 lifecycle medians.
 *
 * EIA-930 reports natural gas as one bucket (NG); we use a blended ~500
 * reflecting the combined-cycle / peaker mix that actually runs on the margin.
 */
export const EMISSION_FACTORS_G_PER_KWH = {
  COAL: 1000,
  GAS: 500,
  GAS_CC: 450,
  GAS_PEAKER: 650,
  OIL: 800,
  NUCLEAR: 0,
  WIND: 0,
  SOLAR: 0,
  HYDRO: 0,
  BIOMASS: 230,
  OTHER: 230,
} as const;

export type FuelKey = keyof typeof EMISSION_FACTORS_G_PER_KWH;
