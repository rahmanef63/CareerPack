import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { query } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";

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
        if (password.length < 4) {
          throw new Error("Password must be at least 4 characters");
        }
      },
      // Use PBKDF2 (WebCrypto) instead of default Scrypt — Scrypt times out
      // behind Dokploy's reverse proxy (>60s) causing dropped WebSocket actions.
      crypto: {
        async hashSecret(password: string) {
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const enc = new TextEncoder();
          const km = await crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            "PBKDF2",
            false,
            ["deriveBits"],
          );
          const buf = await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt, iterations: 10000, hash: "SHA-256" },
            km,
            256,
          );
          const hex = (a: Uint8Array) =>
            Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
          return `pbkdf2_${hex(salt)}_${hex(new Uint8Array(buf))}`;
        },
        async verifySecret(password: string, hash: string) {
          const parts = hash.split("_");
          if (parts[0] !== "pbkdf2" || parts.length !== 3) return false;
          const salt = new Uint8Array(
            parts[1].match(/.{2}/g)!.map((b) => parseInt(b, 16)),
          );
          const enc = new TextEncoder();
          const km = await crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            "PBKDF2",
            false,
            ["deriveBits"],
          );
          const buf = await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt, iterations: 10000, hash: "SHA-256" },
            km,
            256,
          );
          const hex = Array.from(new Uint8Array(buf))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          return hex === parts[2];
        },
      },
    }),
    Anonymous,
  ],
});

export const loggedInUser = query({
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
