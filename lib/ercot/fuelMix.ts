import { z } from "zod";
import { ERCOT_FUEL_TO_KEY } from "@/lib/carbon/emissionFactors";
import type { FuelMixMW } from "@/lib/carbon/intensity";
import { ercotFetch } from "./client";

const FUEL_MIX_URL =
  "https://www.ercot.com/api/1/services/read/dashboards/fuel-mix.json";

/**
 * ERCOT publishes the most recent fuel mix snapshot at this dashboard endpoint.
 * Schema is loosely:
 *   { data: { "<YYYY-MM-DD HH:MM:SS>": { "<Fuel Name>": { gen: <MW>, ... }, ... } } }
 * We grab the most recent timestamp and normalize fuel names to our FuelKey enum.
 */
const Schema = z.object({
  data: z.record(
    z.string(),
    z.record(z.string(), z.object({ gen: z.number().optional() }).passthrough()),
  ),
});

export async function fetchLatestFuelMix(): Promise<{ asOf: string; mix: FuelMixMW }> {
  const res = await ercotFetch(FUEL_MIX_URL);
  if (!res.ok) throw new Error(`ERCOT fuel mix HTTP ${res.status}`);
  const json = await res.json();
  const parsed = Schema.safeParse(json);
  if (!parsed.success) throw new Error("ERCOT fuel mix schema mismatch");

  const timestamps = Object.keys(parsed.data.data).sort();
  if (timestamps.length === 0) throw new Error("ERCOT fuel mix empty");
  const latest = timestamps[timestamps.length - 1];
  const snapshot = parsed.data.data[latest];

  const mix: FuelMixMW = {};
  for (const [name, entry] of Object.entries(snapshot)) {
    const key = ERCOT_FUEL_TO_KEY[name];
    const mw = entry.gen ?? 0;
    if (!key || mw <= 0) continue;
    mix[key] = (mix[key] ?? 0) + mw;
  }

  return { asOf: new Date(latest.replace(" ", "T") + "-05:00").toISOString(), mix };
}
