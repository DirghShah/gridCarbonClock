import { describe, expect, it } from "vitest";
import { zipToBA } from "@/lib/zones/zipToBA";
import { zipToState } from "@/lib/zones/zipToState";

describe("zipToState", () => {
  it.each([
    ["78701", "TX"], // Austin
    ["75201", "TX"], // Dallas
    ["77001", "TX"], // Houston
    ["10001", "NY"], // NYC
    ["94103", "CA"], // SF
    ["02108", "MA"], // Boston
    ["98101", "WA"], // Seattle
    ["33101", "FL"], // Miami
    ["80202", "CO"], // Denver
    ["97201", "OR"], // Portland
    ["60601", "IL"], // Chicago
    ["20001", "DC"], // DC
  ])("%s → %s", (zip, state) => {
    const r = zipToState(zip);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state).toBe(state);
  });

  it("rejects invalid", () => {
    expect(zipToState("abcde")).toEqual({ ok: false, reason: "invalid" });
    expect(zipToState("123")).toEqual({ ok: false, reason: "invalid" });
  });

  it("flags Alaska & Hawaii as unsupported", () => {
    expect(zipToState("99501")).toEqual({ ok: false, reason: "unsupported" }); // Anchorage
    expect(zipToState("96813")).toEqual({ ok: false, reason: "unsupported" }); // Honolulu
  });
});

describe("zipToBA", () => {
  it.each([
    ["78701", "ERCO"], // Austin → ERCOT
    ["75201", "ERCO"], // Dallas → ERCOT
    ["10001", "NYIS"], // NYC → NYISO
    ["94103", "CISO"], // SF → CAISO
    ["02108", "ISNE"], // Boston → ISO-NE
    ["98101", "BPAT"], // Seattle → Bonneville
    ["33101", "FPL"],  // Miami → FPL
    ["80202", "PSCO"], // Denver → Xcel CO
    ["97201", "BPAT"], // Portland → BPA
    ["60601", "PJM"],  // Chicago → PJM (ComEd)
    ["20001", "PJM"],  // DC → PJM
    ["19103", "PJM"],  // Philly → PJM
    ["48201", "MISO"], // Detroit → MISO
    ["55401", "MISO"], // Minneapolis → MISO
    ["37201", "TVA"],  // Nashville → TVA
    ["30303", "SOCO"], // Atlanta → Southern
    ["85001", "AZPS"], // Phoenix → APS
  ])("%s → %s", (zip, ba) => {
    const r = zipToBA(zip);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ba).toBe(ba);
  });

  it("rejects non-US ZIPs", () => {
    // No 3-digit prefix = "999" outside our mapping (though 99x is AK, which is unsupported)
    // Use a prefix that doesn't map: 000-009 region (only 005 is mapped)
    const r = zipToBA("00100");
    expect(r.ok).toBe(false);
  });
});
