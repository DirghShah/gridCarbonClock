import { NextResponse } from "next/server";
import { STATE_TO_BA } from "@/lib/zones/stateToBA";
import { getBA } from "@/lib/zones/balancingAuthorities";

/**
 * Resolve lat/lng → US state via the FCC's free Census Area API
 * (no auth, https://geo.fcc.gov/api/census/area), then state → BA.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon || !Number.isFinite(parseFloat(lat)) || !Number.isFinite(parseFloat(lon))) {
    return NextResponse.json({ ok: false, reason: "invalid-coords" }, { status: 400 });
  }

  let state: string | undefined;
  try {
    const fccUrl = `https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(fccUrl, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`FCC HTTP ${res.status}`);
    const json = (await res.json()) as { results?: { state_code?: string }[] };
    state = json.results?.[0]?.state_code;
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: "geocode-failed", message: String(err) },
      { status: 502 },
    );
  }

  if (!state) {
    return NextResponse.json({ ok: false, reason: "not-us" }, { status: 400 });
  }

  const ba = STATE_TO_BA[state];
  if (!ba) {
    return NextResponse.json({ ok: false, reason: "unsupported", state }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ba, state, baName: getBA(ba).name });
}
