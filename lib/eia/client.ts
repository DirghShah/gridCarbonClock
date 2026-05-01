import { z } from "zod";
import type { FuelMixMW } from "@/lib/carbon/intensity";
import type { FuelKey } from "@/lib/carbon/emissionFactors";

/**
 * EIA Open Data v2 API. Free key: https://www.eia.gov/opendata/register.php
 * We use the RTO fuel-type-data endpoint with respondent=ERCO.
 *
 * Fuel codes returned by EIA:
 *   COL=coal, NG=natural gas, NUC=nuclear, OIL=oil, SUN=solar,
 *   WAT=hydro, WND=wind, OTH=other
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

const ResponseSchema = z.object({
  response: z.object({
    data: z.array(
      z.object({
        period: z.string(),
        fueltype: z.string(),
        value: z.union([z.number(), z.string()]),
      }),
    ),
  }),
});

export async function fetchEiaFuelMix(): Promise<{ asOf: string; mix: FuelMixMW }> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) throw new Error("EIA_API_KEY not set");

  const url = new URL("https://api.eia.gov/v2/electricity/rto/fuel-type-data/data/");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("frequency", "hourly");
  url.searchParams.set("data[0]", "value");
  url.searchParams.set("facets[respondent][]", "ERCO");
  url.searchParams.set("sort[0][column]", "period");
  url.searchParams.set("sort[0][direction]", "desc");
  url.searchParams.set("length", "20"); // most recent ~2-3 hours across fuels

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`EIA HTTP ${res.status}`);
  const json = await res.json();
  const parsed = ResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("EIA schema mismatch");

  const rows = parsed.data.response.data;
  if (rows.length === 0) throw new Error("EIA empty response");

  // Pick the most recent period and aggregate fuel types within it
  const latestPeriod = rows[0].period;
  const latestRows = rows.filter((r) => r.period === latestPeriod);

  const mix: FuelMixMW = {};
  for (const row of latestRows) {
    const key = EIA_FUEL_TO_KEY[row.fueltype];
    if (!key) continue;
    const mw = typeof row.value === "string" ? parseFloat(row.value) : row.value;
    if (!Number.isFinite(mw) || mw <= 0) continue;
    mix[key] = (mix[key] ?? 0) + mw;
  }

  // EIA periods are UTC like "2025-05-01T18"
  return { asOf: new Date(latestPeriod + ":00:00Z").toISOString(), mix };
}
