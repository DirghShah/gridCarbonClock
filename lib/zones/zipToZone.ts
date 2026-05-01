import { type ErcotZone } from "./zones";

/**
 * Coarse Texas ZIP-prefix → ERCOT load zone mapping.
 * ERCOT load zones don't perfectly match ZIP prefixes (utility territories
 * cross ZIP boundaries), but this is good enough for a consumer "is the grid
 * cleaner now?" use case. Refine later with a full ZIP→county→TDU mapping.
 */
const PREFIX_TO_ZONE: { prefix: string; zone: ErcotZone }[] = [
  // Houston metro: 770-775, 778
  { prefix: "770", zone: "HOUSTON" },
  { prefix: "771", zone: "HOUSTON" },
  { prefix: "772", zone: "HOUSTON" },
  { prefix: "773", zone: "HOUSTON" },
  { prefix: "774", zone: "HOUSTON" },
  { prefix: "775", zone: "HOUSTON" },
  { prefix: "778", zone: "HOUSTON" },
  // Gulf Coast: 776-777, 779, 783-785 (Corpus, Beaumont, Galveston)
  { prefix: "776", zone: "COAST" },
  { prefix: "777", zone: "COAST" },
  { prefix: "779", zone: "COAST" },
  { prefix: "783", zone: "COAST" },
  { prefix: "784", zone: "COAST" },
  { prefix: "785", zone: "COAST" },
  // South: 780-782, 786-789 (San Antonio, Austin, Laredo)
  { prefix: "780", zone: "SOUTH" },
  { prefix: "781", zone: "SOUTH" },
  { prefix: "782", zone: "SOUTH" },
  { prefix: "786", zone: "SOUTH" },
  { prefix: "787", zone: "SOUTH" },
  { prefix: "788", zone: "SOUTH" },
  { prefix: "789", zone: "SOUTH" },
  // West: 790-799 (Lubbock, Midland, El Paso — note El Paso is not on ERCOT)
  { prefix: "790", zone: "WEST" },
  { prefix: "791", zone: "WEST" },
  { prefix: "792", zone: "WEST" },
  { prefix: "793", zone: "WEST" },
  { prefix: "794", zone: "WEST" },
  { prefix: "795", zone: "WEST" },
  { prefix: "796", zone: "WEST" },
  { prefix: "797", zone: "WEST" },
  // North: 750-769 (DFW, Tyler, Waco)
  { prefix: "750", zone: "NORTH" },
  { prefix: "751", zone: "NORTH" },
  { prefix: "752", zone: "NORTH" },
  { prefix: "753", zone: "NORTH" },
  { prefix: "754", zone: "NORTH" },
  { prefix: "755", zone: "NORTH" },
  { prefix: "756", zone: "NORTH" },
  { prefix: "757", zone: "NORTH" },
  { prefix: "758", zone: "NORTH" },
  { prefix: "759", zone: "NORTH" },
  { prefix: "760", zone: "NORTH" },
  { prefix: "761", zone: "NORTH" },
  { prefix: "762", zone: "NORTH" },
  { prefix: "763", zone: "NORTH" },
  { prefix: "764", zone: "NORTH" },
  { prefix: "765", zone: "NORTH" },
  { prefix: "766", zone: "NORTH" },
  { prefix: "767", zone: "NORTH" },
  { prefix: "768", zone: "NORTH" },
  { prefix: "769", zone: "NORTH" },
];

const TX_PREFIX = /^7[5-9]\d$/;

export type ZipLookup =
  | { ok: true; zone: ErcotZone }
  | { ok: false; reason: "invalid" | "not-texas" | "el-paso" };

export function zipToZone(zip: string): ZipLookup {
  const trimmed = zip.trim();
  if (!/^\d{5}$/.test(trimmed)) return { ok: false, reason: "invalid" };
  const prefix = trimmed.slice(0, 3);

  // El Paso (798-799) is on the Western Interconnection, not ERCOT
  if (prefix === "798" || prefix === "799") return { ok: false, reason: "el-paso" };

  if (!TX_PREFIX.test(prefix)) return { ok: false, reason: "not-texas" };

  const match = PREFIX_TO_ZONE.find((p) => p.prefix === prefix);
  if (!match) return { ok: true, zone: "NORTH" }; // safe default within TX
  return { ok: true, zone: match.zone };
}
