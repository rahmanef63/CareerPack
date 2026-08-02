import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import Google from "@auth/core/providers/google";
import { v } from "convex/values";
import { query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";
import { bootstrapUser } from "./_shared/bootstrapUser";
import { hashSecret, verifySecret } from "./_shared/passwordCrypto";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
      validatePasswordRequirements: (password: string) => {
        if (password.length < 8) {
          throw new Error("Kata sandi minimal 8 karakter");
        }
        if (password.length > 128) {
          throw new Error("Kata sandi terlalu panjang (maks 128)");
        }
        const hasLetter = /[A-Za-z]/.test(password);
        const hasDigit = /\d/.test(password);
        if (!hasLetter || !hasDigit) {
          throw new Error("Kata sandi harus mengandung huruf dan angka");
        }
      },
      // Use PBKDF2 (WebCrypto) instead of default Scrypt — Scrypt times out
      // behind Dokploy's reverse proxy (>60s) causing dropped WebSocket actions.
      // Iterations = 100k: OWASP 2023 minimum untuk PBKDF2-SHA256.
      // Pure hash/verify logic lives in `_shared/passwordCrypto.ts` so it can
      // be unit-tested; do not inline it back here.
      crypto: {
        hashSecret,
        verifySecret,
      },
    }),
    Anonymous,
    // Google OAuth registers ONLY when both creds are set — otherwise a
    // "Continue with Google" click 500s on the callback. Deploys that never
    // set these keep Password + Anonymous untouched. env is read at
    // module-eval, so changing the creds needs a backend redeploy/restart.
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [Google]
      : []),
  ],
  callbacks: {
    /**
     * Create the user's `userProfiles` row here, inside the same mutation that
     * inserts the `users` row, instead of trusting the browser to call
     * `seedForCurrentUser` afterwards.
     *
     * The browser call raced: the WebSocket auth context attaches
     * asynchronously after `signIn` resolves, so the mutation threw
     * "Tidak terautentikasi" and useAuth swallowed it. The 6×200ms retry meant
     * to cover that gap lost 23 of 35 email accounts in production — every one
     * of them typed a name at sign-up and then met a dashboard greeting them by
     * a fragment of their email address, with no welcome email sent. There is
     * no client and no token involved on this path, so it cannot race.
     *
     * Only on account CREATION: `existingUserId` is non-null for a sign-in to
     * an account that already exists, and bootstrapping is a first-run concern.
     *
     * Never allowed to fail the sign-up. A user with an account and no profile
     * row is recoverable — `seedForCurrentUser` still runs from the client and
     * is idempotent — whereas a thrown error here means no account at all.
     */
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId) return;
      try {
        // The callback hands us Convex's generic mutation ctx; bootstrapUser is
        // typed against this project's DataModel. Same object at runtime.
        await bootstrapUser(ctx as unknown as MutationCtx, userId);
      } catch (error) {
        console.error("[auth] bootstrapUser failed after user creation:", error);
      }
    },
  },
});

export const loggedInUser = query({
  args: {},
  returns: v.union(v.null(), v.any()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get("users", userId);
    if (!user) {
      return null;
    }
    return user;
  },
});
