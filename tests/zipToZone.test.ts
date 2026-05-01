import { describe, expect, it } from "vitest";
import { zipToZone } from "@/lib/zones/zipToZone";

describe("zipToZone", () => {
  it("Austin 78701 → SOUTH", () => {
    expect(zipToZone("78701")).toEqual({ ok: true, zone: "SOUTH" });
  });

  it("Dallas 75201 → NORTH", () => {
    expect(zipToZone("75201")).toEqual({ ok: true, zone: "NORTH" });
  });

  it("Houston 77001 → HOUSTON", () => {
    expect(zipToZone("77001")).toEqual({ ok: true, zone: "HOUSTON" });
  });

  it("Lubbock 79401 → WEST", () => {
    expect(zipToZone("79401")).toEqual({ ok: true, zone: "WEST" });
  });

  it("Corpus Christi 78401 → COAST", () => {
    expect(zipToZone("78401")).toEqual({ ok: true, zone: "COAST" });
  });

  it("El Paso 79901 → not on ERCOT", () => {
    expect(zipToZone("79901")).toEqual({ ok: false, reason: "el-paso" });
  });

  it("NYC 10001 → not Texas", () => {
    expect(zipToZone("10001")).toEqual({ ok: false, reason: "not-texas" });
  });

  it("garbage → invalid", () => {
    expect(zipToZone("abcde")).toEqual({ ok: false, reason: "invalid" });
    expect(zipToZone("123")).toEqual({ ok: false, reason: "invalid" });
  });
});
