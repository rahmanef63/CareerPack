import { internalQuery, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import type { Doc } from "../../_generated/dataModel";
import { enforceRateLimit } from "../../_shared/rateLimit";
import { assertShortText } from "../../_shared/validate";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "./limits";

/**
 * Data layer for convex/mcp/tools/mockInterview.ts. Same rules as
 * convex/mcp/data/cv.ts — internal only, `userId` is an argument, and it is
 * re-checked against every document.
 *
 * Questions are addressed by 1-BASED POSITION, never by their stored `id`:
 * sessions started in the web app carry ids the question bank chose
 * (`beh-3`, a uuid, whatever the AI returned), so a model that has only seen
 * a session listing cannot produce one, while the position is right there in
 * the output it just read.
 */

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const MAX_QUESTIONS = 50;
/** Matches mockInterview/mutations.ts — a "session" longer than 8h is a bug. */
const MAX_DURATION_S = 60 * 60 * 8;

function isAnswered(q: { userAnswer?: string }): boolean {
  return typeof q.userAnswer === "string" && q.userAnswer.trim().length > 0;
}

function summarise(s: Doc<"mockInterviews">) {
  return {
    interview_id: s._id,
    type: s.type,
    role: s.role,
    difficulty: s.difficulty,
    question_count: s.questions.length,
    answered_count: s.questions.filter(isAnswered).length,
    overall_score: s.overallScore ?? null,
    started_at: new Date(s.startedAt).toISOString(),
    completed_at: s.completedAt ? new Date(s.completedAt).toISOString() : null,
  };
}

function assertScore(score: number | undefined, field: string): number | undefined {
  if (score === undefined) return undefined;
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error(`${field} harus 0-100`);
  }
  return Math.round(score);
}

/**
 * Capped rather than paginated: the app's own list caps at 200 for the same
 * reason (each row carries its whole questions[] with answers), and a model
 * asked "how am I doing" only ever reads the recent end.
 */
export const listInterviews = internalQuery({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    const rows = await ctx.db
      .query("mockInterviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    return { items: rows.map(summarise), total: rows.length };
  },
});

export const getInterview = internalQuery({
  args: { userId: v.id("users"), interviewId: v.id("mockInterviews") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.interviewId);
    if (!s || s.userId !== args.userId) return null;
    return {
      ...summarise(s),
      feedback: s.feedback ?? null,
      duration_seconds: s.duration ?? null,
      questions: s.questions.map((q, i) => ({
        number: i + 1,
        question: q.question,
        category: q.category,
        answer: q.userAnswer ?? null,
        feedback: q.feedback ?? null,
        score: q.score ?? null,
      })),
    };
  },
});

export const createInterview = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    role: v.string(),
    difficulty: v.string(),
    questions: v.array(v.object({ question: v.string(), category: v.string() })),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    if (!DIFFICULTIES.has(args.difficulty)) {
      throw new Error("Difficulty harus easy, medium, atau hard");
    }
    if (args.questions.length === 0 || args.questions.length > MAX_QUESTIONS) {
      throw new Error(`Pertanyaan 1-${MAX_QUESTIONS}`);
    }

    const interviewId = await ctx.db.insert("mockInterviews", {
      userId: args.userId,
      type: assertShortText(args.type, 50, "Tipe"),
      role: assertShortText(args.role, 100, "Role"),
      difficulty: args.difficulty,
      // Positional ids so `questionNumber` addresses the same slot the tool
      // output showed. The app's own ids come from its question bank; only
      // rows created here get this form and nothing reads it by value.
      questions: args.questions.map((q, i) => ({
        id: String(i + 1),
        question: assertShortText(q.question, 1000, "Pertanyaan"),
        category: assertShortText(q.category, 50, "Kategori"),
        userAnswer: undefined,
        feedback: undefined,
        score: undefined,
      })),
      overallScore: undefined,
      feedback: undefined,
      completedAt: undefined,
      duration: undefined,
      startedAt: Date.now(),
    });
    return { interview_id: interviewId, question_count: args.questions.length };
  },
});

export const recordAnswer = internalMutation({
  args: {
    userId: v.id("users"),
    interviewId: v.id("mockInterviews"),
    questionNumber: v.number(),
    answer: v.string(),
    feedback: v.optional(v.string()),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const s = await ctx.db.get(args.interviewId);
    if (!s || s.userId !== args.userId) {
      throw new Error("Sesi wawancara tidak ditemukan");
    }

    const idx = args.questionNumber - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= s.questions.length) {
      throw new Error(`Nomor pertanyaan harus 1-${s.questions.length}`);
    }

    const questions = s.questions.slice();
    questions[idx] = {
      ...questions[idx],
      userAnswer: assertShortText(args.answer, 5000, "Jawaban"),
      feedback:
        args.feedback === undefined
          ? questions[idx].feedback
          : assertShortText(args.feedback, 5000, "Feedback"),
      score: assertScore(args.score, "Skor") ?? questions[idx].score,
      answeredAt: Date.now(),
    };
    await ctx.db.patch(args.interviewId, { questions });
    return { interview_id: args.interviewId, question_number: args.questionNumber };
  },
});

export const completeInterview = internalMutation({
  args: {
    userId: v.id("users"),
    interviewId: v.id("mockInterviews"),
    overallScore: v.number(),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const s = await ctx.db.get(args.interviewId);
    if (!s || s.userId !== args.userId) {
      throw new Error("Sesi wawancara tidak ditemukan");
    }

    // Derived, not an argument: the caller is a chat client with no idea when
    // the session row was opened, and asking it to guess would put fiction
    // into the practice-time stat the dashboard shows.
    const duration = Math.min(
      Math.max(Math.round((Date.now() - s.startedAt) / 1000), 0),
      MAX_DURATION_S,
    );

    await ctx.db.patch(args.interviewId, {
      overallScore: assertScore(args.overallScore, "Skor")!,
      feedback: assertShortText(args.feedback, 5000, "Feedback"),
      completedAt: Date.now(),
      duration,
    });
    return { interview_id: args.interviewId, duration_seconds: duration };
  },
});

export const deleteInterview = internalMutation({
  args: { userId: v.id("users"), interviewId: v.id("mockInterviews") },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const s = await ctx.db.get(args.interviewId);
    if (!s || s.userId !== args.userId) {
      throw new Error("Sesi wawancara tidak ditemukan");
    }
    await ctx.db.delete(args.interviewId);
    return { deleted: true };
  },
});
