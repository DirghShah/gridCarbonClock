import type { FuelMixMW, IntensityTier, TopFuel } from "@/lib/carbon/intensity";
import type { BACode } from "@/lib/zones/balancingAuthorities";

export type CurrentIntensity = {
  ba: BACode;
  baName: string;
  gPerKWh: number;
  tier: IntensityTier;
  asOf: string; // ISO
  mix: FuelMixMW;
  topFuel: TopFuel | null;
  source: "eia" | "mock";
};

export type ForecastHour = {
  ts: string; // ISO
  gPerKWh: number;
  tier: IntensityTier;
  topFuel: TopFuel | null;
};

export type Forecast = {
  ba: BACode;
  baName: string;
  hours: ForecastHour[];
  source: "eia" | "mock";
};
