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
});
