import type { FuelMixMW } from "@/lib/carbon/intensity";
import type { HourlyMix } from "@/lib/eia/client";
import type { BACode } from "@/lib/zones/balancingAuthorities";

/**
 * Realistic mock data used when EIA_API_KEY is missing or EIA is unreachable.
 * The shape varies slightly by BA so different ZIP lookups don't all look
 * identical in demo mode.
 */
function mixForBA(ba: BACode): FuelMixMW {
  switch (ba) {
    case "CISO":
      return { SOLAR: 9000, WIND: 2200, NUCLEAR: 2200, HYDRO: 3000, GAS: 7000, OTHER: 400 };
    case "ERCO":
      return { WIND: 18000, SOLAR: 12000, GAS: 16000, COAL: 4500, NUCLEAR: 5000, HYDRO: 200 };
    case "MISO":
      return { COAL: 25000, GAS: 18000, NUCLEAR: 11000, WIND: 14000, SOLAR: 1500, HYDRO: 800 };
    case "PJM":
      return { GAS: 38000, NUCLEAR: 32000, COAL: 14000, WIND: 4000, SOLAR: 3000, HYDRO: 2000 };
    case "BPAT":
      return { HYDRO: 9000, WIND: 2500, GAS: 1200, NUCLEAR: 1100, SOLAR: 200 };
    case "NYIS":
      return { GAS: 9000, NUCLEAR: 3300, HYDRO: 2200, WIND: 800, SOLAR: 600 };
    case "ISNE":
      return { GAS: 7500, NUCLEAR: 3200, HYDRO: 1100, WIND: 500, SOLAR: 1000 };
    default:
      return { GAS: 6000, COAL: 2500, NUCLEAR: 1500, WIND: 1500, SOLAR: 800 };
  }
}

export function mockCurrentMix(ba: BACode): { asOf: string; mix: FuelMixMW } {
  return { asOf: new Date().toISOString(), mix: mixForBA(ba) };
}

export function mockHistory(ba: BACode, hours: number): HourlyMix[] {
  const base = mixForBA(ba);
  const start = new Date();
  start.setUTCMinutes(0, 0, 0);
  start.setUTCHours(start.getUTCHours() - hours);
  const out: HourlyMix[] = [];
  for (let i = 0; i < hours; i++) {
    const ts = new Date(start.getTime() + i * 3600_000);
    const hour = ts.getUTCHours();
    // Diurnal solar curve
    const solarMul = Math.max(0, Math.sin(((hour - 12) / 12) * Math.PI + Math.PI / 2));
    // Wind mildly anticorrelated with solar
    const windMul = 0.6 + 0.4 * Math.cos(((hour - 6) / 24) * 2 * Math.PI);
    // Gas ramps for evening peak
    const gasMul = 0.7 + 0.5 * Math.max(0, Math.sin(((hour - 14) / 24) * 2 * Math.PI));
    const mix = { ...base };
    if (mix.SOLAR) mix.SOLAR = Math.round(mix.SOLAR * solarMul);
    if (mix.WIND) mix.WIND = Math.round(mix.WIND * windMul);
    if (mix.GAS) mix.GAS = Math.round(mix.GAS * gasMul);
    out.push({ ts: ts.toISOString(), mix });
  }
  return out;
}
