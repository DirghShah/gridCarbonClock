import type { FuelMixMW } from "@/lib/carbon/intensity";

/**
 * Realistic mock data used when live ERCOT feeds are unreachable
 * (e.g. local dev offline, ERCOT 403, or schema drift). The shape mirrors
 * a typical Texas spring afternoon: lots of wind + solar, gas filling the gap.
 */
export function mockCurrentMix(): { asOf: string; mix: FuelMixMW } {
  return {
    asOf: new Date().toISOString(),
    mix: {
      WIND: 18000,
      SOLAR: 12000,
      GAS: 16000,
      COAL: 4500,
      NUCLEAR: 5000,
      HYDRO: 200,
      OTHER: 300,
    },
  };
}

export function mockForecasts() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const hours = 24;

  // Diurnal solar curve, midday peak
  const solarCurve = (h: number) =>
    Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)) * 14000;
  // Wind mildly anti-correlated with solar (typical ERCOT)
  const windCurve = (h: number) => 10000 + 8000 * Math.sin(((h - 18) / 24) * 2 * Math.PI);
  // Load: morning ramp + evening peak
  const loadCurve = (h: number) => 50000 + 12000 * Math.sin(((h - 14) / 24) * 2 * Math.PI);

  const load = [];
  const wind = [];
  const solar = [];
  for (let i = 0; i < hours; i++) {
    const ts = new Date(start.getTime() + i * 3600_000);
    const localHour = ts.getHours();
    const tsIso = ts.toISOString();
    load.push({ ts: tsIso, mw: Math.round(loadCurve(localHour)) });
    wind.push({ ts: tsIso, mw: Math.round(windCurve(localHour)) });
    solar.push({ ts: tsIso, mw: Math.round(solarCurve(localHour)) });
  }
  return { load, wind, solar };
}
