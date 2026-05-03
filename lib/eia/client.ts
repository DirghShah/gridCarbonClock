import { z } from "zod";
import type { FuelMixMW } from "@/lib/carbon/intensity";
import type { FuelKey } from "@/lib/carbon/emissionFactors";
import type { BACode } from "@/lib/zones/balancingAuthorities";

/**
 * EIA Open Data v2 — RTO fuel-type-data endpoint.
 * Free key: https://www.eia.gov/opendata/register.php
 */

const EIA_FUEL_TO_KEY: Record<string, FuelKey> = {
  COL: "COAL",
  NG: "GAS",
  NUC: "NUCLEAR",
  OIL: "OIL",
  SUN: "SOLAR",
  WAT: "HYDRO",
  WND: "WIND",
  OTH: "OTHER",
};

const RowSchema = z.object({
  period: z.string(),
  fueltype: z.string(),
  value: z.union([z.number(), z.string()]).nullable(),
});

const ResponseSchema = z.object({
  response: z.object({ data: z.array(RowSchema) }),
});

function buildUrl(ba: BACode, lengthHours: number, apiKey: string): string {
  const url = new URL("https://api.eia.gov/v2/electricity/rto/fuel-type-data/data/");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("frequency", "hourly");
  url.searchParams.set("data[0]", "value");
  url.searchParams.set("facets[respondent][]", ba);
  url.searchParams.set("sort[0][column]", "period");
  url.searchParams.set("sort[0][direction]", "desc");
  // ~8 fuels per hour, so 8 * lengthHours rows
  url.searchParams.set("length", String(Math.min(5000, lengthHours * 10)));
  return url.toString();
}

export class EiaUnavailable extends Error {}

async function fetchEia(ba: BACode, hours: number) {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) throw new EiaUnavailable("EIA_API_KEY not set");
  const res = await fetch(buildUrl(ba, hours, apiKey), { next: { revalidate: 300 } });
  if (!res.ok) throw new EiaUnavailable(`EIA HTTP ${res.status}`);
  const json = await res.json();
  const parsed = ResponseSchema.safeParse(json);
  if (!parsed.success) throw new EiaUnavailable("EIA schema mismatch");
  return parsed.data.response.data;
}

function rowsToMixByPeriod(rows: { period: string; fueltype: string; value: number | string | null }[]) {
  const byPeriod = new Map<string, FuelMixMW>();
  for (const row of rows) {
    const key = EIA_FUEL_TO_KEY[row.fueltype];
    if (!key || row.value == null) continue;
    const mw = typeof row.value === "string" ? parseFloat(row.value) : row.value;
    if (!Number.isFinite(mw) || mw <= 0) continue;
    const mix = byPeriod.get(row.period) ?? {};
    mix[key] = (mix[key] ?? 0) + mw;
    byPeriod.set(row.period, mix);
  }
  return byPeriod;
}

/** Convert EIA period string ("YYYY-MM-DDTHH" UTC) to ISO. */
function periodToIso(period: string): string {
  return new Date(period + ":00:00Z").toISOString();
}

export async function fetchCurrentMix(ba: BACode): Promise<{ asOf: string; mix: FuelMixMW }> {
  const rows = await fetchEia(ba, 4); // last few hours, take latest complete one
  if (rows.length === 0) throw new EiaUnavailable("EIA empty response");
  const byPeriod = rowsToMixByPeriod(rows);
  const periods = [...byPeriod.keys()].sort();
  const latest = periods[periods.length - 1];
  return { asOf: periodToIso(latest), mix: byPeriod.get(latest)! };
}

export type HourlyMix = { ts: string; mix: FuelMixMW };

export async function fetchHistoricalMix(ba: BACode, hours: number): Promise<HourlyMix[]> {
  const rows = await fetchEia(ba, hours);
  const byPeriod = rowsToMixByPeriod(rows);
  return [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-hours)
    .map(([period, mix]) => ({ ts: periodToIso(period), mix }));
}
