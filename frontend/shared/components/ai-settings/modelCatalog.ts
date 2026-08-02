/** One row of `api.ai.actions.listOpenRouterModels`. */
export interface CatalogModel {
  id: string;
  name: string;
  promptUsd: number;
  completionUsd: number;
  context: number;
}

export interface ModelChip {
  id: string;
  hint?: string;
}

/**
 * Slugs worth a one-click chip, per provider. Data, not a branch: the picker
 * never asks which provider it is looking at, it asks this table.
 *
 * Only OpenRouter is curated because only OpenRouter's catalog is big enough
 * for "pick one of these ten" to beat scrolling — `listAIProviders` unions the
 * hand-maintained list with the models.dev cache and sorts it, so for
 * OpenRouter the first N alphabetically is noise.
 */
const FEATURED: Record<string, readonly ModelChip[]> = {
  openrouter: [
    { id: "openai/gpt-4o-mini", hint: "Murah, cepat, default" },
    { id: "openai/gpt-4o", hint: "Lebih kuat, lebih mahal" },
    { id: "anthropic/claude-haiku-4.5", hint: "Cepat, ringan" },
    { id: "anthropic/claude-sonnet-4.5", hint: "Penalaran terbaik" },
    { id: "google/gemini-2.5-flash", hint: "Murah, multimodal" },
    { id: "google/gemini-2.5-pro", hint: "Konteks panjang" },
    { id: "x-ai/grok-4", hint: "Penalaran kuat" },
    { id: "deepseek/deepseek-chat", hint: "Sangat murah" },
    { id: "meta-llama/llama-3.3-70b-instruct", hint: "Open weights" },
    { id: "moonshotai/kimi-k2", hint: "Konteks panjang" },
  ],
};

/** Chips are a shortcut; past this many they are a wall of text. */
const MAX_CHIPS = 8;

/**
 * The chip row. Uncurated providers fall back to the head of their own model
 * list — every slug there belongs to that provider, so a slice is a reasonable
 * shortcut, and the full list stays reachable through the input's datalist.
 */
export function modelChips(spec?: { id: string; models: string[] } | null): ModelChip[] {
  if (!spec) return [];
  const curated = FEATURED[spec.id];
  if (curated) return [...curated];
  return spec.models.slice(0, MAX_CHIPS).map((id) => ({ id }));
}

/**
 * Whether a live catalog (count, pricing, slug check) is fetchable for this
 * provider. This one IS keyed by id, honestly: the backing action is literally
 * `listOpenRouterModels` hitting openrouter.ai. A second provider's catalog
 * means a second action, and this table is where it gets declared — not in JSX.
 */
export function hasLiveCatalog(providerId?: string | null): boolean {
  return providerId === "openrouter";
}

export type SlugStatus = "empty" | "unverifiable" | "valid" | "unlisted";

/**
 * Free text is always accepted — the catalog is a typo check, not a gate. So
 * "unlisted" is a warning and "unverifiable" (no catalog for this provider, or
 * it failed to load) says nothing at all rather than guessing.
 */
export function slugStatus(value: string, catalog: readonly CatalogModel[] | null): SlugStatus {
  const trimmed = value.trim();
  if (!trimmed) return "empty";
  if (!catalog) return "unverifiable";
  return catalog.some((m) => m.id === trimmed) ? "valid" : "unlisted";
}
