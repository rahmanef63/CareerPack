import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

import { profileTables } from "./profile/schema";
import { applicationsTables } from "./applications/schema";
import { cvTables } from "./cv/schema";
import { roadmapTables } from "./roadmap/schema";
import { documentsTables } from "./documents/schema";
import { mockInterviewTables } from "./mockInterview/schema";
import { financialTables } from "./financial/schema";
import { goalsTables } from "./goals/schema";
import { notificationsTables } from "./notifications/schema";
import { aiTables } from "./ai/schema";
import { calendarTables } from "./calendar/schema";
import { observabilityTables } from "./admin/schema";
import { feedbackTables } from "./feedback/schema";
import { portfolioTables } from "./portfolio/schema";
import { contactsTables } from "./contacts/schema";
import { filesTables } from "./files/schema";
import { matcherTables } from "./matcher/schema";
import { onboardingTables } from "./onboarding/schema";
import { engineTables } from "./engine/schema";
import { graphTables } from "./engine/graph/schema";
import { outcomesTables } from "./engine/outcomes/schema";
import { planTables } from "./engine/plan/schema";

// Auth-adjacent table — kept inline here so it lives next to the
// passwordReset.ts module which owns the writes. (passwordReset.ts is
// at the convex root because it's auth-adjacent and avoids an
// `auth.ts`/`auth/` folder name collision; see docs/progress/2026-04-25-convex-restructure.md.)
const passwordResetTables = {
  passwordResetTokens: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_hash", ["tokenHash"]),

  // Per-IP rate-limit bucket for unauthenticated `/api/password-reset/request`
  // httpAction. Mutations don't see the request IP, so the IP must be
  // hashed in the httpAction first and passed to the internal mutation.
  // Stored hash (SHA-256 hex) — never raw IP — to keep the table privacy-safe.
  passwordResetIpEvents: defineTable({
    ipHash: v.string(),
    timestamp: v.number(),
  }).index("by_ipHash_time", ["ipHash", "timestamp"]),

  // Per-IP rate-limit bucket for `/api/auth/check-email` (gate on the
  // signIn-vs-signUp pre-check). Without this, anyone could enumerate
  // registered emails by spamming the public query.
  loginCheckIpEvents: defineTable({
    ipHash: v.string(),
    timestamp: v.number(),
  }).index("by_ipHash_time", ["ipHash", "timestamp"]),

  // Idempotency cache for AI actions. WebSocket retry / user
  // double-click should NOT charge quota or hit the upstream provider
  // twice — the action wraps its body with `withIdempotency(ctx,
  // userId, key, fn)`, which returns the cached result on duplicate
  // keys. 30-minute TTL via `pruneAppendOnlyTables`.
  aiIdempotency: defineTable({
    userId: v.id("users"),
    key: v.string(),
    resultJson: v.string(),
    createdAt: v.number(),
  })
    .index("by_user_key", ["userId", "key"])
    .index("by_createdAt", ["createdAt"]),
};

export default defineSchema({
  ...authTables,
  ...profileTables,
  ...applicationsTables,
  ...cvTables,
  ...roadmapTables,
  ...documentsTables,
  ...mockInterviewTables,
  ...financialTables,
  ...goalsTables,
  ...notificationsTables,
  ...aiTables,
  ...calendarTables,
  ...observabilityTables,
  ...feedbackTables,
  ...passwordResetTables,
  ...portfolioTables,
  ...contactsTables,
  ...filesTables,
  ...matcherTables,
  ...onboardingTables,
  ...engineTables,
  ...graphTables,
  ...outcomesTables,
  ...planTables,
});
