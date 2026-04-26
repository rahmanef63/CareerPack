import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";

const MAX_TYPE_LEN = 50;
const MAX_ROLE_LEN = 100;
const MAX_ID_LEN = 100;
const MAX_QUESTION_LEN = 1000;
const MAX_CATEGORY_LEN = 50;
const MAX_ANSWER_LEN = 5000;
const MAX_FEEDBACK_LEN = 5000;
const MAX_QUESTIONS = 50;
const MAX_DURATION_S = 60 * 60 * 8;

const DIFFICULTY_WHITELIST = new Set(["easy", "medium", "hard"]);

function trimLen(field: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error(`${field} 1-${max} karakter`);
  }
  return trimmed;
}

function optTrim(field: string, value: string | undefined, max: number): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${field} maksimal ${max} karakter`);
  return trimmed;
}

export const createMockInterview = mutation({
  args: {
    type: v.string(),
    role: v.string(),
    difficulty: v.string(),
    questions: v.array(v.object({
      id: v.string(),
      question: v.string(),
      category: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const type = trimLen("Tipe", args.type, MAX_TYPE_LEN);
    const role = trimLen("Role", args.role, MAX_ROLE_LEN);
    if (!DIFFICULTY_WHITELIST.has(args.difficulty)) {
      throw new Error("Difficulty tidak valid");
    }
    if (args.questions.length === 0 || args.questions.length > MAX_QUESTIONS) {
      throw new Error(`Pertanyaan 1-${MAX_QUESTIONS}`);
    }

    const questionsWithAnswers = args.questions.map((q) => ({
      id: trimLen("Question ID", q.id, MAX_ID_LEN),
      question: trimLen("Pertanyaan", q.question, MAX_QUESTION_LEN),
      category: trimLen("Kategori", q.category, MAX_CATEGORY_LEN),
      userAnswer: undefined,
      feedback: undefined,
      score: undefined,
    }));

    return await ctx.db.insert("mockInterviews", {
      userId,
      type,
      role,
      difficulty: args.difficulty,
      questions: questionsWithAnswers,
      overallScore: undefined,
      feedback: undefined,
      completedAt: undefined,
      duration: undefined,
      startedAt: Date.now(),
    });
  },
});

export const updateInterviewAnswer = mutation({
  args: {
    interviewId: v.id("mockInterviews"),
    questionId: v.string(),
    answer: v.string(),
    feedback: v.optional(v.string()),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const interview = await requireOwnedDoc(ctx, args.interviewId, "Interview");
    const questionId = trimLen("Question ID", args.questionId, MAX_ID_LEN);
    const answer = args.answer.trim().slice(0, MAX_ANSWER_LEN);
    const feedback = optTrim("Feedback", args.feedback, MAX_FEEDBACK_LEN);

    if (args.score !== undefined) {
      if (!Number.isFinite(args.score) || args.score < 0 || args.score > 100) {
        throw new Error("Score harus 0-100");
      }
    }

    let touched = false;
    const updatedQuestions = interview.questions.map((q) => {
      if (q.id === questionId) {
        touched = true;
        return {
          ...q,
          userAnswer: answer,
          feedback,
          score: args.score,
          answeredAt: Date.now(),
        };
      }
      return q;
    });

    if (!touched) throw new Error("Pertanyaan tidak ditemukan");

    await ctx.db.patch(args.interviewId, { questions: updatedQuestions });
  },
});

export const completeInterview = mutation({
  args: {
    interviewId: v.id("mockInterviews"),
    overallScore: v.number(),
    feedback: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.interviewId, "Interview");

    if (!Number.isFinite(args.overallScore) || args.overallScore < 0 || args.overallScore > 100) {
      throw new Error("Score harus 0-100");
    }
    if (!Number.isFinite(args.duration) || args.duration < 0 || args.duration > MAX_DURATION_S) {
      throw new Error("Durasi tidak valid");
    }

    const feedback = args.feedback.trim().slice(0, MAX_FEEDBACK_LEN);

    await ctx.db.patch(args.interviewId, {
      overallScore: args.overallScore,
      feedback,
      completedAt: Date.now(),
      duration: args.duration,
    });
  },
});

export const deleteInterview = mutation({
  args: { interviewId: v.id("mockInterviews") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.interviewId, "Interview");
    await ctx.db.delete(args.interviewId);
  },
});
