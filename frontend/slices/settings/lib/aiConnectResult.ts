/**
 * Outcome of a provider OAuth round-trip, read back off the `?ai=` param that
 * `app/oauth/<provider>/callback` leaves on `/dashboard/settings`.
 *
 * Its own module because the two outcomes share one namespace: success is the
 * provider id (`?ai=openrouter`), failure is the literal `?ai=error`. The check
 * order below is therefore load-bearing, and `AI_PROVIDERS` never having an id
 * called "error" is what keeps it safe — pinned by `aiProviders.test.ts`.
 */
export type AIConnectResult = { status: "ok"; provider: string } | { status: "failed" };

export function parseAIConnectResult(search: string): AIConnectResult | null {
  const value = new URLSearchParams(search).get("ai");
  if (!value) return null;
  return value === "error" ? { status: "failed" } : { status: "ok", provider: value };
}
