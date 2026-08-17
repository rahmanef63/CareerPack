import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { credEncryptionAvailable, encryptCred, isEncryptedCred } from "../_shared/aiCrypto";

/**
 * Re-encrypt the AI credentials that predate `AI_CRED_SECRET`.
 *
 * `_shared/aiCrypto.ts` deliberately encrypts only rows written AFTER the env
 * is set, so turning encryption on cannot take AI down for everyone at once.
 * The cost of that choice is a tail: rows written before it stay plaintext
 * forever, including the live global key every AI feature reads. Until this
 * existed there was no way to close that tail — docs/deployment.md §10 said so
 * outright ("tidak ada script re-encrypt") and left it as manual work: each
 * user re-saving their own key, an admin re-saving the global one.
 *
 * DRY RUN BY DEFAULT, matching admin/cleanup.ts. `apply: false` counts exactly
 * what `apply: true` would rewrite:
 *
 *   npx convex run --prod admin/aiCreds:reencryptAICreds '{}'
 *   npx convex run --prod admin/aiCreds:reencryptAICreds '{"apply":true}'
 *
 * Internal, so it is reachable from the CLI and from nothing user-facing.
 *
 * ⚠️ Encryption is only as durable as the env. A row rewritten here can no
 * longer be read if `AI_CRED_SECRET` is changed or removed — the plaintext it
 * replaced was recoverable by eye, this is not. `scripts/backup-prod.sh` stores
 * tables, NOT env vars, so the secret has to live somewhere else too (password
 * manager) before this is worth running. That is the whole trade: at-rest
 * protection bought with a key you must not lose.
 */
export const reencryptAICreds = internalMutation({
  args: { apply: v.optional(v.boolean()) },
  returns: v.object({
    secretConfigured: v.boolean(),
    applied: v.boolean(),
    userSettings: v.object({
      total: v.number(),
      plaintext: v.number(),
      alreadyEncrypted: v.number(),
      empty: v.number(),
    }),
    globalSettings: v.object({
      total: v.number(),
      plaintext: v.number(),
      alreadyEncrypted: v.number(),
      empty: v.number(),
    }),
    rewritten: v.number(),
  }),
  handler: async (ctx, { apply = false }) => {
    // Refuse rather than throw: a dry run on a deployment with no secret is a
    // legitimate question ("how many rows would this touch?"), and the answer
    // is useful even when the rewrite cannot happen yet.
    const secretConfigured = credEncryptionAvailable();

    const tally = () => ({ total: 0, plaintext: 0, alreadyEncrypted: 0, empty: 0 });
    const userSettings = tally();
    const globalSettings = tally();
    let rewritten = 0;

    for (const [table, counts] of [
      ["aiSettings", userSettings],
      ["globalAISettings", globalSettings],
    ] as const) {
      // Both tables are small — one row per user who configured a key, plus a
      // singleton — so a full scan is cheaper than an index nobody else needs.
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        counts.total += 1;
        const key = row.apiKey ?? "";
        if (key.trim() === "") {
          // A row can exist with no key at all: the settings form saves model
          // and provider preferences whether or not a key was entered.
          counts.empty += 1;
          continue;
        }
        if (isEncryptedCred(key)) {
          counts.alreadyEncrypted += 1;
          continue;
        }
        counts.plaintext += 1;
        if (apply && secretConfigured) {
          // Encrypt-then-patch per row. A single failure aborts the whole
          // mutation and Convex rolls it back, so this cannot leave half the
          // table in a state where some keys decrypt and others do not.
          // `updatedAt` is deliberately NOT bumped: it records when a human
          // last changed the setting, and re-encrypting the same secret is not
          // a change anyone made. Moving it would make every row look edited
          // on the day this ran.
          await ctx.db.patch(row._id, { apiKey: await encryptCred(key) });
          rewritten += 1;
        }
      }
    }

    return {
      secretConfigured,
      applied: apply && secretConfigured,
      userSettings,
      globalSettings,
      rewritten,
    };
  },
});
