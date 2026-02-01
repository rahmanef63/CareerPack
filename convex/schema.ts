import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  userProfiles: defineTable({
    userId: v.id("users"),
    fullName: v.string(),
    phone: v.optional(v.string()),
    location: v.string(),
    targetRole: v.string(),
    experienceLevel: v.string(),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    // Legacy fields for backward compatibility
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    preferredIndustries: v.optional(v.array(v.string())),
  }).index("by_user", ["userId"]),

  jobApplications: defineTable({
    userId: v.id("users"),
    company: v.string(),
    position: v.string(),
    location: v.string(),
    salary: v.optional(v.string()),
    status: v.string(),
    appliedDate: v.number(),
    source: v.string(),
    notes: v.optional(v.string()),
    interviewDates: v.array(v.object({
      type: v.string(),
      date: v.number(),
      notes: v.optional(v.string()),
    })),
    documents: v.array(v.string()),
  }).index("by_user", ["userId"]),

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
    }),
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

  skillRoadmaps: defineTable({
    userId: v.id("users"),
    careerPath: v.string(),
    skills: v.array(v.object({
      id: v.string(),
      name: v.string(),
      category: v.string(),
      level: v.string(),
      priority: v.number(),
      estimatedHours: v.number(),
      prerequisites: v.array(v.string()),
      status: v.string(),
      resources: v.array(v.object({
        type: v.string(),
        title: v.string(),
        url: v.string(),
        completed: v.boolean(),
      })),
      completedAt: v.optional(v.number()),
    })),
    progress: v.number(),
  }).index("by_user", ["userId"]),

  documentChecklists: defineTable({
    userId: v.id("users"),
    type: v.string(),
    country: v.optional(v.string()),
    documents: v.array(v.object({
      id: v.string(),
      name: v.string(),
      category: v.string(),
      required: v.boolean(),
      completed: v.boolean(),
      notes: v.string(),
      expiryDate: v.optional(v.string()),
    })),
    progress: v.number(),
  }).index("by_user", ["userId"]),

  mockInterviews: defineTable({
    userId: v.id("users"),
    type: v.string(),
    role: v.string(),
    difficulty: v.string(),
    questions: v.array(v.object({
      id: v.string(),
      question: v.string(),
      category: v.string(),
      userAnswer: v.optional(v.string()),
      feedback: v.optional(v.string()),
      score: v.optional(v.number()),
      answeredAt: v.optional(v.number()),
    })),
    overallScore: v.optional(v.number()),
    feedback: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    startedAt: v.number(),
  }).index("by_user", ["userId"]),

  financialPlans: defineTable({
    userId: v.id("users"),
    type: v.string(),
    targetLocation: v.optional(v.string()),
    currentSalary: v.optional(v.number()),
    targetSalary: v.number(),
    expenses: v.object({
      housing: v.number(),
      food: v.number(),
      transportation: v.number(),
      healthcare: v.number(),
      education: v.number(),
      entertainment: v.number(),
      savings: v.number(),
      other: v.number(),
    }),
    relocationCosts: v.optional(v.object({
      visa: v.number(),
      flights: v.number(),
      accommodation: v.number(),
      shipping: v.number(),
      emergency: v.number(),
    })),
    timeline: v.number(),
    readinessScore: v.number(),
  }).index("by_user", ["userId"]),

  careerGoals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    targetDate: v.number(),
    status: v.string(),
    progress: v.number(),
    milestones: v.array(v.object({
      id: v.string(),
      title: v.string(),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    })),
  }).index("by_user", ["userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  chatConversations: defineTable({
    userId: v.id("users"),
    messages: v.array(v.object({
      id: v.string(),
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
