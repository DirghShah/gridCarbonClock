import { describe, expect, it } from "vitest";
import { cleanestWindow, buildNudge } from "@/lib/carbon/nudge";
import type { ForecastHour } from "@/lib/types";

function makeHours(values: number[]): ForecastHour[] {
  const start = new Date("2026-05-01T06:00:00-05:00");
  return values.map((g, i) => ({
    ts: new Date(start.getTime() + i * 3600_000).toISOString(),
    gPerKWh: g,
    tier: g <= 300 ? "clean" : g <= 450 ? "mid" : "dirty",
    loadMW: 50000,
    windMW: 10000,
    solarMW: 5000,
  }));
}

describe("cleanestWindow", () => {
  it("finds the lowest-average contiguous window", () => {
    const hours = makeHours([500, 480, 200, 180, 150, 200, 400, 600]);
    const w = cleanestWindow(hours, 4);
    expect(w.startIdx).toBe(2);
    expect(w.avg).toBeCloseTo((200 + 180 + 150 + 200) / 4);
  });

  it("returns startIdx 0 when input shorter than window", () => {
    const hours = makeHours([400, 500]);
    const w = cleanestWindow(hours, 4);
    expect(w.startIdx).toBe(0);
  });
});

describe("buildNudge", () => {
  it("produces a nudge with non-zero savings vs evening peak", () => {
    // Build a 24-hour curve where 1pm-5pm is cleanest, 6pm-10pm is dirty
    const values: number[] = [];
    for (let h = 0; h < 24; h++) {
      if (h >= 13 && h <= 16) values.push(180);
      else if (h >= 18 && h <= 21) values.push(550);
      else values.push(380);
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const hours: ForecastHour[] = values.map((g, i) => ({
      ts: new Date(start.getTime() + i * 3600_000).toISOString(),
      gPerKWh: g,
      tier: g <= 300 ? "clean" : g <= 450 ? "mid" : "dirty",
      loadMW: 50000,
      windMW: 10000,
      solarMW: 5000,
    }));
    const n = buildNudge(hours);
    expect(n).not.toBeNull();
    expect(n!.savingsPct).toBeGreaterThan(50);
    expect(n!.headline).toMatch(/EV/);
  });

  it("returns null on empty input", () => {
    expect(buildNudge([])).toBeNull();
  });
});
