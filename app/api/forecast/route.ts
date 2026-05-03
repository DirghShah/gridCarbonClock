import { NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { getForecast } from "@/lib/data/source";
import { DEFAULT_BA, isBACode } from "@/lib/zones/balancingAuthorities";
import { zipToBA } from "@/lib/zones/zipToBA";

export const revalidate = 1800;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baParam = (url.searchParams.get("ba") ?? "").toUpperCase();
  const zip = url.searchParams.get("zip");

  let ba = DEFAULT_BA;
  if (isBACode(baParam)) {
    ba = baParam;
  } else if (zip) {
    const res = zipToBA(zip);
    if (!res.ok) return NextResponse.json({ error: res.reason }, { status: 400 });
    ba = res.ba;
  }

  const data = await cached(`intensity:forecast:${ba}`, 1800, () => getForecast(ba));
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
