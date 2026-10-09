import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  // Next inlines this literal from next.config.ts in both client and server bundles.
  return NextResponse.json(
    { buildId: process.env.NEXT_PUBLIC_BUILD_ID || "unknown" },
    { headers: { "Cache-Control": "no-store, max-age=0", "CDN-Cache-Control": "no-store" } },
  );
}
