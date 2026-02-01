import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generateCareerAdvice = action({
  args: {
    userContext: v.string(),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: `You are a professional career consultant with expertise in career development, job searching, and skill building. Provide personalized, actionable advice based on the user's context. Be encouraging but realistic. Focus on practical steps they can take.

User Context: ${args.userContext}`
          },
          {
            role: "user",
            content: args.question
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },
});

export const generateInterviewQuestions = action({
  args: {
    role: v.string(),
    type: v.string(),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: `Generate ${args.difficulty} level ${args.type} interview questions for a ${args.role} position. Return exactly 5 questions in JSON format with this structure:
            {
              "questions": [
                {
                  "id": "unique_id",
                  "question": "question text",
                  "category": "category name"
                }
              ]
            }`
          }
        ],
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    try {
      return JSON.parse(data.choices[0].message.content);
    } catch {
      // Fallback if JSON parsing fails
      return {
        questions: [
          { id: "1", question: "Tell me about yourself and your background.", category: "General" },
          { id: "2", question: "Why are you interested in this role?", category: "Motivation" },
          { id: "3", question: "What are your greatest strengths?", category: "Skills" },
          { id: "4", question: "Describe a challenging project you worked on.", category: "Experience" },
          { id: "5", question: "Where do you see yourself in 5 years?", category: "Goals" }
        ]
      };
    }
  },
});

export const evaluateInterviewAnswer = action({
  args: {
    question: v.string(),
    answer: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: `You are an experienced interviewer evaluating answers for a ${args.role} position. Provide constructive feedback and a score from 1-10. Return JSON format:
            {
              "score": number,
              "feedback": "detailed feedback with strengths and areas for improvement"
            }`
          },
          {
            role: "user",
            content: `Question: ${args.question}\nAnswer: ${args.answer}`
          }
        ],
        max_tokens: 300,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    try {
      return JSON.parse(data.choices[0].message.content);
    } catch {
      return {
        score: 7,
        feedback: "Your answer shows good understanding. Consider providing more specific examples and quantifiable results to strengthen your response."
      };
    }
  },
});
