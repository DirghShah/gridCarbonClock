/**
 * Emission factors in gCO2 per kWh of generation.
 * Sourced from EPA eGRID 2022 (US averages) + IPCC AR6 lifecycle medians.
 * ERCOT reports gas as a single bucket; we use a blended ~500 reflecting the
 * mix of combined-cycle and peaker units that actually run on the margin.
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

/**
 * ERCOT's public Fuel Mix Report uses these column names. Values are MW.
 * https://www.ercot.com/gridmktinfo/dashboards/fuelmix
 */
export const ERCOT_FUEL_TO_KEY: Record<string, FuelKey> = {
  Coal: "COAL",
  "Coal and Lignite": "COAL",
  Gas: "GAS",
  "Natural Gas": "GAS",
  "Gas-CC": "GAS_CC",
  "Combined Cycle": "GAS_CC",
  Nuclear: "NUCLEAR",
  Wind: "WIND",
  Solar: "SOLAR",
  Hydro: "HYDRO",
  Biomass: "BIOMASS",
  Other: "OTHER",
  "Power Storage": "OTHER",
  "Battery Storage": "OTHER",
};
