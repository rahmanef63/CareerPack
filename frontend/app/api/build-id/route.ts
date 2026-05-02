import { NextResponse } from "next/server";

/**
 * Build-ID echo for stale-bundle detection. Returns the server's
 * current `NEXT_PUBLIC_BUILD_ID` — the same value that's frozen into
 * each client bundle at build time. The UpdateChecker on the client
 * polls this endpoint every few minutes and shows a toast when its
 * embedded value ≠ the live response.
 *
 * `force-dynamic` so the response can never be statically cached at
 * the edge — would defeat the whole purpose.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "unknown";
  return NextResponse.json(
    { buildId },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "CDN-Cache-Control": "no-store",
      },
    },
  );
}
