import { NextResponse } from "next/server";
import { edgeCountry } from "@/shared/lib/requestMeta";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const country = edgeCountry(request);
  return NextResponse.json(
    { country, source: country ? "cf-ipcountry" : "none" },
    { headers: { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store" } },
  );
}
