import { NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { getCurrentIntensity } from "@/lib/data/source";
import { DEFAULT_BA, isBACode } from "@/lib/zones/balancingAuthorities";
import { zipToBA } from "@/lib/zones/zipToBA";

export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baParam = (url.searchParams.get("ba") ?? "").toUpperCase();
  const zip = url.searchParams.get("zip");

  let ba = DEFAULT_BA;
  if (isBACode(baParam)) {
    ba = baParam;
  } else if (zip) {
    const res = zipToBA(zip);
    if (!res.ok) {
      return NextResponse.json({ error: res.reason, message: messageFor(res.reason) }, { status: 400 });
    }
    ba = res.ba;
  }

  const data = await cached(`intensity:current:${ba}`, 300, () => getCurrentIntensity(ba));
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}

function messageFor(reason: string): string {
  switch (reason) {
    case "invalid": return "Enter a valid 5-digit US ZIP.";
    case "not-us": return "We cover the US grid only.";
    case "unsupported": return "That region isn't on the EIA-930 grid yet (Alaska, Hawaii, military bases).";
    default: return "Couldn't resolve that ZIP.";
  }
}
