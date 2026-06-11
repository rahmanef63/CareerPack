import { v, ConvexError } from "convex/values";
import { action, type ActionCtx } from "../../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { sanitizeAIInput, wrapUserInput } from "../../_shared/sanitize";
import { resolveAI as resolveAIShared } from "../../_shared/aiResolve";
import { fetchWithTimeout, FETCH_TIMEOUTS } from "../../_shared/fetchWithTimeout";
import { recordError } from "../../_shared/errorSink";
import { withIdempotency } from "../../_shared/idempotency";
import { internal } from "../../_generated/api";
import { ALLOWED_ACTION_TYPES, validatePlan } from "./lib";

async function resolveAI(ctx: ActionCtx, fallbackModel: string) {
  const cfg = await resolveAIShared(ctx, fallbackModel);
  if (!cfg) {
    throw new ConvexError("AI gateway belum dikonfigurasi.");
  }
  return cfg;
}

/**
 * Compile a free-form Indonesian/English intent into a typed action
 * plan. The LLM is bound to a controlled action vocabulary
 * (ALLOWED_ACTION_TYPES) and the validator strips anything outside
 * the enum, so the planner physically cannot emit arbitrary side
 * effects.
 *
 * Returns the validated plan ready to be persisted as a careerQuest.
 */
export const compile = action({
  args: {
    intent: v.string(),
    targetNodeSlug: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Sesi Anda berakhir. Silakan login.");
    return withIdempotency(ctx, userId, args.idempotencyKey, async () => {
      await ctx.runMutation(internal.ai.mutations._checkAIQuota, { userId });

      const intent = sanitizeAIInput(args.intent, 600).trim();
      if (intent.length < 8) {
        throw new ConvexError("Niat terlalu pendek (min 8 karakter).");
      }

      const cfg = await resolveAI(ctx, "gpt-4.1-mini");

      const systemPrompt = `You are a career-plan compiler. Given the user's intent (Indonesian / English) and an optional target career-node slug, emit a JSON plan.

Output WAJIB: a single JSON object with these exact keys:
{
  "title": "<6-10 word title summarising the goal>",
  "etaMonths": <integer 1..60>,
  "actions": [
    { "type": "<one of ${ALLOWED_ACTION_TYPES.join(" | ")}>", "label": "<imperative step, Indonesian>", "payload": <optional object> }
  ]
}

Rules:
- Generate 5-10 actions, ordered logically (skill prereqs before later steps).
- Every action.type MUST come from the enum above. Do NOT invent new types.
- action.label is what the user sees on a checklist — clear, imperative, ≤ 20 words.
- payload may carry a skill name (for study_skill), category (for subscribe_listings), frequency (for set_calendar_block), country (for prepare_documents), etc. Keep it simple JSON.
- NO preamble, NO markdown, NO code fences. JSON only.`;

      const userPayload = JSON.stringify({
        intent,
        targetNodeSlug: args.targetNodeSlug ?? null,
      });

      const response = await fetchWithTimeout(`${cfg.baseUrl}/chat/completions`, {
        timeoutMs: FETCH_TIMEOUTS.aiChat,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: wrapUserInput("plan_intent", userPayload) },
          ],
          temperature: 0.4,
          max_tokens: 900,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        await recordError(ctx, {
          source: "engine.plan.compile",
          message: `gateway ${response.status} ${detail.slice(0, 300)}`,
        });
        await ctx.runMutation(internal.ai.mutations._refundAIQuota, { userId });
        throw new ConvexError(
          response.status === 429
            ? "Layanan AI sedang sibuk. Coba lagi nanti."
            : "Gagal menghubungi layanan AI.",
        );
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content ?? "{}";
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // 200 but unusable body — don't charge the user for a non-result.
        await ctx.runMutation(internal.ai.mutations._refundAIQuota, { userId });
        throw new ConvexError("AI mengembalikan JSON tidak valid.");
      }

      const plan = validatePlan(parsed as Parameters<typeof validatePlan>[0]);
      if (!plan) {
        await ctx.runMutation(internal.ai.mutations._refundAIQuota, { userId });
        throw new ConvexError(
          "AI tidak menghasilkan plan yang valid. Coba pertajam intent kamu.",
        );
      }

      return plan;
    });
  },
});
