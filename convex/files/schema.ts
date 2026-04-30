import { defineTable } from "convex/server";
import { v } from "convex/values";

export const filesTables = {
  files: defineTable({
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
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
