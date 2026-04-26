import { action, type ActionCtx } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { sanitizeAIInput, wrapUserInput } from "../_shared/sanitize";
import { optionalEnv } from "../_shared/env";
import { resolveProviderBaseUrl } from "../_shared/aiProviders";

/**
 * CV translation pipeline. Flattens every user-visible text field into
 * a keyed list, ships one prompt to the AI gateway, then re-inflates
 * the response back into a CVData-shaped object on the client.
 */

async function requireQuota(ctx: ActionCtx): Promise<void> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Sesi Anda berakhir. Silakan login ulang.");
  await ctx.runMutation(internal.cv.mutations._checkTranslateQuota, { userId });
}

interface ResolvedAI {
  baseUrl: string;
  apiKey: string;
  model: string;
}

async function resolveAI(ctx: ActionCtx, fallbackModel: string): Promise<ResolvedAI> {
  const userId = await getAuthUserId(ctx);
  if (userId) {
    const cfg = await ctx.runQuery(internal.ai.queries._getAISettingsForUser, { userId });
    if (cfg) {
      return {
        baseUrl: resolveProviderBaseUrl(cfg.provider, cfg.baseUrl ?? undefined),
        apiKey: cfg.apiKey,
        model: cfg.model,
      };
    }
  }
  const baseUrl = optionalEnv("CONVEX_OPENAI_BASE_URL");
  const apiKey = optionalEnv("CONVEX_OPENAI_API_KEY");
  if (!baseUrl || !apiKey) {
    throw new ConvexError(
      "Layanan terjemahan AI belum dikonfigurasi untuk akun ini. Atur API key di Setelan → AI, atau hubungi admin.",
    );
  }
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    model: fallbackModel,
  };
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ar: "Arabic (العربية)",
  zh: "Simplified Chinese (简体中文)",
  ja: "Japanese (日本語)",
  ko: "Korean (한국어)",
  de: "German (Deutsch)",
  nl: "Dutch (Nederlands)",
};

export const translate = action({
  args: {
    targetLang: v.string(),
    fields: v.array(v.object({
      key: v.string(),
      text: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    await requireQuota(ctx);

    const targetName = LANGUAGE_NAMES[args.targetLang];
    if (!targetName) throw new ConvexError(`Bahasa target tidak didukung: ${args.targetLang}`);

    const sanitized = args.fields
      .filter((f) => f.text.trim().length > 0)
      .map((f) => ({
        key: sanitizeAIInput(f.key, 60),
        text: sanitizeAIInput(f.text, 2000),
      }));

    if (sanitized.length === 0) {
      return { translations: {} as Record<string, string> };
    }

    const cfg = await resolveAI(ctx, "gpt-4.1-nano");

    const systemPrompt = `You are a professional CV translator. Translate every value in the input JSON object into ${targetName}. Preserve:
- tone and professionalism
- industry-specific jargon when no natural equivalent exists
- the original formatting (line breaks, bullet markers)
- the JSON keys exactly as provided
Do NOT translate: proper names, company names, product names, URLs, email addresses, phone numbers, dates.
Return ONLY a JSON object of the shape { "translations": { "<key>": "<translated text>" } }. No preamble, no markdown.`;

    const userPayload = {
      target_language: targetName,
      items: sanitized,
    };

    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: wrapUserInput("cv_fields", JSON.stringify(userPayload)),
          },
        ],
        temperature: 0.2,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[cv.translate] gateway ${response.status}`, detail.slice(0, 400));
      throw new ConvexError(
        response.status === 429
          ? "Layanan terjemahan sedang sibuk. Coba lagi beberapa saat."
          : "Gagal menghubungi layanan terjemahan. Coba lagi nanti.",
      );
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";

    let parsed: { translations?: Record<string, string> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ConvexError("Hasil terjemahan tidak berupa JSON valid. Coba lagi.");
    }

    const translations = parsed.translations ?? {};
    return { translations };
  },
});
