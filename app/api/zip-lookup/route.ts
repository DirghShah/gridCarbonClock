import { NextResponse } from "next/server";
import { zipToBA } from "@/lib/zones/zipToBA";
import { getBA } from "@/lib/zones/balancingAuthorities";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const zip = url.searchParams.get("zip") ?? "";
  const res = zipToBA(zip);
  if (!res.ok) {
    return NextResponse.json({ ok: false, reason: res.reason }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    ba: res.ba,
    state: res.state,
    baName: getBA(res.ba).name,
  });
}
