import type { BACode } from "./balancingAuthorities";

/**
 * State → primary balancing authority. Many states span multiple BAs;
 * we pick the one that serves the largest share of load in that state.
 *
 * Approximate: a TX ZIP in the El Paso area is actually on EPE, not ERCOT,
 * but the vast majority of TX load is ERCO. For a consumer "is the grid
 * cleaner now?" use case, this is good enough. Refine later with a county
 * or utility-territory mapping if needed.
 */
export const STATE_TO_BA: Record<string, BACode> = {
  AL: "SOCO",
  AR: "MISO",
  AZ: "AZPS",
  CA: "CISO",
  CO: "PSCO",
  CT: "ISNE",
  DC: "PJM",
  DE: "PJM",
  FL: "FPL",
  GA: "SOCO",
  IA: "MISO",
  ID: "IPCO",
  IL: "PJM",   // Northern IL (ComEd) is PJM, downstate is MISO; ComEd has more load
  IN: "MISO",
  KS: "SWPP",
  KY: "LGEE",
  LA: "MISO",
  MA: "ISNE",
  MD: "PJM",
  ME: "ISNE",
  MI: "MISO",
  MN: "MISO",
  MO: "MISO",
  MS: "MISO",
  MT: "NWMT",
  NC: "DUK",
  ND: "MISO",
  NE: "SWPP",
  NH: "ISNE",
  NJ: "PJM",
  NM: "PNM",
  NV: "NEVP",
  NY: "NYIS",
  OH: "PJM",
  OK: "SWPP",
  OR: "BPAT",
  PA: "PJM",
  RI: "ISNE",
  SC: "DUK",
  SD: "SWPP",
  TN: "TVA",
  TX: "ERCO",
  UT: "PACE",
  VA: "PJM",
  VT: "ISNE",
  WA: "BPAT",
  WI: "MISO",
  WV: "PJM",
  WY: "PSCO",
};
