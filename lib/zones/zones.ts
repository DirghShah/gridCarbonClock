export const ERCOT_ZONES = ["NORTH", "SOUTH", "WEST", "HOUSTON", "COAST"] as const;
export type ErcotZone = (typeof ERCOT_ZONES)[number];

export const ZONE_LABELS: Record<ErcotZone, string> = {
  NORTH: "North Texas (Dallas–Fort Worth)",
  SOUTH: "South Texas (Austin–San Antonio)",
  WEST: "West Texas (Lubbock–Midland)",
  HOUSTON: "Houston",
  COAST: "Gulf Coast (Corpus Christi)",
};

export const DEFAULT_ZONE: ErcotZone = "NORTH";

export function isErcotZone(value: string): value is ErcotZone {
  return (ERCOT_ZONES as readonly string[]).includes(value);
}
