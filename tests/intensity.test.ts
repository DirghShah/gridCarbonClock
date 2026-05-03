import { describe, expect, it } from "vitest";
import { intensityFromMix, tierFor, topFuelFromMix, mixPercentages } from "@/lib/carbon/intensity";

describe("intensityFromMix", () => {
  it("returns 0 for an empty mix", () => {
    expect(intensityFromMix({})).toBe(0);
  });

  it("returns 0 for an all-zero-emission mix", () => {
    expect(intensityFromMix({ WIND: 1000, SOLAR: 500, NUCLEAR: 500 })).toBe(0);
  });

  it("returns ~500 for a 100% gas mix", () => {
    expect(intensityFromMix({ GAS: 10000 })).toBe(500);
  });

  it("weights by MW share, not by count", () => {
    expect(intensityFromMix({ WIND: 9000, GAS: 1000 })).toBe(50);
  });

  it("ignores negative or zero entries", () => {
    expect(intensityFromMix({ WIND: 5000, GAS: 5000, COAL: 0, OIL: -50 })).toBe(250);
  });
});

describe("tierFor", () => {
  it("uses default thresholds when no BA provided", () => {
    expect(tierFor(100)).toBe("clean");
    expect(tierFor(300)).toBe("mid");
    expect(tierFor(500)).toBe("dirty");
  });

  it("uses BA-specific thresholds when given", () => {
    // BPAT is ~hydro-dominated, threshold for clean is 100
    expect(tierFor(120, "BPAT")).toBe("mid");
    expect(tierFor(80, "BPAT")).toBe("clean");
    // MISO is coal-heavy, 380 is "clean" for it
    expect(tierFor(380, "MISO")).toBe("clean");
    expect(tierFor(381, "MISO")).toBe("mid");
  });
});

describe("topFuelFromMix", () => {
  it("returns the largest fuel by MW", () => {
    const top = topFuelFromMix({ WIND: 5000, GAS: 8000, COAL: 2000 });
    expect(top?.key).toBe("GAS");
    expect(top?.label).toBe("Natural gas");
    expect(top?.sharePct).toBe(53);
  });

  it("returns null on empty mix", () => {
    expect(topFuelFromMix({})).toBeNull();
  });
});

describe("mixPercentages", () => {
  it("returns sorted descending percentages", () => {
    const pcts = mixPercentages({ WIND: 5000, GAS: 8000, COAL: 2000 });
    expect(pcts.map((p) => p.key)).toEqual(["GAS", "WIND", "COAL"]);
    expect(pcts[0].sharePct).toBe(53);
  });
});
