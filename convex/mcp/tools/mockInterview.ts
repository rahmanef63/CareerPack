import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `mockInterview` domain — practice interview sessions.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and every
 * `internal.mcp.data.mockInterview.*` function re-checks it against the row.
 *
 * There is deliberately NO question-generation tool. The app generates
 * questions with `api.ai.actions.generateInterviewQuestions` because a
 * browser has no model of its own; the caller here IS a model, and a better
 * one than the gpt-4.1-nano behind that action. So the client writes the
 * questions and grades the answers, and these tools only persist the session
 * — which means running a whole interview over MCP costs the shared AI budget
 * nothing and cannot be rate-limited out from under the user mid-session.
 */

function requireArg(args: Record<string, unknown>, key: string): string {
  const raw = args[key];
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Parameter ${key} wajib diisi.`);
  }
  return raw;
}

function optionalArg(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const raw = args[key];
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function requireNumber(args: Record<string, unknown>, key: string): number {
  const raw = args[key];
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new Error(`Parameter ${key} harus berupa angka.`);
  }
  return raw;
}

function optionalNumber(
  args: Record<string, unknown>,
  key: string,
): number | undefined {
  const raw = args[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

/** The four the app's question bank tags with, plus its "general" fallback
 *  (frontend/slices/mock-interview/constants/categories.ts). Listed in the
 *  schema so the model picks a value the dashboard has a label for. */
const INTERVIEW_TYPES = [
  "behavioral",
  "technical",
  "situational",
  "company-specific",
  "general",
];

export const mockInterviewTools: ToolDef[] = [
  {
    name: "mock_interview_list",
    description:
      "List the user's mock interview sessions, newest first: role, type, difficulty, how many questions were answered, the overall score, and when the session started and finished. USE THIS FIRST for any question about interview practice ('how am I doing', 'what did I score last time') and to get an interview_id for the other mock_interview_* tools. Returns a summary only — call mock_interview_get for the questions and answers of one session.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "How many sessions to return. Default 20, max 100.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      title: "List interview sessions",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runQuery(internal.mcp.data.mockInterview.listInterviews, {
        userId,
        limit: optionalNumber(args, "limit"),
      }),
  },

  {
    name: "mock_interview_get",
    description:
      "Read one practice session in full: every question with the answer the user gave, the feedback it got and its score, plus the closing feedback. Use it before commenting on how someone answered, so the critique is about what they actually said. Each question carries a `number` — that is what mock_interview_answer takes. Returns null if no session with that id belongs to the user.",
    inputSchema: {
      type: "object",
      properties: {
        interview_id: {
          type: "string",
          description: "Id from mock_interview_list.",
        },
      },
      required: ["interview_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Get interview session",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runQuery(internal.mcp.data.mockInterview.getInterview, {
        userId,
        interviewId: requireArg(args, "interview_id") as Id<"mockInterviews">,
      }),
  },

  {
    name: "mock_interview_start",
    description:
      "Open a practice session with the questions YOU wrote, then ask them one at a time in the conversation. Call this before asking the first question, not after the interview — the session is saved as you go, so a chat that ends early still leaves the user their answers. Write the questions in the language the user is speaking (usually Indonesian) and tailor them to the role. Returns interview_id and question_count; questions are then addressed by position, 1..question_count. Do not use this to record a session that already happened elsewhere.",
    inputSchema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          description:
            "The position being practised for, e.g. 'Backend Engineer'. Max 100 characters.",
        },
        type: {
          type: "string",
          enum: INTERVIEW_TYPES,
          description: "Which kind of questions this session is made of.",
        },
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "hard"],
          description: "Question difficulty.",
        },
        questions: {
          type: "array",
          description: "1-50 questions, asked in this order.",
          items: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "The question text. Max 1000 characters.",
              },
              category: {
                type: "string",
                description:
                  "Short label for what this one probes, e.g. 'System Design'. Max 50 characters.",
              },
            },
            required: ["question", "category"],
            additionalProperties: false,
          },
        },
      },
      required: ["role", "type", "difficulty", "questions"],
      additionalProperties: false,
    },
    annotations: {
      title: "Start interview session",
      readOnlyHint: false,
      destructiveHint: false,
      // Calling it twice opens two sessions — the user would find a phantom
      // empty interview in their dashboard, so hosts should not auto-retry.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const questions = args.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Parameter questions wajib diisi.");
      }
      return await ctx.runMutation(
        internal.mcp.data.mockInterview.createInterview,
        {
          userId,
          role: requireArg(args, "role"),
          type: requireArg(args, "type"),
          difficulty: requireArg(args, "difficulty"),
          questions: questions.map((q, i) => {
            const row = q as Record<string, unknown>;
            if (typeof row?.question !== "string" || typeof row?.category !== "string") {
              throw new Error(
                `Pertanyaan ke-${i + 1} harus punya question dan category.`,
              );
            }
            return { question: row.question, category: row.category };
          }),
        },
      );
    },
  },

  {
    name: "mock_interview_answer",
    description:
      "Save the user's answer to one question of an open session, together with your critique of it. Call this right after they answer, before you ask the next question — that way the feedback is on record even if the conversation stops. question_number is the 1-based position from mock_interview_start or mock_interview_get. score is 0-100 for THIS answer (the app shows it per question); omit it if you are not scoring. Calling it again for the same number overwrites that answer.",
    inputSchema: {
      type: "object",
      properties: {
        interview_id: {
          type: "string",
          description: "Id from mock_interview_start or mock_interview_list.",
        },
        question_number: {
          type: "number",
          description: "1-based position of the question being answered.",
        },
        answer: {
          type: "string",
          description: "What the user said, in their own words. Max 5000 characters.",
        },
        feedback: {
          type: "string",
          description:
            "Your critique of this answer — what worked, what to fix. Same language as the answer. Max 5000 characters.",
        },
        score: {
          type: "number",
          description: "0-100 for this answer. Omit if not scoring.",
        },
      },
      required: ["interview_id", "question_number", "answer"],
      additionalProperties: false,
    },
    annotations: {
      title: "Record interview answer",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.mcp.data.mockInterview.recordAnswer, {
        userId,
        interviewId: requireArg(args, "interview_id") as Id<"mockInterviews">,
        questionNumber: requireNumber(args, "question_number"),
        answer: requireArg(args, "answer"),
        feedback: optionalArg(args, "feedback"),
        score: optionalNumber(args, "score"),
      }),
  },

  {
    name: "mock_interview_finish",
    description:
      "Close a session with an overall 0-100 score and a summary of how the user did. Call it once, after the last answer is saved — this is what makes the session count as completed in the dashboard's average-score and practice-time stats. The elapsed time is measured from when the session was opened, so do not try to supply it. Write the summary in the language the interview was held in.",
    inputSchema: {
      type: "object",
      properties: {
        interview_id: {
          type: "string",
          description: "Id from mock_interview_start or mock_interview_list.",
        },
        overall_score: {
          type: "number",
          description: "0-100 for the session as a whole.",
        },
        feedback: {
          type: "string",
          description:
            "Closing summary: strengths, weak spots, what to practise next. Max 5000 characters.",
        },
      },
      required: ["interview_id", "overall_score", "feedback"],
      additionalProperties: false,
    },
    annotations: {
      title: "Finish interview session",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.mcp.data.mockInterview.completeInterview, {
        userId,
        interviewId: requireArg(args, "interview_id") as Id<"mockInterviews">,
        overallScore: requireNumber(args, "overall_score"),
        feedback: requireArg(args, "feedback"),
      }),
  },

  {
    name: "mock_interview_delete",
    description:
      "Permanently delete one practice session and every answer in it. There is no undo and no export first. Only call it when the user asked for that specific session to be removed; to hide a bad result from an average, tell them the score instead.",
    inputSchema: {
      type: "object",
      properties: {
        interview_id: {
          type: "string",
          description: "Id from mock_interview_list.",
        },
      },
      required: ["interview_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Delete interview session",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.mcp.data.mockInterview.deleteInterview, {
        userId,
        interviewId: requireArg(args, "interview_id") as Id<"mockInterviews">,
      }),
  },
];
