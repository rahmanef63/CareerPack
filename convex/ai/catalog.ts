import { v } from "convex/values";
import { internalAction, internalMutation, type MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { AI_PROVIDERS } from "../_shared/aiProviders";

/**
 * Keeps the admin model picker current without anyone editing a list.
 *
 * `AI_PROVIDERS` is hand-maintained and goes stale the moment a vendor ships a
 * model — see the comment there for why `@rahmanef/models`, which solves
 * exactly this, cannot be imported: its entry point statically pulls
 * `node:fs/promises`, `node:os` and `node:path`, and every module under
 * `convex/` runs in the V8 isolate, so `convex deploy` dies on unresolved
 * builtins. This delivers the same gain the package was wanted for, using the
 * same upstream (models.dev), in the ~60 lines the constraint leaves room for.
 *
 * What is cached and what is NOT: only model IDS, per provider. models.dev
 * carries no baseUrls, and the connection facts in `AI_PROVIDERS` (baseUrl,
 * label, docsUrl, defaultModel) are what actually make a request work — those
 * stay hand-maintained and authoritative. The catalog is additive: it can
 * introduce a model, never retire a provider or repoint one.
 *
 * The whole api.json is 3.3MB, well past Convex's 1MB document limit, so the
 * fetch flattens to `{provider: [modelId]}` for the providers this app
 * actually supports — about 13KB — and discards the rest.
 */

/**
 * Our provider id → models.dev's, where they disagree. Absent means identical.
 * Anything unmapped and unmatched simply keeps its hand-maintained list, which
 * is why a rename upstream degrades to "no new models" rather than an error.
 */
const MODELS_DEV_ID: Record<string, string> = {
  gemini: "google",
  grok: "xai",
  glm: "zhipuai",
  moonshot: "moonshotai",
};

/** `custom` is a user-supplied endpoint — there is no upstream list for it. */
const SKIP = new Set(["custom"]);

export const _writeModelCatalog = internalMutation({
  args: {
    providers: v.array(v.object({ id: v.string(), models: v.array(v.string()) })),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, { providers }) => {
    const existing = await ctx.db.query("modelCatalog").first();
    const row = { providers, fetchedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, row);
    } else {
      await ctx.db.insert("modelCatalog", row);
    }
    return null;
  },
});

export const refreshModelCatalog = internalAction({
  args: {},
  returns: v.object({ ok: v.boolean(), providers: v.number(), models: v.number() }),
  handler: async (ctx) => {
    // No timeout wrapper and no retry: this runs on a cron with nothing waiting
    // on it, and a stale catalog is a working product — the picker falls back
    // to the hand-maintained list until the next tick.
    const res = await fetch("https://models.dev/api.json");
    if (!res.ok) {
      console.error(`[modelCatalog] models.dev returned ${res.status}`);
      return { ok: false, providers: 0, models: 0 };
    }
    const upstream = (await res.json()) as Record<string, { models?: Record<string, unknown> }>;

    const providers: Array<{ id: string; models: string[] }> = [];
    for (const id of Object.keys(AI_PROVIDERS)) {
      if (SKIP.has(id)) continue;
      const models = upstream[MODELS_DEV_ID[id] ?? id]?.models;
      if (!models) continue;
      const ids = Object.keys(models).sort();
      if (ids.length) providers.push({ id, models: ids });
    }

    // An empty result means the response shape changed. Writing it would wipe a
    // good catalog and silently shrink every picker, so keep the old row.
    if (!providers.length) {
      console.error("[modelCatalog] models.dev matched no known provider — keeping the cached catalog");
      return { ok: false, providers: 0, models: 0 };
    }

    await ctx.runMutation(internal.ai.catalog._writeModelCatalog, { providers });
    return {
      ok: true,
      providers: providers.length,
      models: providers.reduce((n, p) => n + p.models.length, 0),
    };
  },
});
