import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser } from "./_lib/auth";

const defaultRoadmaps = {
  "frontend-developer": [
    {
      id: "html-css",
      name: "HTML & CSS Fundamentals",
      category: "Frontend Basics",
      level: "beginner",
      priority: 1,
      estimatedHours: 40,
      prerequisites: [],
      resources: [
        { type: "course", title: "HTML & CSS Crash Course", url: "#", completed: false },
        { type: "practice", title: "Build 5 Landing Pages", url: "#", completed: false },
      ],
    },
    {
      id: "javascript",
      name: "JavaScript ES6+",
      category: "Programming",
      level: "beginner",
      priority: 2,
      estimatedHours: 60,
      prerequisites: ["html-css"],
      resources: [
        { type: "course", title: "Modern JavaScript Course", url: "#", completed: false },
        { type: "book", title: "You Don't Know JS", url: "#", completed: false },
      ],
    },
    {
      id: "react",
      name: "React.js",
      category: "Framework",
      level: "intermediate",
      priority: 3,
      estimatedHours: 80,
      prerequisites: ["javascript"],
      resources: [
        { type: "course", title: "React Complete Guide", url: "#", completed: false },
        { type: "practice", title: "Build React Projects", url: "#", completed: false },
      ],
    },
  ],
  "backend-developer": [
    {
      id: "programming-basics",
      name: "Programming Fundamentals",
      category: "Basics",
      level: "beginner",
      priority: 1,
      estimatedHours: 50,
      prerequisites: [],
      resources: [
        { type: "course", title: "Programming Logic", url: "#", completed: false },
      ],
    },
    {
      id: "nodejs",
      name: "Node.js & Express",
      category: "Backend",
      level: "intermediate",
      priority: 2,
      estimatedHours: 70,
      prerequisites: ["programming-basics"],
      resources: [
        { type: "course", title: "Node.js Complete Course", url: "#", completed: false },
      ],
    },
  ],
};

export const getUserRoadmap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("skillRoadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const createRoadmap = mutation({
  args: { careerPath: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const existing = await ctx.db
      .query("skillRoadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) throw new Error("Roadmap sudah ada");

    const skills = defaultRoadmaps[args.careerPath as keyof typeof defaultRoadmaps] || [];
    const skillsWithStatus = skills.map((skill) => ({
      ...skill,
      status: "not-started" as const,
    }));

    return await ctx.db.insert("skillRoadmaps", {
      userId,
      careerPath: args.careerPath,
      skills: skillsWithStatus,
      progress: 0,
    });
  },
});

export const updateSkillProgress = mutation({
  args: {
    skillId: v.string(),
    status: v.string(),
    completedResources: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const roadmap = await ctx.db
      .query("skillRoadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!roadmap) throw new Error("Roadmap tidak ditemukan");

    const updatedSkills = roadmap.skills.map((skill) => {
      if (skill.id === args.skillId) {
        const updatedResources = skill.resources.map((resource) => ({
          ...resource,
          completed:
            args.completedResources?.includes(resource.title) || resource.completed,
        }));

        return {
          ...skill,
          status: args.status,
          resources: updatedResources,
          completedAt: args.status === "completed" ? Date.now() : skill.completedAt,
        };
      }
      return skill;
    });

    const completedSkills = updatedSkills.filter((s) => s.status === "completed").length;
    const progress = Math.round((completedSkills / updatedSkills.length) * 100);

    await ctx.db.patch(roadmap._id, {
      skills: updatedSkills,
      progress,
    });
  },
});
