import { query } from "../_generated/server";
import { optionalUser } from "../_shared/auth";

export const getUserInterviews = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("mockInterviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getInterviewAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;

    const interviews = await ctx.db
      .query("mockInterviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const completedInterviews = interviews.filter((i) => i.completedAt);
    const totalSessions = interviews.length;
    const avgScore = completedInterviews.length > 0
      ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.overallScore || 0), 0) / completedInterviews.length)
      : 0;
    const totalPracticeTime = Math.round(completedInterviews.reduce((acc, i) => acc + (i.duration || 0), 0) / 60);

    const scoresByType = completedInterviews.reduce((acc, interview) => {
      if (!acc[interview.type]) acc[interview.type] = [];
      acc[interview.type].push(interview.overallScore || 0);
      return acc;
    }, {} as Record<string, number[]>);

    const improvementTrend = completedInterviews
      .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0))
      .slice(-10)
      .map((i) => i.overallScore || 0);

    return {
      totalSessions,
      completedSessions: completedInterviews.length,
      avgScore,
      totalPracticeTimeMinutes: totalPracticeTime,
      scoresByType,
      improvementTrend,
      recentSessions: interviews.slice(0, 5),
    };
  },
});
