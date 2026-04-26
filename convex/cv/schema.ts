import { defineTable } from "convex/server";
import { v } from "convex/values";

export const cvTables = {
  cvs: defineTable({
    userId: v.id("users"),
    title: v.string(),
    template: v.string(),
    personalInfo: v.object({
      fullName: v.string(),
      email: v.string(),
      phone: v.string(),
      location: v.string(),
      linkedin: v.optional(v.string()),
      portfolio: v.optional(v.string()),
      summary: v.string(),
      avatarStorageId: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
    }),
    displayPrefs: v.optional(v.object({
      showPicture: v.optional(v.boolean()),
      showAge: v.optional(v.boolean()),
      showGraduationYear: v.optional(v.boolean()),
      templateId: v.optional(v.string()),
    })),
    experience: v.array(v.object({
      id: v.string(),
      company: v.string(),
      position: v.string(),
      startDate: v.string(),
      endDate: v.optional(v.string()),
      current: v.boolean(),
      description: v.string(),
      achievements: v.array(v.string()),
    })),
    education: v.array(v.object({
      id: v.string(),
      institution: v.string(),
      degree: v.string(),
      field: v.string(),
      startDate: v.string(),
      endDate: v.string(),
      gpa: v.optional(v.string()),
    })),
    skills: v.array(v.object({
      id: v.string(),
      name: v.string(),
      category: v.string(),
      proficiency: v.number(),
    })),
    certifications: v.array(v.object({
      id: v.string(),
      name: v.string(),
      issuer: v.string(),
      date: v.string(),
      expiryDate: v.optional(v.string()),
    })),
    languages: v.array(v.object({
      language: v.string(),
      proficiency: v.string(),
    })),
    projects: v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      technologies: v.array(v.string()),
      link: v.optional(v.string()),
    })),
    isDefault: v.boolean(),
  }).index("by_user", ["userId"]),
};
