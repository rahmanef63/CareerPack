import { ConvexError } from "convex/values";

/**
 * How a provider's OAuth login works, declared rather than discovered.
 *
 * The two axes are split because the three flows that actually exist
 * (models-rahmanef-com: OpenRouter, Claude Pro/Max, ChatGPT/Codex) do not
 * line up 1:1 on both. Collapsing them into one enum would force a wrong
 * widget the first time a provider pairs a refreshing token with a redirect
 * we control.
 */
export interface AIOAuthSpec {
  /**
   * What the exchange yields, which decides what the read path must do:
   *   pkce_key    — a normal, non-expiring API key (OpenRouter). Nothing
   *                 downstream changes; `resolveAI` just reads it.
   *   pkce_token  — access+refresh bundle that expires (Claude Pro/Max).
   *   device_code — access+refresh bundle via a device-code poll (Codex).
   * The latter two additionally need a refresher before `resolveAI` can hand
   * the credential to the proxy — which is why only `pkce_key` is declared
   * here today.
   */
  kind: "pkce_key" | "pkce_token" | "device_code";
  /**
   * How the grant gets back to us — this alone picks the UI widget:
   *   redirect — provider returns to `callbackPath` on this app.
   *   paste    — provider shows a code the user copies back (Claude, whose
   *              client_id pins a redirect_uri on Anthropic's own domain).
   *   poll     — we show a user code and poll until the user approves.
   */
  handoff: "redirect" | "paste" | "poll";
  /** Button copy. Indonesian, like every other user-facing string here. */
  label: string;
  /** `handoff: "redirect"` only — path on this app the provider returns to. */
  callbackPath?: string;
  /** `handoff: "paste" | "poll"` — the one line shown while the user waits. */
  hint?: string;
}

/**
 * The authentication methods a provider supports. Every consumer branches on
 * this, never on a provider id: the point of the shape is that adding "masuk
 * dengan Claude" is one entry here plus one adapter in `convex/ai/oauth.ts`,
 * with zero new cases in the settings UI.
 *
 * Deliberately carries no client_id / secret / endpoint: `startOAuthConnect`
 * composes the authorize URL server-side, so `listAIProviders` — which is
 * unauthenticated — never has to publish anything but copy and a local path.
 */
export interface AIAuthSpec {
  /** Paste-your-own-key. Absent would mean the key form is useless here. */
  apiKey?: { docsUrl?: string };
  /** Present ONLY when `convex/ai/oauth.ts` has a working adapter. */
  oauth?: AIOAuthSpec;
}

export interface AIProviderSpec {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  models: readonly string[];
  auth: AIAuthSpec;
}

/**
 * Hand-maintained on purpose. The obvious upgrade — `@rahmanef/models`, whose
 * catalog auto-updates from models.dev — cannot be imported into this file:
 * its only importable entry is `.` (the exports map has no `./registry`
 * subpath), and that entry statically pulls `node:fs/promises`, `node:os` and
 * `node:path` in via catalog.js + store.js. esbuild keeps all three even when
 * only `PROVIDERS` is imported, and every module under convex/ runs in the V8
 * isolate (nothing here declares `"use node"`), so `convex deploy` dies on six
 * unresolved builtin imports — inside the pre-push hook, i.e. blocking the push.
 *
 * Splitting this file so an action-only half could go `"use node"` would not
 * help either: `listAIProviders` is a *query*, and a query cannot `fetch`. An
 * auto-updating picker needs an action that pulls models.dev, a cache table,
 * and `listAIProviders` reading that table instead of this const.
 */
export const AI_PROVIDERS: Record<string, AIProviderSpec> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: [
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4.1-nano",
      "gpt-4o",
      "gpt-4o-mini",
      "o4-mini",
    ],
    // No `oauth`. Evaluated 2026-07-31 against the working device-code flow in
    // models-rahmanef-com (convex/codexLib.ts) and rejected on all three axes,
    // so this is a verdict rather than a TODO:
    //
    // YIELD — not a key. `{access, refresh, expires, accountId}` good against
    // chatgpt.com/backend-api/codex/responses, the CONSUMER backend, not
    // api.openai.com: Responses API body shape, SSE-only, and the Cloudflare in
    // front of it serves only an allow-listed `originator: codex_cli_rs`. None
    // of that fits `ResolvedAI {baseUrl, apiKey}` or the nine
    // `${cfg.baseUrl}/chat/completions` → `choices[0].message.content` call
    // sites, so adopting it means branching all nine or writing a translator.
    // LIFETIME — `expires_in` 3600, and the refresh token is single-use, so two
    // concurrent actions racing it invalidate the credential outright. Paying
    // for that needs an expiry + bundle column on `aiSettings` (it has
    // neither), a write inside `resolveAI` (today a pure read shared by five
    // action files), and a single-flight lease — models-rahmanef-com spends
    // `claimRefresh` + `refreshLeaseUntil` + a 1.5s loser sleep on exactly this.
    // TERMS — the flow authenticates with the Codex CLI's OWN client_id under a
    // spoofed CLI User-Agent (see codexLib.ts; the literal id stays out of this
    // public repo). That is this app presenting itself as OpenAI's first-party
    // CLI, and the ban for it lands on the user's own ChatGPT subscription.
    // Narrowing it to personal BYOK does not change that.
    //
    // Revisiting = descriptor + adapter + schema + lease in ONE change.
    auth: { apiKey: { docsUrl: "https://platform.openai.com/api-keys" } },
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    models: [
      "openai/gpt-4o-mini",
      "openai/gpt-4o",
      "anthropic/claude-sonnet-4.5",
      "anthropic/claude-haiku-4.5",
      "google/gemini-2.5-pro",
      "google/gemini-2.5-flash",
      "x-ai/grok-4",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-chat",
      "moonshotai/kimi-k2",
    ],
    auth: {
      apiKey: { docsUrl: "https://openrouter.ai/keys" },
      // The only OAuth worth shipping first: the exchange hands back an
      // ordinary `sk-or-…` key, so it lands in the same `aiSettings.apiKey`
      // field the manual path writes — no refresh, no expiry, no change to
      // `resolveAI` or the proxy call.
      oauth: {
        kind: "pkce_key",
        handoff: "redirect",
        label: "Masuk dengan OpenRouter",
        callbackPath: "/oauth/openrouter/callback",
      },
    },
  },
  // No `anthropic` entry on purpose. Claude is reachable through openrouter
  // above, and the direct "Sign in with Claude Pro/Max" PKCE flow
  // (models-rahmanef-com convex/claudeLib.ts) was evaluated 2026-07-31 and
  // rejected on the same three axes as `openai`. It yields a 1h access+refresh
  // bundle for api.anthropic.com/v1/messages, which is not OpenAI-compatible —
  // different body, different response shape — so no `/chat/completions` call
  // site can use it. Worse, Anthropic rejects the OAuth token unless the FIRST
  // system block is literally "You are Claude Code, Anthropic's official CLI
  // for Claude", which would have to be prepended ahead of every Indonesian
  // system prompt here. It authenticates with Claude Code's OWN client_id (in
  // claudeLib.ts, deliberately not copied here) whose redirect_uri is pinned
  // to console.anthropic.com (which is why that flow would be
  // `handoff: "paste"`) — first-party impersonation
  // again, with the ban landing on the user's own Claude subscription.
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.5-flash",
    models: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
    ],
    auth: { apiKey: { docsUrl: "https://aistudio.google.com/apikey" } },
  },
  groq: {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "deepseek-r1-distill-llama-70b",
      "qwen-2.5-32b",
      "mixtral-8x7b-32768",
    ],
    auth: { apiKey: { docsUrl: "https://console.groq.com/keys" } },
  },
  grok: {
    id: "grok",
    label: "xAI Grok",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-4",
    models: ["grok-4", "grok-3", "grok-3-mini", "grok-code-fast-1"],
    auth: { apiKey: { docsUrl: "https://console.x.ai" } },
  },
  glm: {
    id: "glm",
    label: "Zhipu GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4.6",
    models: ["glm-4.6", "glm-4.5", "glm-4.5-air", "glm-4-plus", "glm-4-air"],
    auth: { apiKey: { docsUrl: "https://open.bigmodel.cn/usercenter/apikeys" } },
  },
  moonshot: {
    id: "moonshot",
    label: "Moonshot Kimi",
    baseUrl: "https://api.moonshot.ai/v1",
    defaultModel: "kimi-k2.5",
    models: ["kimi-k2.5", "kimi-k2-thinking", "kimi-k2-thinking-turbo", "kimi-k2-turbo"],
    auth: { apiKey: { docsUrl: "https://platform.moonshot.ai/console/api-keys" } },
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    auth: { apiKey: { docsUrl: "https://platform.deepseek.com/api_keys" } },
  },
  mistral: {
    id: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    models: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"],
    auth: { apiKey: { docsUrl: "https://console.mistral.ai/api-keys" } },
  },
  custom: {
    id: "custom",
    label: "Kustom (OpenAI-compat)",
    baseUrl: "",
    defaultModel: "",
    models: [],
    // No docs link: the whole point of "custom" is an endpoint we know nothing
    // about. It still declares `apiKey` — the form is the only way to use it.
    auth: { apiKey: {} },
  },
};

export type AIProviderId = keyof typeof AI_PROVIDERS;

export function resolveProviderBaseUrl(provider: string, override?: string): string {
  const trimmed = override?.trim();
  if (trimmed) return trimmed.replace(/\/+$/, "");
  const spec = AI_PROVIDERS[provider];
  if (!spec || !spec.baseUrl) {
    throw new Error(`Provider AI tidak dikenal: ${provider}`);
  }
  return spec.baseUrl.replace(/\/+$/, "");
}

/**
 * Upstream gateway failure (401/402/429/5xx) → the sentence the user reads.
 *
 * ConvexError, not Error: prod Convex redacts an uncaught Error to a bare
 * "Server Error", so the status and body we used to put in the thrown message
 * never reached the browser at all — `humanMessage` stripped the envelope down
 * to "" and the toast fell back to the caller's generic title ("Gangguan
 * layanan AI"). A drained OpenRouter balance therefore looked exactly like a
 * transient blip, and neither looked different from the per-user quota toast,
 * even though the three next actions are "wait for us", "retry", "wait a
 * minute". `data.message` survives the RPC boundary intact (same trick as
 * `authError` and `enforceRateLimit`).
 *
 * The raw status + response body deliberately stay OUT of this message — they
 * go to `recordError` so ops can see "402 insufficient credits" and top the key
 * up. Avoid the substring "quota" here: notify.ts's KNOWN_ERRORS rewrites it
 * into the per-user-limit copy, which is the one thing this must not say.
 *
 * `source` is `ResolvedAI.source` — on a 401/402/403 it decides who owns the
 * broken key. With `"user"` the key came from that user's own Setelan → AI, so
 * "gangguan di sisi kami" would be a lie that leaves them waiting for a fix
 * only they can make. Not typed as ResolvedAI["source"]: aiResolve imports this
 * module, so the import would be circular.
 */
export function aiUnavailableError(
  status: number,
  source?: string,
): ConvexError<{ message: string }> {
  const message =
    status === 429
      ? "Layanan AI sedang penuh. Tunggu sebentar lalu coba lagi."
      : status === 401 || status === 402 || status === 403
        ? source === "user"
          ? "API key AI Anda tidak diterima layanan (kedaluwarsa atau saldo habis). Perbarui di Setelan → AI."
          : "Layanan AI sedang tidak tersedia — gangguan di sisi kami, bukan kuota Anda. Tim sudah diberi tahu."
        : "Layanan AI sedang bermasalah. Coba lagi beberapa menit lagi.";
  return new ConvexError({ message });
}

/**
 * The declared OAuth flow for a provider, or null. Every caller — settings
 * UI, connect mutation, callback route — asks THIS rather than comparing the
 * id to "openrouter". The string comparison is exactly what the `auth` shape
 * exists to delete, and it is what makes a second provider a UI rewrite.
 */
export function providerOAuth(id: string): AIOAuthSpec | null {
  return AI_PROVIDERS[id]?.auth.oauth ?? null;
}

/**
 * Provider list for the (unauthenticated) `listAIProviders` query. Everything
 * here is static config; `auth` adds no secret because `AIAuthSpec` holds no
 * client id, endpoint or key material.
 *
 * `docsUrl` stays in the payload — derived from `auth.apiKey`, not stored
 * twice — because AISettingsPanel and AIConfigPanel already read it. Deriving
 * it is what keeps the two from drifting apart.
 */
export function listProvidersPublic() {
  return Object.values(AI_PROVIDERS).map(({ id, label, baseUrl, defaultModel, models, auth }) => ({
    id,
    label,
    baseUrl,
    defaultModel,
    models: [...models],
    docsUrl: auth.apiKey?.docsUrl,
    auth,
  }));
}
