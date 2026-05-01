import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { renderWelcomeEmail, sendEmail } from "./_shared/email";

/**
 * Parse `ADMIN_BOOTSTRAP_EMAILS` — comma-separated list of emails that
 * auto-promote to role=admin on their next `seedForCurrentUser` call
 * (which runs on every login via `useAuth.login` → `seedForCurrentUser`).
 * Lowercased + trimmed. Empty string = no admins seeded.
 */
function adminBootstrapEmails(): Set<string> {
  const raw = process.env.ADMIN_BOOTSTRAP_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0),
  );
}

export const seedForCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Auth required. Earlier versions had an unauth fallback that picked
    // the "first user in the DB" if no email matched — that path was a
    // public oracle + plant-into-victim-account exploit. Removed.
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tidak terautentikasi");

    const now = Date.now();

    const authUser = await ctx.db.get(userId);
    const authEmail = (authUser as { email?: string } | null)?.email?.toLowerCase() ?? "";
    const shouldBeAdmin = authEmail.length > 0 && adminBootstrapEmails().has(authEmail);

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingProfile) {
      await ctx.db.insert("userProfiles", {
        userId,
        fullName: "Demo User",
        phone: "081234567890",
        location: "Jakarta, Indonesia",
        targetRole: "Frontend Developer",
        experienceLevel: "junior",
        bio: "Actively preparing for tech interviews and job applications.",
        skills: ["React", "TypeScript", "Tailwind CSS"],
        interests: ["Web Development", "Product Design"],
        ...(shouldBeAdmin ? { role: "admin" as const } : {}),
      });

      // First-time signup with a real email — fire welcome email out-of-band.
      // Anonymous accounts have no email; skip those silently. Failures land
      // in the backend log and never block the seed.
      if (authEmail.length > 0) {
        await ctx.scheduler.runAfter(0, internal.seed.deliverWelcomeEmail, {
          to: authEmail,
          fullName: "",
        });
      }
    } else if (shouldBeAdmin && existingProfile.role !== "admin") {
      // Existing user whose email was just added to the env list — promote
      // on next login. Does not demote anyone; role removal is manual via
      // api.admin.updateUserRole.
      await ctx.db.patch(existingProfile._id, { role: "admin" });
    }

    const existingCv = await ctx.db
      .query("cvs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingCv) {
      await ctx.db.insert("cvs", {
        userId,
        title: "CV - Frontend Developer",
        template: "modern",
        personalInfo: {
          fullName: "Demo User",
          email: "demo@careerpack.id",
          phone: "081234567890",
          location: "Jakarta, Indonesia",
          linkedin: "https://linkedin.com/in/demo-user",
          portfolio: "https://demo-portfolio.dev",
          summary:
            "Frontend developer focused on React ecosystem with strong attention to clean UI and usability.",
        },
        experience: [
          {
            id: "exp-1",
            company: "PT Startup Nusantara",
            position: "Frontend Intern",
            startDate: "2024-01",
            endDate: "2024-06",
            current: false,
            description: "Built reusable UI components and improved page performance.",
            achievements: [
              "Implemented shared component library",
              "Reduced dashboard load time by 25%",
            ],
          },
        ],
        education: [
          {
            id: "edu-1",
            institution: "Universitas Indonesia",
            degree: "S1",
            field: "Ilmu Komputer",
            startDate: "2020-08",
            endDate: "2024-07",
            gpa: "3.72",
          },
        ],
        skills: [
          { id: "s-1", name: "React", category: "Frontend", proficiency: 85 },
          { id: "s-2", name: "TypeScript", category: "Frontend", proficiency: 80 },
          { id: "s-3", name: "Tailwind CSS", category: "UI", proficiency: 78 },
        ],
        certifications: [
          {
            id: "cert-1",
            name: "Frontend Web Developer",
            issuer: "Dicoding",
            date: "2024-05",
          },
        ],
        languages: [
          { language: "Indonesia", proficiency: "Native" },
          { language: "English", proficiency: "Professional" },
        ],
        projects: [
          {
            id: "p-1",
            name: "Career Tracker App",
            description: "App to track job applications and interview progress.",
            technologies: ["React", "TypeScript", "Convex"],
            link: "https://github.com/example/career-tracker",
          },
        ],
        isDefault: true,
      });
    }

    const existingApplications = await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (existingApplications.length === 0) {
      await ctx.db.insert("jobApplications", {
        userId,
        company: "Tokopedia",
        position: "Frontend Engineer",
        location: "Jakarta",
        salary: "12.000.000 - 16.000.000",
        status: "interview",
        appliedDate: now - 7 * 24 * 60 * 60 * 1000,
        source: "LinkedIn",
        notes: "Second interview scheduled.",
        interviewDates: [
          { type: "HR Screening", date: now - 2 * 24 * 60 * 60 * 1000, notes: "Passed" },
        ],
        documents: ["CV", "Portfolio", "Cover Letter"],
      });
    }

    const existingChecklist = await ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingChecklist) {
      await ctx.db.insert("documentChecklists", {
        userId,
        type: "job-application",
        country: "Indonesia",
        documents: [
          {
            id: "doc-1",
            name: "CV ATS Friendly",
            category: "mandatory",
            required: true,
            completed: true,
            notes: "Updated this week",
          },
          {
            id: "doc-2",
            name: "Portfolio",
            category: "mandatory",
            required: true,
            completed: false,
            notes: "Finalize 2 case studies",
          },
        ],
        progress: 50,
      });
    }

    const existingRoadmap = await ctx.db
      .query("skillRoadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingRoadmap) {
      await ctx.db.insert("skillRoadmaps", {
        userId,
        careerPath: "Frontend Engineer",
        skills: [
          {
            id: "rm-1",
            name: "React Performance Optimization",
            category: "frontend",
            level: "intermediate",
            priority: 1,
            estimatedHours: 20,
            prerequisites: ["React"],
            status: "in_progress",
            resources: [
              {
                type: "course",
                title: "React Performance Deep Dive",
                url: "https://example.com/react-performance",
                completed: false,
              },
            ],
          },
        ],
        progress: 35,
      });
    }

    const existingGoal = await ctx.db
      .query("careerGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingGoal) {
      await ctx.db.insert("careerGoals", {
        userId,
        title: "Get first frontend full-time role",
        description: "Secure an offer within 3 months.",
        category: "career",
        targetDate: now + 90 * 24 * 60 * 60 * 1000,
        status: "active",
        progress: 40,
        milestones: [
          { id: "m-1", title: "Polish CV", completed: true, completedAt: now - 5 * 24 * 60 * 60 * 1000 },
          { id: "m-2", title: "Apply to 30 jobs", completed: false },
        ],
      });
    }

    return { ok: true };
  },
});

/**
 * Welcome email — scheduled by the first-signup branch in
 * `seedForCurrentUser`. Resolves the dashboard URL from `APP_URL` env
 * (set in production) and falls back to a sensible default for dev.
 */
export const deliverWelcomeEmail = internalAction({
  args: { to: v.string(), fullName: v.string() },
  handler: async (_ctx, args) => {
    const baseUrl = (process.env.APP_URL ?? "https://careerpack.local").replace(/\/$/, "");
    const dashboardUrl = `${baseUrl}/dashboard`;
    const { subject, html, text } = renderWelcomeEmail(args.fullName, dashboardUrl);
    const result = await sendEmail({ to: args.to, subject, html, text, tag: "welcome" });
    if (!result.ok) {
      console.error(`[welcome] email delivery failed reason=${result.reason} to=${args.to}`);
    }
    return result;
  },
});
