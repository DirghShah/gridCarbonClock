import { NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { getCurrentIntensity } from "@/lib/data/source";
import { DEFAULT_ZONE, isErcotZone } from "@/lib/zones/zones";

export const revalidate = 300; // 5 minutes

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("zone") ?? "").toUpperCase();
  const zone = isErcotZone(raw) ? raw : DEFAULT_ZONE;

  const data = await cached(`intensity:current:${zone}`, 300, () =>
    getCurrentIntensity(zone),
  );

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
