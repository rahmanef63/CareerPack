import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser } from "./_lib/auth";
import type { Doc } from "./_generated/dataModel";

const MAX_LIST = 50;

type JobListing = Doc<"jobListings">;
type UserProfile = Doc<"userProfiles">;

function scoreJob(profile: UserProfile | null, job: JobListing): number {
  if (!profile) return 0;

  let score = 0;
  const max = 100;

  // Role match: targetRole vs title (weight 40).
  const role = profile.targetRole?.toLowerCase() ?? "";
  const title = job.title.toLowerCase();
  if (role && title.includes(role)) score += 40;
  else if (role && role.split(" ").some((w) => w && title.includes(w)))
    score += 20;

  // Skill overlap: 5 points per matched skill, cap 40.
  const userSkills = (profile.skills ?? []).map((s) => s.toLowerCase());
  const skillMatches = job.requiredSkills.filter((s) =>
    userSkills.includes(s.toLowerCase()),
  ).length;
  score += Math.min(skillMatches * 10, 40);

  // Experience level nudge (weight 10).
  const userLevel = profile.experienceLevel?.toLowerCase() ?? "";
  if (userLevel && job.seniority.toLowerCase().includes(userLevel))
    score += 10;

  // Location: local profile → bonus for same city / remote (weight 10).
  const userLoc = profile.location?.toLowerCase() ?? "";
  if (job.workMode === "remote") score += 10;
  else if (userLoc && job.location.toLowerCase().includes(userLoc))
    score += 10;

  return Math.min(score, max);
}

export const listJobs = query({
  args: {
    workMode: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, MAX_LIST);
    let cursor = ctx.db.query("jobListings").withIndex("by_posted").order("desc");
    if (args.workMode && args.workMode !== "all") {
      cursor = ctx.db
        .query("jobListings")
        .withIndex("by_workMode", (q) =>
          q.eq("workMode", args.workMode as string),
        )
        .order("desc");
    }
    return await cursor.take(limit);
  },
});

export const getMatches = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const jobs = await ctx.db.query("jobListings").collect();
    const scored = jobs
      .map((job) => ({ job, score: scoreJob(profile, job) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, args.limit ?? 6);

    return scored.filter((s) => s.score > 0);
  },
});

/**
 * Seed helper — populate demo jobs for the current user. Idempotent per
 * (title+company) key. Only callable by authenticated users. No userId
 * stored on jobListings — rows are public catalog; seed just avoids
 * duplicates if called twice.
 */
export const seedDemoJobs = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);

    const existing = await ctx.db.query("jobListings").collect();
    if (existing.length >= SEED_JOBS.length) return { seeded: 0 };

    const existingKeys = new Set(
      existing.map((j) => `${j.title}|${j.company}`),
    );
    let seeded = 0;
    for (const j of SEED_JOBS) {
      const key = `${j.title}|${j.company}`;
      if (existingKeys.has(key)) continue;
      await ctx.db.insert("jobListings", j);
      seeded++;
    }
    return { seeded };
  },
});

// ---------- seed data ----------

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const SEED_JOBS: ReadonlyArray<Omit<JobListing, "_id" | "_creationTime">> = [
  {
    title: "Senior Frontend Engineer",
    company: "Tokopedia",
    location: "Jakarta",
    workMode: "hybrid",
    employmentType: "full-time",
    seniority: "senior",
    salaryMin: 35_000_000,
    salaryMax: 55_000_000,
    currency: "IDR",
    description:
      "Bangun antarmuka web untuk 150+ juta pengguna Tokopedia. Fokus pada performa, aksesibilitas, dan scalability. Kolaborasi erat dengan tim desain dan backend.",
    requiredSkills: ["React", "TypeScript", "Next.js", "Performance"],
    postedAt: now - 1 * day,
    applyUrl: "https://tokopedia.com/careers",
    companyLogo: "🛍️",
  },
  {
    title: "Product Designer",
    company: "Gojek",
    location: "Jakarta",
    workMode: "onsite",
    employmentType: "full-time",
    seniority: "mid-level",
    salaryMin: 18_000_000,
    salaryMax: 30_000_000,
    currency: "IDR",
    description:
      "Desain pengalaman multi-produk (Ride, Food, Pay) untuk pengguna Asia Tenggara. Portfolio case study wajib ada.",
    requiredSkills: ["Figma", "User Research", "Design Systems", "Prototyping"],
    postedAt: now - 2 * day,
    applyUrl: "https://gojek.com/careers",
    companyLogo: "🛵",
  },
  {
    title: "Backend Engineer",
    company: "Shopee",
    location: "Remote",
    workMode: "remote",
    employmentType: "full-time",
    seniority: "mid-level",
    salaryMin: 22_000_000,
    salaryMax: 40_000_000,
    currency: "IDR",
    description:
      "Skalakan layanan marketplace yang meng-handle ribuan order per detik. Microservices, observability, cost engineering.",
    requiredSkills: ["Go", "PostgreSQL", "Kafka", "Kubernetes"],
    postedAt: now - 3 * day,
    applyUrl: "https://shopee.com/careers",
    companyLogo: "🧡",
  },
  {
    title: "Data Analyst",
    company: "Traveloka",
    location: "Jakarta",
    workMode: "hybrid",
    employmentType: "full-time",
    seniority: "entry-level",
    salaryMin: 10_000_000,
    salaryMax: 18_000_000,
    currency: "IDR",
    description:
      "Bantu tim produk memahami perilaku pengguna travel. SQL, dashboard, A/B testing.",
    requiredSkills: ["SQL", "Python", "Looker", "Statistics"],
    postedAt: now - 4 * day,
    applyUrl: "https://traveloka.com/careers",
    companyLogo: "✈️",
  },
  {
    title: "Full-stack Engineer (React + Node)",
    company: "Startup.id",
    location: "Bandung",
    workMode: "remote",
    employmentType: "contract",
    seniority: "mid-level",
    salaryMin: 15_000_000,
    salaryMax: 28_000_000,
    currency: "IDR",
    description:
      "Startup tahap awal butuh engineer serba-bisa. Ship feature end-to-end dari DB sampai UI.",
    requiredSkills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    postedAt: now - 5 * day,
    applyUrl: "https://startup.id/careers",
    companyLogo: "🚀",
  },
  {
    title: "Machine Learning Engineer",
    company: "Bukalapak",
    location: "Jakarta",
    workMode: "hybrid",
    employmentType: "full-time",
    seniority: "senior",
    salaryMin: 40_000_000,
    salaryMax: 70_000_000,
    currency: "IDR",
    description:
      "Bangun sistem rekomendasi produk + anti-fraud menggunakan deep learning. Latar belakang riset atau industri besar sangat dihargai.",
    requiredSkills: ["Python", "PyTorch", "MLOps", "SQL"],
    postedAt: now - 6 * day,
    applyUrl: "https://bukalapak.com/careers",
    companyLogo: "📦",
  },
  {
    title: "DevOps Engineer",
    company: "Blibli",
    location: "Tangerang",
    workMode: "onsite",
    employmentType: "full-time",
    seniority: "mid-level",
    salaryMin: 20_000_000,
    salaryMax: 35_000_000,
    currency: "IDR",
    description:
      "Kelola infrastruktur cloud untuk platform e-commerce. CI/CD, observability, security hardening.",
    requiredSkills: ["Kubernetes", "Terraform", "AWS", "Linux"],
    postedAt: now - 7 * day,
    applyUrl: "https://blibli.com/careers",
    companyLogo: "🏷️",
  },
  {
    title: "Mobile Engineer (Android)",
    company: "DANA",
    location: "Jakarta",
    workMode: "hybrid",
    employmentType: "full-time",
    seniority: "mid-level",
    salaryMin: 22_000_000,
    salaryMax: 38_000_000,
    currency: "IDR",
    description:
      "Kembangkan aplikasi dompet digital untuk jutaan pengguna. Kotlin, Jetpack Compose, performance matters.",
    requiredSkills: ["Kotlin", "Android", "Jetpack Compose", "Coroutines"],
    postedAt: now - 9 * day,
    applyUrl: "https://dana.id/careers",
    companyLogo: "💳",
  },
];
