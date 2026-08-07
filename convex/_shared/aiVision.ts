/**
 * Which chat models can read an image content-part.
 *
 * The CV import sends rasterised pages through the same OpenAI-compatible
 * proxy every other action uses, and a text-only model answers that request
 * with a provider 400 — which `aiUnavailableError` renders as "coba lagi
 * beberapa menit lagi", a retry-forever message on a permanent failure, after
 * the quota slot is already spent. Checking the resolved model id up front is
 * what turns that into an actionable "ganti model di Setelan → AI".
 *
 * Hand-maintained against `AI_PROVIDERS` in `aiProviders.ts`. Unknown ids
 * FAIL OPEN: the `custom` provider accepts any model string, so an exact-match
 * Set would hard-block self-hosted vision models we have never heard of.
 */

export const VISION_MODELS: ReadonlySet<string> = new Set([
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",
  "o4-mini",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "claude-sonnet-4.5",
  "claude-haiku-4.5",
  "grok-4",
  "mistral-small-latest",
]);

export const TEXT_ONLY_MODELS: ReadonlySet<string> = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "deepseek-r1-distill-llama-70b",
  "qwen-2.5-32b",
  "mixtral-8x7b-32768",
  "deepseek-chat",
  "deepseek-reasoner",
  "glm-4.6",
  "glm-4.5",
  "glm-4.5-air",
  "glm-4-plus",
  "glm-4-air",
  // OpenRouter ships `moonshotai/kimi-k2`, an id the Moonshot provider itself
  // does not list; without it the one Kimi most users reach falls through to
  // "unknown" and gets the retry-forever message instead of "ganti model".
  "kimi-k2",
  "kimi-k2.5",
  "kimi-k2-thinking",
  "kimi-k2-thinking-turbo",
  "kimi-k2-turbo",
  "grok-3",
  "grok-3-mini",
  "grok-code-fast-1",
  "llama-3.3-70b-instruct",
  "mistral-large-latest",
  "codestral-latest",
]);

/** Strips the OpenRouter-style `vendor/` prefix — `openai/gpt-4o-mini` and
 *  `gpt-4o-mini` are the same model to us. */
export function normalizeModelId(model: string): string {
  return model.trim().toLowerCase().split("/").pop() ?? "";
}

export function visionSupport(model: string): "yes" | "no" | "unknown" {
  const id = normalizeModelId(model);
  if (VISION_MODELS.has(id)) return "yes";
  if (TEXT_ONLY_MODELS.has(id)) return "no";
  return "unknown";
}
