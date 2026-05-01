import type { ForecastHour } from "@/lib/types";

export type Nudge = {
  headline: string;
  detail: string;
  windowStart: string; // ISO
  windowEnd: string; // ISO
  savingsPct: number;
  cleanestAvg: number;
  comparisonAvg: number;
};

/**
 * Find the contiguous N-hour window with the lowest average intensity in `hours`.
 * Returns the start index (0..hours.length - windowLen).
 */
export function cleanestWindow(hours: ForecastHour[], windowLen: number): { startIdx: number; avg: number } {
  if (hours.length < windowLen) {
    return { startIdx: 0, avg: hours.reduce((s, h) => s + h.gPerKWh, 0) / Math.max(1, hours.length) };
  }
  let bestIdx = 0;
  let bestSum = hours.slice(0, windowLen).reduce((s, h) => s + h.gPerKWh, 0);
  let runningSum = bestSum;
  for (let i = windowLen; i < hours.length; i++) {
    runningSum += hours[i].gPerKWh - hours[i - windowLen].gPerKWh;
    if (runningSum < bestSum) {
      bestSum = runningSum;
      bestIdx = i - windowLen + 1;
    }
  }
  return { startIdx: bestIdx, avg: bestSum / windowLen };
}

/**
 * Compare cleanest window to typical evening peak (18:00–22:00 local).
 * Returns a Nudge. EV charging assumed (4-hour window).
 */
export function buildNudge(hours: ForecastHour[], options?: { windowLen?: number }): Nudge | null {
  if (hours.length === 0) return null;
  const windowLen = options?.windowLen ?? 4;
  const { startIdx, avg: cleanestAvg } = cleanestWindow(hours, windowLen);
  const cleanest = hours.slice(startIdx, startIdx + windowLen);

  // Comparison: 18:00–22:00 local time hours within forecast horizon.
  const peakHours = hours.filter((h) => {
    const hr = new Date(h.ts).getHours();
    return hr >= 18 && hr < 22;
  });
  const comparisonAvg =
    peakHours.length > 0
      ? peakHours.reduce((s, h) => s + h.gPerKWh, 0) / peakHours.length
      : Math.max(...hours.map((h) => h.gPerKWh));

  const savingsPct = comparisonAvg > 0 ? Math.round(((comparisonAvg - cleanestAvg) / comparisonAvg) * 100) : 0;

  return {
    headline: `Charge your EV ${formatRange(cleanest[0].ts, cleanest[cleanest.length - 1].ts)} to cut ${savingsPct}% of emissions vs. tonight's peak.`,
    detail: `Cleanest ${windowLen}-hour window averages ${Math.round(cleanestAvg)} gCO₂/kWh. Evening peak (6–10pm) averages ${Math.round(comparisonAvg)}.`,
    windowStart: cleanest[0].ts,
    windowEnd: cleanest[cleanest.length - 1].ts,
    savingsPct,
    cleanestAvg,
    comparisonAvg,
  };
}

function formatRange(startIso: string, endIso: string): string {
  const fmt = (d: Date) => {
    const h = d.getHours();
    const ampm = h >= 12 ? "pm" : "am";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${ampm}`;
  };
  const s = new Date(startIso);
  const e = new Date(endIso);
  e.setHours(e.getHours() + 1); // window is inclusive of last hour
  const sameDay = s.toDateString() === new Date().toDateString();
  const dayLabel = sameDay ? "today" : "tomorrow";
  return `${dayLabel} from ${fmt(s)}–${fmt(e)}`;
}
