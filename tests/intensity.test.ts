import { describe, expect, it } from "vitest";
import { intensityFromMix, tierFor, forecastIntensity } from "@/lib/carbon/intensity";

describe("intensityFromMix", () => {
  it("returns 0 for an empty mix", () => {
    expect(intensityFromMix({})).toBe(0);
  });

  it("returns 0 for an all-zero-emission mix", () => {
    expect(intensityFromMix({ WIND: 1000, SOLAR: 500, NUCLEAR: 500 })).toBe(0);
  });

  it("returns ~500 for a 100% gas mix (using blended GAS factor)", () => {
    expect(intensityFromMix({ GAS: 10000 })).toBe(500);
  });

  it("weights by MW share, not by count", () => {
    // 90% wind + 10% gas → 50 g/kWh
    const v = intensityFromMix({ WIND: 9000, GAS: 1000 });
    expect(v).toBe(50);
  });

  it("ignores negative or zero entries", () => {
    expect(intensityFromMix({ WIND: 5000, GAS: 5000, COAL: 0, OIL: -50 })).toBe(250);
  });
});

describe("tierFor", () => {
  it.each([
    [100, "clean"],
    [300, "clean"],
    [301, "mid"],
    [450, "mid"],
    [451, "dirty"],
    [800, "dirty"],
  ])("%i gCO2/kWh → %s", (g, tier) => {
    expect(tierFor(g)).toBe(tier);
  });
});

describe("forecastIntensity", () => {
  it("attributes residual demand to gas", () => {
    // 50 GW load, 10 GW wind, 5 GW solar → ~25.3 GW gas after baselines
    // mix dominated by gas → mid-to-dirty intensity
    const { gPerKWh, mix } = forecastIntensity({
      loadMW: 50000,
      windMW: 10000,
      solarMW: 5000,
    });
    expect(mix.GAS).toBeGreaterThan(0);
    expect(gPerKWh).toBeGreaterThan(250);
    expect(gPerKWh).toBeLessThan(550);
  });

  it("clamps gas to >= 0 when renewables exceed load", () => {
    const { mix } = forecastIntensity({
      loadMW: 30000,
      windMW: 25000,
      solarMW: 15000,
    });
    expect(mix.GAS).toBe(0);
  });
});
