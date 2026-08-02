import type { AIAuthSpec, AIOAuthSpec } from "../../../../convex/_shared/aiProviders";

/** One row of `api.ai.queries.listAIProviders`. */
export interface ProviderOption {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  docsUrl?: string;
  auth?: AIAuthSpec;
}

/**
 * What `getMyAISettings` / `getGlobalAISettings` return — identical shapes, which
 * is what lets one form serve both scopes.
 */
export interface StoredAISettings {
  provider: string;
  model: string;
  baseUrl: string | null;
  enabled: boolean;
  hasKey: boolean;
  keyPreview: string;
  updatedAt: number;
}

export interface AuthAffordances {
  /** OAuth flow this UI can actually render, or null. */
  oauth: AIOAuthSpec | null;
  /** Paste-a-key field + its docs link, or null when there is no key to paste. */
  apiKey: { docsUrl?: string } | null;
  /**
   * "required" when the provider ships no endpoint of its own, i.e. the base
   * URL is half the credential rather than an override buried under Lanjutan.
   */
  baseUrl: "required" | "optional";
}

/**
 * Which auth widgets a provider gets — derived from its descriptor, never from
 * its id. That is the whole point of `AIAuthSpec`: "masuk dengan X" ships as an
 * entry in `AI_PROVIDERS[x].auth.oauth` plus an adapter in `convex/ai/oauth.ts`,
 * with no new case anywhere in the settings UI.
 *
 * Pure and in a .ts file so the branch table is testable — vitest cannot
 * transform .tsx here (`jsx: "preserve"`), and this is the logic worth pinning.
 */
export function providerAffordances(spec?: ProviderOption | null): AuthAffordances {
  // Providers still loading: keep the key field so the form is not momentarily
  // empty, and treat the endpoint as optional so nothing renders as missing.
  if (!spec) return { oauth: null, apiKey: {}, baseUrl: "optional" };

  return {
    // Only `redirect` has a widget. `paste` and `poll` hand the grant back
    // through a code the user carries, and a button that navigates nowhere is
    // worse than no button — `handoff` is exactly the switch that picks the
    // right one once those exist.
    oauth: spec.auth?.oauth?.handoff === "redirect" ? spec.auth.oauth : null,
    // A descriptor that declares no `apiKey` has nothing to paste. A row that
    // arrives with no `auth` at all still gets the field: losing the only input
    // is worse than showing one input too many.
    apiKey: spec.auth ? (spec.auth.apiKey ?? null) : {},
    baseUrl: spec.baseUrl ? "optional" : "required",
  };
}
