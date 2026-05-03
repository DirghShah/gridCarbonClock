import { describe, expect, it } from "vitest";
import { cleanestWindow, buildNudge } from "@/lib/carbon/nudge";
import type { ForecastHour } from "@/lib/types";
import { tierFor } from "@/lib/carbon/intensity";

function makeHours(values: number[], startHour = 0): ForecastHour[] {
  const start = new Date();
  start.setHours(startHour, 0, 0, 0);
  return values.map((g, i) => ({
    ts: new Date(start.getTime() + i * 3600_000).toISOString(),
    gPerKWh: g,
    tier: tierFor(g),
    topFuel: null,
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
    const values: number[] = [];
    for (let h = 0; h < 24; h++) {
      if (h >= 13 && h <= 16) values.push(180);
      else if (h >= 18 && h <= 21) values.push(550);
      else values.push(380);
    }
    const hours = makeHours(values, 0);
    const n = buildNudge(hours);
    expect(n).not.toBeNull();
    expect(n!.savingsPct).toBeGreaterThan(50);
    expect(n!.headline).toMatch(/EV/);
  });

  it("returns null on empty input", () => {
    expect(buildNudge([])).toBeNull();
  });
});
