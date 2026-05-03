import { intensityFromMix, tierFor, topFuelFromMix } from "@/lib/carbon/intensity";
import { fetchCurrentMix, fetchHistoricalMix, EiaUnavailable } from "@/lib/eia/client";
import { buildPatternForecast } from "@/lib/forecast/historicalPattern";
import { getBA, type BACode } from "@/lib/zones/balancingAuthorities";
import type { CurrentIntensity, Forecast, ForecastHour } from "@/lib/types";

export class GridDataUnavailable extends Error {
  constructor(public readonly reason: "no-key" | "eia-down" | "eia-empty", message: string) {
    super(message);
  }
}

function ensureKey() {
  if (!process.env.EIA_API_KEY) {
    throw new GridDataUnavailable(
      "no-key",
      "EIA_API_KEY not configured. Set it in your environment to enable live data.",
    );
  }
}

export async function getCurrentIntensity(ba: BACode): Promise<CurrentIntensity> {
  ensureKey();
  let asOf: string;
  let mix;
  try {
    ({ asOf, mix } = await fetchCurrentMix(ba));
  } catch (err) {
    if (err instanceof EiaUnavailable) {
      throw new GridDataUnavailable("eia-down", err.message);
    }
    throw new GridDataUnavailable("eia-down", String(err));
  }
  const gPerKWh = intensityFromMix(mix);
  return {
    ba,
    baName: getBA(ba).name,
    gPerKWh,
    tier: tierFor(gPerKWh, ba),
    asOf,
    mix,
    topFuel: topFuelFromMix(mix),
    source: "eia",
  };
}

export async function getForecast(ba: BACode): Promise<Forecast> {
  ensureKey();
  let history;
  try {
    history = await fetchHistoricalMix(ba, 168);
    if (history.length < 24) {
      throw new GridDataUnavailable("eia-empty", "Not enough EIA history to build a forecast");
    }
  } catch (err) {
    if (err instanceof GridDataUnavailable) throw err;
    if (err instanceof EiaUnavailable) {
      throw new GridDataUnavailable("eia-down", err.message);
    }
    throw new GridDataUnavailable("eia-down", String(err));
  }

  const pattern = buildPatternForecast(history);
  const hours: ForecastHour[] = pattern.map((row) => {
    const g = intensityFromMix(row.mix);
    return {
      ts: row.ts,
      gPerKWh: g,
      tier: tierFor(g, ba),
      topFuel: topFuelFromMix(row.mix),
    };
  });

  return { ba, baName: getBA(ba).name, hours, source: "eia" };
}
