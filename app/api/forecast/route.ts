import { NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { getForecast } from "@/lib/data/source";
import { DEFAULT_ZONE, isErcotZone } from "@/lib/zones/zones";

export const revalidate = 1800; // 30 minutes

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("zone") ?? "").toUpperCase();
  const zone = isErcotZone(raw) ? raw : DEFAULT_ZONE;

  const data = await cached(`intensity:forecast:${zone}`, 1800, () => getForecast(zone));

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
