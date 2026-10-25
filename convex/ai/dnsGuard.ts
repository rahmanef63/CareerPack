"use node";

import { v, ConvexError } from "convex/values";
import { lookup } from "node:dns/promises";
import { isPrivateHost } from "../_shared/aiProviders";
import { internalAction } from "../_generated/server";

/**
 * Resolve a hostname once, right before we send a user's API key to it.
 *
 * Why this is a separate `"use node"` file: `isPrivateHost` catches a
 * literal address, but a name like `gw.attacker.example` can answer with
 * `127.0.0.1` or `169.254.169.254`. That is DNS rebinding, and blocking it
 * needs a resolver — which the V8 isolate every other convex/ module runs in
 * does not have. Putting `"use node"` on `convex/ai/actions.ts` instead would
 * have dragged the whole AI surface onto the Node runtime to buy one lookup.
 *
 * Deliberately an internalAction, not a helper: an action can be called from
 * another action (`ctx.runAction`), which is the only place this needs to run.
 * A query or mutation cannot reach it, and neither can a client.
 *
 * NOT a cache. A cached verdict is exactly what rebinding defeats — the second
 * request would reuse the benign answer from the first.
 */
export const assertPublicResolution = internalAction({
  args: { baseUrl: v.string() },
  returns: v.null(),
  handler: async (_ctx, { baseUrl }) => {
    const host = new URL(baseUrl).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    // Literal addresses never reach this point with a public value — the
    // isolate-side check already refused them — but re-checking is one call
    // and makes this file correct on its own.
    if (isPrivateHost(host)) {
      throw new ConvexError({ message: "Base URL menunjuk ke alamat privat." });
    }

    let addresses: Array<{ address: string }>;
    try {
      addresses = await lookup(host, { all: true, verbatim: true });
    } catch {
      throw new ConvexError({ message: `Nama host ${host} tidak bisa di-resolve. Periksa Base URL.` });
    }
    if (!addresses.length) {
      throw new ConvexError({ message: `Nama host ${host} tidak punya alamat IP.` });
    }
    // ALL answers, not just the first: a resolver that returns one public and
    // one private address would otherwise pass on whichever the runtime
    // happened to pick.
    for (const { address } of addresses) {
      if (isPrivateHost(address)) {
        throw new ConvexError({
          message: `Base URL menunjuk ke alamat privat (${address}). Pakai host publik untuk endpoint kustom.`,
        });
      }
    }
    return null;
  },
});
