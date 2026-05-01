import { intensityFromMix, tierFor, forecastIntensity } from "@/lib/carbon/intensity";
import { fetchLatestFuelMix } from "@/lib/ercot/fuelMix";
import { fetchForecasts } from "@/lib/ercot/forecast";
import { fetchEiaFuelMix } from "@/lib/eia/client";
import { mockCurrentMix, mockForecasts } from "./mock";
import type { CurrentIntensity, Forecast, ForecastHour } from "@/lib/types";
import type { ErcotZone } from "@/lib/zones/zones";

type Source = "ercot" | "eia" | "mock";

function configuredSource(): Source {
  const v = (process.env.DATA_SOURCE ?? "ercot").toLowerCase();
  if (v === "eia" || v === "mock") return v;
  return "ercot";
}

export async function getCurrentIntensity(zone: ErcotZone): Promise<CurrentIntensity> {
  const source = configuredSource();
  let asOf: string;
  let mix;
  let used: Source = source;

  try {
    if (source === "eia") {
      ({ asOf, mix } = await fetchEiaFuelMix());
    } else if (source === "ercot") {
      ({ asOf, mix } = await fetchLatestFuelMix());
    } else {
      ({ asOf, mix } = mockCurrentMix());
    }
  } catch (err) {
    console.warn(`[grid-carbon] ${source} fuel mix failed, using mock:`, err);
    ({ asOf, mix } = mockCurrentMix());
    used = "mock";
  }

  const gPerKWh = intensityFromMix(mix);
  return { zone, gPerKWh, tier: tierFor(gPerKWh), asOf, mix, source: used };
}

export async function getForecast(zone: ErcotZone): Promise<Forecast> {
  const source = configuredSource();
  let used: Source = source;
  let load, wind, solar;

  try {
    if (source === "ercot") {
      ({ load, wind, solar } = await fetchForecasts());
    } else {
      // EIA doesn't expose hourly fuel-mix forecasts via free API; use mock
      ({ load, wind, solar } = mockForecasts());
      used = "mock";
    }
  } catch (err) {
    console.warn(`[grid-carbon] forecast fetch failed, using mock:`, err);
    ({ load, wind, solar } = mockForecasts());
    used = "mock";
  }

  // Align forecasts on shared timestamps (load is the spine — usually the longest)
  const byTs = new Map<string, { load?: number; wind?: number; solar?: number }>();
  for (const r of load) byTs.set(r.ts, { ...(byTs.get(r.ts) ?? {}), load: r.mw });
  for (const r of wind) byTs.set(r.ts, { ...(byTs.get(r.ts) ?? {}), wind: r.mw });
  for (const r of solar) byTs.set(r.ts, { ...(byTs.get(r.ts) ?? {}), solar: r.mw });

  const now = Date.now();
  const horizon = now + 24 * 3600_000;

  const hours: ForecastHour[] = [...byTs.entries()]
    .map(([ts, v]) => ({ ts, ...v }))
    .filter((row) => {
      const t = new Date(row.ts).getTime();
      return t >= now - 3600_000 && t <= horizon && row.load != null;
    })
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .slice(0, 24)
    .map((row) => {
      const { gPerKWh } = forecastIntensity({
        loadMW: row.load ?? 0,
        windMW: row.wind ?? 0,
        solarMW: row.solar ?? 0,
      });
      return {
        ts: row.ts,
        gPerKWh,
        tier: tierFor(gPerKWh),
        loadMW: row.load ?? 0,
        windMW: row.wind ?? 0,
        solarMW: row.solar ?? 0,
      };
    });

  return { zone, hours, source: used };
}
