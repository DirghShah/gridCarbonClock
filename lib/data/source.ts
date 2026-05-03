import { intensityFromMix, tierFor, topFuelFromMix } from "@/lib/carbon/intensity";
import { fetchCurrentMix, fetchHistoricalMix, EiaUnavailable } from "@/lib/eia/client";
import { buildPatternForecast } from "@/lib/forecast/historicalPattern";
import { mockCurrentMix, mockHistory } from "./mock";
import { getBA, type BACode } from "@/lib/zones/balancingAuthorities";
import type { CurrentIntensity, Forecast, ForecastHour } from "@/lib/types";

const FORCE_MOCK = (process.env.DATA_SOURCE ?? "").toLowerCase() === "mock";

export async function getCurrentIntensity(ba: BACode): Promise<CurrentIntensity> {
  let asOf: string;
  let mix;
  let used: "eia" | "mock" = "eia";

  if (FORCE_MOCK) {
    ({ asOf, mix } = mockCurrentMix(ba));
    used = "mock";
  } else {
    try {
      ({ asOf, mix } = await fetchCurrentMix(ba));
    } catch (err) {
      if (!(err instanceof EiaUnavailable)) console.warn(`[grid-carbon] EIA current failed:`, err);
      ({ asOf, mix } = mockCurrentMix(ba));
      used = "mock";
    }
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
    source: used,
  };
}

export async function getForecast(ba: BACode): Promise<Forecast> {
  let history;
  let used: "eia" | "mock" = "eia";

  if (FORCE_MOCK) {
    history = mockHistory(ba, 168);
    used = "mock";
  } else {
    try {
      history = await fetchHistoricalMix(ba, 168); // last 7 days
      if (history.length < 24) throw new EiaUnavailable("Not enough history");
    } catch (err) {
      if (!(err instanceof EiaUnavailable)) console.warn(`[grid-carbon] EIA history failed:`, err);
      history = mockHistory(ba, 168);
      used = "mock";
    }
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

  return { ba, baName: getBA(ba).name, hours, source: used };
}
