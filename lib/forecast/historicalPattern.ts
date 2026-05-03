import type { HourlyMix } from "@/lib/eia/client";
import type { FuelMixMW } from "@/lib/carbon/intensity";
import type { FuelKey } from "@/lib/carbon/emissionFactors";

/**
 * Build a 24-hour forecast by averaging the past 7 days of fuel-mix data
 * by hour-of-day. Honest baseline: this BA's typical pattern, not a true
 * weather-aware forecast (we'd need WattTime / Electricity Maps for that).
 *
 * Returns 24 entries starting at the next top-of-hour, in chronological order.
 */
export function buildPatternForecast(history: HourlyMix[]): HourlyMix[] {
  if (history.length === 0) return [];

  // Bucket by hour-of-day (UTC), summing each fuel and counting samples
  const buckets = new Map<number, { totals: FuelMixMW; count: number }>();
  for (let h = 0; h < 24; h++) buckets.set(h, { totals: {}, count: 0 });

  for (const row of history) {
    const hour = new Date(row.ts).getUTCHours();
    const bucket = buckets.get(hour)!;
    bucket.count += 1;
    for (const [fuel, mw] of Object.entries(row.mix) as [FuelKey, number][]) {
      bucket.totals[fuel] = (bucket.totals[fuel] ?? 0) + mw;
    }
  }

  // Average each bucket
  const avgByHour = new Map<number, FuelMixMW>();
  for (const [h, b] of buckets.entries()) {
    if (b.count === 0) continue;
    const mix: FuelMixMW = {};
    for (const [fuel, total] of Object.entries(b.totals) as [FuelKey, number][]) {
      mix[fuel] = total / b.count;
    }
    avgByHour.set(h, mix);
  }

  // Emit 24 hours starting at the next top-of-hour
  const out: HourlyMix[] = [];
  const start = new Date();
  start.setUTCMinutes(0, 0, 0);
  start.setUTCHours(start.getUTCHours() + 1);
  for (let i = 0; i < 24; i++) {
    const ts = new Date(start.getTime() + i * 3600_000);
    const hour = ts.getUTCHours();
    const mix = avgByHour.get(hour);
    if (!mix) continue;
    out.push({ ts: ts.toISOString(), mix });
  }
  return out;
}
