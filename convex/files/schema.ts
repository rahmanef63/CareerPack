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
  })
    .index("by_tenant", ["tenantId"])
    .index("by_user", ["uploadedBy"])
    .index("by_storage", ["storageId"]),
};
