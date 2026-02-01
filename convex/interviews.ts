import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserInterviews = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("mockInterviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const questionsWithAnswers = args.questions.map(q => ({
      ...q,
      userAnswer: undefined,
      feedback: undefined,
      score: undefined,
    }));

    return await ctx.db.insert("mockInterviews", {
      userId,
      type: args.type,
      role: args.role,
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const interview = await ctx.db.get(args.interviewId);
    if (!interview || interview.userId !== userId) {
      throw new Error("Interview not found or access denied");
    }

    const updatedQuestions = interview.questions.map(q => {
      if (q.id === args.questionId) {
        return {
          ...q,
          userAnswer: args.answer,
          feedback: args.feedback,
          score: args.score,
          answeredAt: Date.now(),
        };
      }
      return q;
    });

    await ctx.db.patch(args.interviewId, {
      questions: updatedQuestions,
    });
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const interview = await ctx.db.get(args.interviewId);
    if (!interview || interview.userId !== userId) {
      throw new Error("Interview not found or access denied");
    }

    await ctx.db.patch(args.interviewId, {
      overallScore: args.overallScore,
      feedback: args.feedback,
      completedAt: Date.now(),
      duration: args.duration,
    });
  },
});

export const getInterviewAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const interviews = await ctx.db
      .query("mockInterviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const completedInterviews = interviews.filter(i => i.completedAt);
    const totalSessions = interviews.length;
    const avgScore = completedInterviews.length > 0 
      ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.overallScore || 0), 0) / completedInterviews.length)
      : 0;
    const totalPracticeTime = Math.round(completedInterviews.reduce((acc, i) => acc + (i.duration || 0), 0) / 3600);

    const scoresByType = completedInterviews.reduce((acc, interview) => {
      if (!acc[interview.type]) {
        acc[interview.type] = [];
      }
      acc[interview.type].push(interview.overallScore || 0);
      return acc;
    }, {} as Record<string, number[]>);

    const improvementTrend = completedInterviews
      .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0))
      .slice(-10)
      .map(i => i.overallScore || 0);

    return {
      totalSessions,
      completedSessions: completedInterviews.length,
      avgScore,
      totalPracticeTime,
      scoresByType,
      improvementTrend,
      recentSessions: interviews.slice(0, 5),
    };
  },
});

export const deleteInterview = mutation({
  args: { interviewId: v.id("mockInterviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const interview = await ctx.db.get(args.interviewId);
    if (!interview || interview.userId !== userId) {
      throw new Error("Interview not found or access denied");
    }

    await ctx.db.delete(args.interviewId);
  },
});
