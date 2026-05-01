import type { FuelMixMW, IntensityTier } from "@/lib/carbon/intensity";

export type CurrentIntensity = {
  zone: string;
  gPerKWh: number;
  tier: IntensityTier;
  asOf: string; // ISO
  mix: FuelMixMW;
  source: "ercot" | "eia" | "mock";
};

export type ForecastHour = {
  ts: string; // ISO, top-of-hour local→UTC
  gPerKWh: number;
  tier: IntensityTier;
  loadMW: number;
  windMW: number;
  solarMW: number;
};

export type Forecast = {
  zone: string;
  hours: ForecastHour[];
  source: "ercot" | "eia" | "mock";
};
