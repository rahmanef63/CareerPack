import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

/**
 * Wrap an AI-action body so duplicate `(userId, key)` invocations
 * within the cache window return the prior result without charging
 * quota / re-hitting the upstream provider.
 *
 * Caller (action) takes an optional `idempotencyKey` arg from the
 * frontend — typically a `crypto.randomUUID()` minted per user-click.
 * If absent, we skip the cache entirely and run `fn()` directly.
 *
 * Lookup and store both hit `internal.aiIdempotency.*`. Failures on
 * the *store* side are swallowed — the user already has the real
 * result; cache miss on retry is graceful.
 *
 * Be conservative about what wraps this: pure mutations + actions
 * with stable serialisable output. Streaming / non-deterministic
 * output (e.g. AI temperature > 0 chats) should still cache the
 * *first* response — that's the whole point on retry.
 */
export async function withIdempotency<T>(
  ctx: ActionCtx,
  userId: Id<"users">,
  key: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  if (!key || key.length === 0 || key.length > 200) {
    return fn();
  }

  const cached = await ctx.runQuery(internal.aiIdempotency._lookup, {
    userId,
    key,
  });
  if (cached !== null) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // Stored row is corrupt — fall through and rerun.
    }
  }

  const result = await fn();

  try {
    await ctx.runMutation(internal.aiIdempotency._store, {
      userId,
      key,
      resultJson: JSON.stringify(result),
    });
  } catch {
    // Cache write best-effort; never mask the real result.
  }

  return result;
}
