/**
 * USPS ZIP-prefix (3 digits) → US state. Covers the lower 48 + AK/HI.
 * Source: USPS ZIP code prefix table (publicly published).
 *
 * A handful of prefixes legitimately span states (e.g. 834 IDaho border ZIPs
 * map to UT). We resolve to the dominant state — ~99% accurate for population.
 */

const PREFIX_TO_STATE: Record<string, string> = {};

function add(start: number, end: number, state: string) {
  for (let p = start; p <= end; p++) {
    PREFIX_TO_STATE[String(p).padStart(3, "0")] = state;
  }
}

// Northeast
add(10, 27, "MA");
add(28, 29, "RI");
add(30, 38, "NH");
add(39, 49, "ME");
add(50, 59, "VT");
add(60, 69, "CT");
add(70, 89, "NJ");
add(90, 99, "AE"); // overseas military, treat as not-supported below
add(100, 149, "NY");
add(150, 196, "PA");
add(197, 199, "DE");

// Mid-Atlantic
add(200, 200, "DC");
add(201, 201, "VA");
add(202, 205, "DC");
add(206, 219, "MD");
add(220, 246, "VA");
add(247, 268, "WV");

// South
add(270, 289, "NC");
add(290, 299, "SC");
add(300, 319, "GA");
add(398, 399, "GA");
add(320, 349, "FL");
add(350, 369, "AL");
add(370, 385, "TN");
add(386, 397, "MS");

// Midwest
add(400, 427, "KY");
add(430, 459, "OH");
add(460, 479, "IN");
add(480, 499, "MI");
add(500, 528, "IA");
add(530, 549, "WI");
add(550, 567, "MN");
add(570, 577, "SD");
add(580, 588, "ND");
add(590, 599, "MT");
add(600, 629, "IL");
add(630, 658, "MO");
add(660, 679, "KS");
add(680, 693, "NE");

// South-central
add(700, 714, "LA");
add(716, 729, "AR");
add(730, 731, "OK");
add(734, 749, "OK");
add(750, 799, "TX");
add(885, 885, "TX"); // some TX ZIPs

// Mountain
add(800, 816, "CO");
add(820, 831, "WY");
add(832, 838, "ID");
add(840, 847, "UT");
add(850, 865, "AZ");
add(870, 884, "NM");
add(889, 898, "NV");

// Pacific
add(900, 961, "CA");
add(967, 968, "HI");
add(970, 979, "OR");
add(980, 994, "WA");
add(995, 999, "AK");

export type ZipResolution =
  | { ok: true; state: string }
  | { ok: false; reason: "invalid" | "not-us" | "unsupported" };

export function zipToState(zip: string): ZipResolution {
  const trimmed = zip.trim();
  if (!/^\d{5}$/.test(trimmed)) return { ok: false, reason: "invalid" };
  const prefix = trimmed.slice(0, 3);
  const state = PREFIX_TO_STATE[prefix];
  if (!state) return { ok: false, reason: "not-us" };
  if (state === "AE") return { ok: false, reason: "unsupported" };
  // AK + HI aren't on EIA-930 lower-48 grid — surface friendly message
  if (state === "AK" || state === "HI") return { ok: false, reason: "unsupported" };
  return { ok: true, state };
}
