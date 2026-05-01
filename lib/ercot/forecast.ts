import { z } from "zod";
import { ercotFetch } from "./client";

/**
 * ERCOT publishes day-ahead load, wind, and solar forecasts on their public
 * dashboards. We use the JSON feeds backing those dashboards.
 *
 * NOTE: ERCOT's reports are not zone-broken-out for renewables (system-wide).
 * Load forecast IS by zone. For the consumer use case, system-wide intensity
 * is what matters anyway (the grid is one network), so we use system totals.
 */
const LOAD_URL =
  "https://www.ercot.com/api/1/services/read/dashboards/systemWideDemand.json";
const WIND_URL =
  "https://www.ercot.com/api/1/services/read/dashboards/wind-forecast.json";
const SOLAR_URL =
  "https://www.ercot.com/api/1/services/read/dashboards/solar-forecast.json";

type HourlyMW = { ts: string; mw: number };

const HourlySchema = z.object({
  forecast: z
    .array(
      z.object({
        // ERCOT timestamps are local "YYYY-MM-DD HH:MM:SS" America/Chicago
        timestamp: z.string(),
        // Field name varies: "value", "forecast", "stppfSystemWide", etc.
        value: z.number().optional(),
        forecast: z.number().optional(),
        actual: z.number().optional(),
      }),
    )
    .optional(),
  data: z.array(z.unknown()).optional(),
});

async function fetchHourly(url: string): Promise<HourlyMW[]> {
  const res = await ercotFetch(url);
  if (!res.ok) throw new Error(`ERCOT forecast HTTP ${res.status}`);
  const json = await res.json();
  const parsed = HourlySchema.safeParse(json);
  if (!parsed.success || !parsed.data.forecast) {
    throw new Error("ERCOT forecast schema mismatch");
  }
  return parsed.data.forecast.map((row) => ({
    ts: new Date(row.timestamp.replace(" ", "T") + "-05:00").toISOString(),
    mw: row.value ?? row.forecast ?? row.actual ?? 0,
  }));
}

export async function fetchForecasts(): Promise<{
  load: HourlyMW[];
  wind: HourlyMW[];
  solar: HourlyMW[];
}> {
  const [load, wind, solar] = await Promise.all([
    fetchHourly(LOAD_URL),
    fetchHourly(WIND_URL),
    fetchHourly(SOLAR_URL),
  ]);
  return { load, wind, solar };
}
