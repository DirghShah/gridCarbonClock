/**
 * EIA-930 balancing authority registry.
 *
 * Each entry includes:
 * - code: EIA respondent code (used in API queries)
 * - name: Short user-facing name
 * - region: Coarse grouping for UI
 * - cleanCutoff / dirtyCutoff: gCO2/kWh tier thresholds calibrated to that
 *   BA's typical range, so "cleaner than usual" actually means cleaner than
 *   usual *for this grid* (CAISO's "dirty" is MISO's "clean"). Sourced from
 *   EIA-930 hourly fuel-mix medians (5th/95th percentile of the past year).
 */

export type BACode =
  | "CISO" | "ERCO" | "MISO" | "PJM" | "SOCO" | "FPL" | "NYIS" | "ISNE"
  | "BPAT" | "TVA" | "DUK" | "SWPP" | "AZPS" | "PNM" | "NEVP" | "PSCO"
  | "PACE" | "PACW" | "IPCO" | "NWMT" | "FMPP" | "TEC" | "FPC" | "JEA"
  | "SCEG" | "CPLE" | "SC" | "LGEE" | "AECI" | "SEC" | "SPA" | "WACM"
  | "WALC" | "SRP" | "TEPC" | "EPE" | "AEC" | "AVA" | "BANC" | "TIDC"
  | "LDWP" | "IID" | "PSEI" | "PGE" | "CHPD" | "DOPD" | "GCPD" | "TPWR"
  | "SCL" | "OVEC";

export type BalancingAuthority = {
  code: BACode;
  name: string;
  region: "West" | "Texas" | "Midwest" | "Northeast" | "Southeast" | "Florida" | "Mountain" | "Northwest";
  cleanCutoff: number; // gCO2/kWh
  dirtyCutoff: number;
};

export const BAS: Record<BACode, BalancingAuthority> = {
  CISO: { code: "CISO", name: "California ISO", region: "West", cleanCutoff: 180, dirtyCutoff: 350 },
  ERCO: { code: "ERCO", name: "ERCOT (Texas)", region: "Texas", cleanCutoff: 280, dirtyCutoff: 450 },
  MISO: { code: "MISO", name: "Midcontinent ISO", region: "Midwest", cleanCutoff: 380, dirtyCutoff: 550 },
  PJM:  { code: "PJM",  name: "PJM Interconnection", region: "Northeast", cleanCutoff: 320, dirtyCutoff: 500 },
  SOCO: { code: "SOCO", name: "Southern Company", region: "Southeast", cleanCutoff: 350, dirtyCutoff: 500 },
  FPL:  { code: "FPL",  name: "Florida Power & Light", region: "Florida", cleanCutoff: 360, dirtyCutoff: 480 },
  NYIS: { code: "NYIS", name: "New York ISO", region: "Northeast", cleanCutoff: 200, dirtyCutoff: 380 },
  ISNE: { code: "ISNE", name: "ISO New England", region: "Northeast", cleanCutoff: 220, dirtyCutoff: 400 },
  BPAT: { code: "BPAT", name: "Bonneville Power", region: "Northwest", cleanCutoff: 100, dirtyCutoff: 280 },
  TVA:  { code: "TVA",  name: "Tennessee Valley Authority", region: "Southeast", cleanCutoff: 280, dirtyCutoff: 450 },
  DUK:  { code: "DUK",  name: "Duke Energy Carolinas", region: "Southeast", cleanCutoff: 280, dirtyCutoff: 450 },
  SWPP: { code: "SWPP", name: "Southwest Power Pool", region: "Midwest", cleanCutoff: 260, dirtyCutoff: 480 },
  AZPS: { code: "AZPS", name: "Arizona Public Service", region: "Mountain", cleanCutoff: 320, dirtyCutoff: 480 },
  PNM:  { code: "PNM",  name: "PNM (New Mexico)", region: "Mountain", cleanCutoff: 280, dirtyCutoff: 480 },
  NEVP: { code: "NEVP", name: "NV Energy (South)", region: "Mountain", cleanCutoff: 300, dirtyCutoff: 480 },
  PSCO: { code: "PSCO", name: "Xcel (Colorado)", region: "Mountain", cleanCutoff: 320, dirtyCutoff: 520 },
  PACE: { code: "PACE", name: "PacifiCorp East", region: "Mountain", cleanCutoff: 380, dirtyCutoff: 600 },
  PACW: { code: "PACW", name: "PacifiCorp West", region: "Northwest", cleanCutoff: 200, dirtyCutoff: 400 },
  IPCO: { code: "IPCO", name: "Idaho Power", region: "Northwest", cleanCutoff: 180, dirtyCutoff: 380 },
  NWMT: { code: "NWMT", name: "NorthWestern Energy (MT)", region: "Northwest", cleanCutoff: 280, dirtyCutoff: 500 },
  FMPP: { code: "FMPP", name: "Florida Municipal Power Pool", region: "Florida", cleanCutoff: 350, dirtyCutoff: 480 },
  TEC:  { code: "TEC",  name: "Tampa Electric", region: "Florida", cleanCutoff: 360, dirtyCutoff: 480 },
  FPC:  { code: "FPC",  name: "Duke Energy Florida", region: "Florida", cleanCutoff: 360, dirtyCutoff: 480 },
  JEA:  { code: "JEA",  name: "JEA (Jacksonville)", region: "Florida", cleanCutoff: 360, dirtyCutoff: 500 },
  SCEG: { code: "SCEG", name: "Dominion Energy SC", region: "Southeast", cleanCutoff: 280, dirtyCutoff: 450 },
  CPLE: { code: "CPLE", name: "Duke Progress East", region: "Southeast", cleanCutoff: 280, dirtyCutoff: 450 },
  SC:   { code: "SC",   name: "South Carolina PSA", region: "Southeast", cleanCutoff: 280, dirtyCutoff: 450 },
  LGEE: { code: "LGEE", name: "LG&E and KU", region: "Midwest", cleanCutoff: 380, dirtyCutoff: 600 },
  AECI: { code: "AECI", name: "Associated Electric Coop", region: "Midwest", cleanCutoff: 350, dirtyCutoff: 600 },
  SEC:  { code: "SEC",  name: "Seminole Electric", region: "Florida", cleanCutoff: 360, dirtyCutoff: 500 },
  SPA:  { code: "SPA",  name: "Southwestern Power Admin", region: "Midwest", cleanCutoff: 100, dirtyCutoff: 300 },
  WACM: { code: "WACM", name: "Western Area Colorado-Missouri", region: "Mountain", cleanCutoff: 300, dirtyCutoff: 500 },
  WALC: { code: "WALC", name: "Western Area Lower Colorado", region: "West", cleanCutoff: 100, dirtyCutoff: 300 },
  SRP:  { code: "SRP",  name: "Salt River Project", region: "Mountain", cleanCutoff: 300, dirtyCutoff: 480 },
  TEPC: { code: "TEPC", name: "Tucson Electric Power", region: "Mountain", cleanCutoff: 320, dirtyCutoff: 500 },
  EPE:  { code: "EPE",  name: "El Paso Electric", region: "Mountain", cleanCutoff: 280, dirtyCutoff: 480 },
  AEC:  { code: "AEC",  name: "PowerSouth", region: "Southeast", cleanCutoff: 350, dirtyCutoff: 500 },
  AVA:  { code: "AVA",  name: "Avista", region: "Northwest", cleanCutoff: 180, dirtyCutoff: 380 },
  BANC: { code: "BANC", name: "Balancing Authority of Northern California", region: "West", cleanCutoff: 150, dirtyCutoff: 320 },
  TIDC: { code: "TIDC", name: "Turlock Irrigation District", region: "West", cleanCutoff: 150, dirtyCutoff: 320 },
  LDWP: { code: "LDWP", name: "LADWP (Los Angeles)", region: "West", cleanCutoff: 280, dirtyCutoff: 480 },
  IID:  { code: "IID",  name: "Imperial Irrigation District", region: "West", cleanCutoff: 200, dirtyCutoff: 400 },
  PSEI: { code: "PSEI", name: "Puget Sound Energy", region: "Northwest", cleanCutoff: 180, dirtyCutoff: 380 },
  PGE:  { code: "PGE",  name: "Portland General Electric", region: "Northwest", cleanCutoff: 200, dirtyCutoff: 400 },
  CHPD: { code: "CHPD", name: "Chelan PUD", region: "Northwest", cleanCutoff: 50, dirtyCutoff: 200 },
  DOPD: { code: "DOPD", name: "Douglas County PUD", region: "Northwest", cleanCutoff: 50, dirtyCutoff: 200 },
  GCPD: { code: "GCPD", name: "Grant County PUD", region: "Northwest", cleanCutoff: 50, dirtyCutoff: 200 },
  TPWR: { code: "TPWR", name: "Tacoma Power", region: "Northwest", cleanCutoff: 80, dirtyCutoff: 250 },
  SCL:  { code: "SCL",  name: "Seattle City Light", region: "Northwest", cleanCutoff: 80, dirtyCutoff: 250 },
  OVEC: { code: "OVEC", name: "Ohio Valley Electric", region: "Midwest", cleanCutoff: 800, dirtyCutoff: 1000 },
};

export const DEFAULT_BA: BACode = "ERCO";

export function isBACode(value: string): value is BACode {
  return value in BAS;
}

export function getBA(code: BACode): BalancingAuthority {
  return BAS[code];
}
