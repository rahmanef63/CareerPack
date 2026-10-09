import { defineTable } from "convex/server";
import { v } from "convex/values";

export const filesTables = {
  uploadIntents: defineTable({
    userId: v.id("users"), tokenHash: v.string(), expiresAt: v.number(),
    claimedAt: v.optional(v.number()), storageId: v.optional(v.string()),
    fileType: v.optional(v.string()), fileSize: v.optional(v.number()),
  }).index("by_token", ["tokenHash"]).index("by_storage", ["storageId"]).index("by_user", ["userId"]),
  files: defineTable({
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
    /**
     * NOT multi-tenancy. This app has no tenant entity, no memberships, and no
     * per-tenant roles — the name is a leftover. Every writer sets it to
     * `userId.toString()` and every reader asserts `tenantId === userId.toString()`
     * (see `files/ownership.ts`, `files/queries.ts`, `files/mutations.ts`,
     * `profile/mutations.ts`), so in practice it is a stringly-typed duplicate of
     * `uploadedBy` that exists to give `by_tenant` an index key.
     *
     * Deliberately NOT renamed: it is load-bearing across five modules plus two
     * test files, and a rename buys nothing a comment doesn't. But do not read
     * it as an isolation boundary and do not build one on it — if real
     * multi-tenancy ever lands it needs its own table, not this column.
     */
    tenantId: v.string(),
    createdAt: v.number(),
    // Content Library metadata. Both optional — old rows have neither
    // and the library page treats absent as untagged / no note.
    tags: v.optional(v.array(v.string())),
    note: v.optional(v.string()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_user", ["uploadedBy"])
    .index("by_storage", ["storageId"]),
};
