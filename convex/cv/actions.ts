import { action, type ActionCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { v, ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { sanitizeAIInput, wrapUserInput } from "../_shared/sanitize";
import { resolveAI as resolveAIShared } from "../_shared/aiResolve";
import { recordError } from "../_shared/errorSink";
import { fetchWithTimeout, FETCH_TIMEOUTS } from "../_shared/fetchWithTimeout";
import { withIdempotency } from "../_shared/idempotency";
import { validateRewrite } from "../engine/atoms/validator";
import { api } from "../_generated/api";

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

async function resolveAI(ctx: ActionCtx, fallbackModel: string) {
  const cfg = await resolveAIShared(ctx, fallbackModel);
  if (!cfg) {
    throw new ConvexError(
      "Layanan terjemahan AI belum dikonfigurasi untuk akun ini. Atur API key di Setelan → AI, atau hubungi admin.",
    );
  }
  return cfg;
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
    /**
     * Optional client-minted UUID. Same key within 30m → cached
     * result returned, no quota deduct, no upstream call. Frontend
     * generates one per user-click; missing key = no-cache fallback.
     */
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Sesi Anda berakhir. Silakan login ulang.");

    return withIdempotency(ctx, userId, args.idempotencyKey, async () => {
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
        await recordError(ctx, {
          source: "cv.translate",
          message: `gateway ${response.status} ${detail.slice(0, 400)}`,
        });
        await ctx.runMutation(internal.ai.mutations._refundAIQuota, { userId });
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
    });
  },
});

// ---------------------------------------------------------------------------
// Cover Letter Generator — pairs a CV with a JD (raw text or jobListings
// row) and produces a personalised cover letter. Output is plain text
// the UI can edit / copy / download. Ephemeral — not persisted to DB.
// ---------------------------------------------------------------------------

const COVER_LETTER_LANG_NAMES: Record<string, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

const COVER_LETTER_TONE_HINTS: Record<string, string> = {
  formal: "professional, polished, and respectful",
  warm: "warm, personable, and confident — never cliché",
  enthusiastic: "energetic and enthusiastic without sounding desperate",
};

export const generateCoverLetter = action({
  args: {
    cvId: v.optional(v.id("cvs")),
    jobListingId: v.optional(v.id("jobListings")),
    rawJD: v.optional(v.string()),
    language: v.optional(v.string()),
    tone: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Sesi Anda berakhir. Silakan login ulang.");

    return withIdempotency(ctx, userId, args.idempotencyKey, () =>
      generateCoverLetterImpl(ctx, args, userId),
    );
  },
});

async function generateCoverLetterImpl(
  ctx: ActionCtx,
  args: {
    cvId?: Id<"cvs">;
    jobListingId?: Id<"jobListings">;
    rawJD?: string;
    language?: string;
    tone?: string;
  },
  userId: Id<"users">,
) {
    await ctx.runMutation(internal.ai.mutations._checkAIQuota, { userId });

    // CV — caller-supplied or pick newest.
    const cv = args.cvId
      ? await ctx.runQuery(internal.cv.queries._getOwnedCV, { cvId: args.cvId, userId })
      : await ctx.runQuery(internal.cv.queries._getLatestCV, { userId });
    if (!cv) throw new ConvexError("CV tidak ditemukan. Buat CV dulu sebelum generate cover letter.");

    // JD — listing or raw text.
    let jdText: string;
    let jobMeta = "";
    if (args.jobListingId) {
      const job = await ctx.runQuery(internal.matcher.queries._getListing, {
        listingId: args.jobListingId,
      });
      if (!job) throw new ConvexError("Lowongan tidak ditemukan.");
      jobMeta = `${job.title} · ${job.company}`;
      jdText = `${job.title} di ${job.company}\nLokasi: ${job.location}\nSkills dibutuhkan: ${job.requiredSkills.join(", ")}\n\n${job.description}`;
    } else if (args.rawJD && args.rawJD.trim().length >= 80) {
      jdText = args.rawJD;
    } else {
      throw new ConvexError("Sertakan jobListingId atau rawJD minimal 80 karakter.");
    }

    const cleanJD = sanitizeAIInput(jdText, 6000);
    const cvSummary = sanitizeAIInput(buildCVSummary(cv), 4000);

    const lang = args.language === "en" ? "en" : "id";
    const tone = args.tone && COVER_LETTER_TONE_HINTS[args.tone] ? args.tone : "warm";
    const langName = COVER_LETTER_LANG_NAMES[lang];
    const toneHint = COVER_LETTER_TONE_HINTS[tone];

    const cfg = await resolveAI(ctx, "gpt-4.1-mini");

    const systemPrompt = `You write tailored cover letters in ${langName}. Tone: ${toneHint}.

Output: plain text, 240-360 words, 3-4 paragraphs, no salutation header (start at "Halo" or "Dear hiring team"), no physical address, no date.

Structure:
1. Opening (1-2 sentences) — name + role applying for + one specific reason this candidate is a fit.
2. Why-fit (one paragraph) — pick 2-3 most relevant CV achievements that map to JD requirements. Use concrete numbers / impact when CV has them. Do NOT fabricate.
3. Why-this-company (one short paragraph) — show genuine interest grounded in something specific from the JD (mission, product area, working style).
4. Closing (1-2 sentences) — clear call-to-action for an interview, polite sign-off.

Hard rules:
- ONLY use facts from the candidate's CV. NEVER invent experience, dates, employers, certifications, or numbers.
- NO clichés ("I am writing to express my keen interest", "I am a hardworking team player", "synergy", "passionate about …").
- NO bullet points — flowing prose only.
- NO markdown headers, NO emojis.
- Match the language register of ${langName} — formal Bahasa for "id", professional but conversational for "en".`;

    const userPayload = `# TARGET JOB\n${cleanJD}\n\n# CANDIDATE CV\n${cvSummary}`;

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
          { role: "user", content: wrapUserInput("cover_letter_input", userPayload) },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      await recordError(ctx, {
        source: "cv.generateCoverLetter",
        message: `gateway ${response.status} ${detail.slice(0, 300)}`,
      });
      await ctx.runMutation(internal.ai.mutations._refundAIQuota, { userId });
      throw new ConvexError(
        response.status === 429
          ? "Layanan AI sedang sibuk. Coba lagi beberapa saat."
          : "Gagal menghubungi layanan AI. Coba lagi nanti.",
      );
    }

    const data = await response.json();
    const text = (data?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new ConvexError("AI tidak mengembalikan teks. Coba lagi.");

    return { text, jobMeta, language: lang, tone };
}

// ---------------------------------------------------------------------------
// Resume Tailor — given a JD, rewrite the user's CV achievements bullets
// to incorporate JD keywords without fabricating facts. Returns per-bullet
// suggestions the UI can apply selectively. Does NOT mutate the CV — the
// frontend calls cv.mutations.updateCV with the user's selected rewrites.
// ---------------------------------------------------------------------------

interface TailorBulletChange {
  index: number;
  before: string;
  after: string;
  changed: boolean;
}

interface TailorExperienceResult {
  experienceId: string;
  role: string;
  company: string;
  changes: TailorBulletChange[];
}

interface TailorResult {
  jobMeta: string;
  experiences: TailorExperienceResult[];
}

export const tailorCVForJob = action({
  args: {
    cvId: v.optional(v.id("cvs")),
    jobListingId: v.optional(v.id("jobListings")),
    rawJD: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<TailorResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Sesi Anda berakhir. Silakan login ulang.");

    return withIdempotency(ctx, userId, args.idempotencyKey, () =>
      tailorCVForJobImpl(ctx, args, userId),
    );
  },
});

async function tailorCVForJobImpl(
  ctx: ActionCtx,
  args: {
    cvId?: Id<"cvs">;
    jobListingId?: Id<"jobListings">;
    rawJD?: string;
  },
  userId: Id<"users">,
): Promise<TailorResult> {
    await ctx.runMutation(internal.ai.mutations._checkAIQuota, { userId });

    const cv: Doc<"cvs"> | null = args.cvId
      ? await ctx.runQuery(internal.cv.queries._getOwnedCV, { cvId: args.cvId, userId })
      : await ctx.runQuery(internal.cv.queries._getLatestCV, { userId });
    if (!cv) throw new ConvexError("CV tidak ditemukan.");

    let jdText: string;
    let jobMeta = "";
    if (args.jobListingId) {
      const job = await ctx.runQuery(internal.matcher.queries._getListing, {
        listingId: args.jobListingId,
      });
      if (!job) throw new ConvexError("Lowongan tidak ditemukan.");
      jobMeta = `${job.title} · ${job.company}`;
      jdText = `${job.title} di ${job.company}\nSkills dibutuhkan: ${job.requiredSkills.join(", ")}\n\n${job.description}`;
    } else if (args.rawJD && args.rawJD.trim().length >= 80) {
      jdText = args.rawJD;
    } else {
      throw new ConvexError("Sertakan jobListingId atau rawJD minimal 80 karakter.");
    }

    const cleanJD = sanitizeAIInput(jdText, 6000);

    // Build a compact per-experience payload.
    const expPayload = cv.experience.slice(0, 6).map((e) => ({
      id: e.id,
      role: e.position,
      company: e.company,
      description: e.description,
      achievements: e.achievements,
    }));

    if (expPayload.length === 0) {
      throw new ConvexError("CV belum punya pengalaman kerja untuk di-tailor.");
    }

    const cfg = await resolveAI(ctx, "gpt-4.1-mini");

    const systemPrompt = `You rewrite resume achievement bullets to maximise ATS keyword overlap with a target JD WITHOUT fabricating facts.

Input: a JSON object with the JD text and the candidate's existing experience entries (each with role, company, description, and an array of achievement bullets).

Output WAJIB: a single JSON object of shape:
{
  "experiences": [
    {
      "id": "<experience id from input>",
      "rewritten": ["bullet 1 rewritten", "bullet 2 rewritten", ...]
    }
  ]
}

Hard rules:
- Output the SAME number of bullets per experience as input. Same order.
- Preserve all factual claims (numbers, employers, dates, technologies actually mentioned).
- Inject JD keywords ONLY when the original bullet plausibly relates — never fabricate. If a bullet is unrelated to the JD, return it AS-IS.
- Lead each bullet with a strong action verb (Built, Led, Shipped, Reduced, Improved …).
- Add quantifiable impact ONLY if the original already implied it; never invent numbers.
- Keep each bullet ≤ 30 words.
- Match the language of the original (Indonesian or English).
- NO preamble, NO markdown, NO code fences.`;

    const userPayload = JSON.stringify({ jd: cleanJD, experiences: expPayload });

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
          { role: "user", content: wrapUserInput("tailor_input", userPayload) },
        ],
        temperature: 0.3,
        max_tokens: 1800,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      await recordError(ctx, {
        source: "cv.tailor",
        message: `gateway ${response.status} ${detail.slice(0, 300)}`,
      });
      await ctx.runMutation(internal.ai.mutations._refundAIQuota, { userId });
      throw new ConvexError(
        response.status === 429
          ? "Layanan AI sedang sibuk. Coba lagi beberapa saat."
          : "Gagal menghubungi layanan AI. Coba lagi nanti.",
      );
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { experiences?: Array<{ id: string; rewritten: string[] }> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ConvexError("AI mengembalikan format JSON tidak valid. Coba lagi.");
    }

    const rewriteMap = new Map<string, string[]>();
    for (const e of parsed.experiences ?? []) {
      if (typeof e.id === "string" && Array.isArray(e.rewritten)) {
        rewriteMap.set(
          e.id,
          e.rewritten.filter((s): s is string => typeof s === "string"),
        );
      }
    }

    // Pair each input bullet with its suggestion. Filter out experiences
    // where the AI returned a different bullet count or unchanged text.
    const results = expPayload.map((exp) => {
      const rewritten = rewriteMap.get(exp.id) ?? [];
      const aligned = rewritten.length === exp.achievements.length ? rewritten : exp.achievements;
      const changes = aligned.map((after, i) => ({
        index: i,
        before: exp.achievements[i] ?? "",
        after,
        changed: (exp.achievements[i] ?? "").trim() !== after.trim(),
      }));
      return {
        experienceId: exp.id,
        role: exp.role,
        company: exp.company,
        changes,
      };
    });

    return { jobMeta, experiences: results };
}

// ────────────────────────────────────────────────────────────────────
// Constrained Rewriter — Truth Ledger gated paraphrase
// ────────────────────────────────────────────────────────────────────

interface LedgerRewrite {
  atomId: Id<"truthAtoms">;
  type: string;
  sourceRef?: string;
  original: string;
  rewritten: string;
  /** Passed pure-logic validator (`engine/atoms/validator.ts`). */
  accepted: boolean;
  /** Validator complaint reasons when `accepted=false`. */
  violations: string[];
  /** False when the rewriter returned the original verbatim. */
  changed: boolean;
}

interface LedgerRewriteResult {
  jobMeta: string;
  rewrites: LedgerRewrite[];
  /** Atom count fetched from the ledger (active, non-superseded). */
  atomCount: number;
  /** Number of atoms the AI elected to rewrite (changed text). */
  changedCount: number;
  /** Of changed rewrites, how many passed the validator. */
  acceptedCount: number;
}

/**
 * The Truth-Ledger-gated rewriter. Where `tailorCVForJob` lets the
 * LLM freelance bullets from a JSON blob of experiences,
 * `rewriteFromLedger` ships the *atoms* — append-only attested
 * facts — and demands a per-atom paraphrase that passes a pure
 * Indonesian/English-aware numeric+lexical validator. Hallucination
 * is rejected in code, not in prompt discipline.
 */
export const rewriteFromLedger = action({
  args: {
    cvId: v.id("cvs"),
    jobListingId: v.optional(v.id("jobListings")),
    rawJD: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<LedgerRewriteResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Sesi Anda berakhir. Silakan login ulang.");
    }
    return withIdempotency(ctx, userId, args.idempotencyKey, () =>
      rewriteFromLedgerImpl(ctx, args, userId),
    );
  },
});

async function rewriteFromLedgerImpl(
  ctx: ActionCtx,
  args: {
    cvId: Id<"cvs">;
    jobListingId?: Id<"jobListings">;
    rawJD?: string;
  },
  userId: Id<"users">,
): Promise<LedgerRewriteResult> {
  await ctx.runMutation(internal.ai.mutations._checkAIQuota, { userId });

  const atoms = (await ctx.runQuery(api.engine.atoms.queries.listByCv, {
    cvId: args.cvId,
  })) as Array<Doc<"truthAtoms">>;

  if (atoms.length === 0) {
    throw new ConvexError(
      "Truth Ledger kosong. Seed dulu dari CV (klik 'Bangun Ledger' di editor) sebelum tailor.",
    );
  }

  let jdText: string;
  let jobMeta = "";
  if (args.jobListingId) {
    const job = await ctx.runQuery(internal.matcher.queries._getListing, {
      listingId: args.jobListingId,
    });
    if (!job) throw new ConvexError("Lowongan tidak ditemukan.");
    jobMeta = `${job.title} · ${job.company}`;
    jdText = `${job.title} di ${job.company}\nSkills dibutuhkan: ${job.requiredSkills.join(", ")}\n\n${job.description}`;
  } else if (args.rawJD && args.rawJD.trim().length >= 80) {
    jdText = args.rawJD;
  } else {
    throw new ConvexError(
      "Sertakan jobListingId atau rawJD minimal 80 karakter.",
    );
  }

  const cleanJD = sanitizeAIInput(jdText, 6000);

  // Cap atoms shipped per request — keeps tokens predictable.
  const MAX_ATOMS = 24;
  const shipped = atoms.slice(0, MAX_ATOMS);

  const atomPayload = shipped.map((a) => ({
    id: a._id,
    type: a.type,
    claim: a.claim,
  }));

  const cfg = await resolveAI(ctx, "gpt-4.1-mini");

  const systemPrompt = `You are a Truth-Ledger-gated resume rewriter for Indonesian + English bullets. Each input atom is an ATTESTED FACT. You may paraphrase to better target a target job description, but you MUST NOT:

- Introduce numbers, percentages, monetary amounts, dates, or counts that are not in the original atom.
- Drop numbers that ARE in the original.
- Invent technology names, company names, or proper nouns.
- Replace the atom with a different topic.

You MAY:
- Reorder words.
- Swap synonyms (Indonesian and English both fine — match the original language).
- Lead with a strong action verb (Membangun / Built, Memimpin / Led, Mengoptimasi / Optimised…).
- Inject JD keywords ONLY when the original atom plausibly relates to that keyword.

Output WAJIB: single JSON object of shape:
{
  "rewrites": [
    { "id": "<atom id verbatim>", "rewritten": "<paraphrased claim>" }
  ]
}

One entry per input atom, SAME id. If you cannot improve an atom, return the original text verbatim. NO preamble, NO markdown, NO code fences.`;

  const userPayload = JSON.stringify({ jd: cleanJD, atoms: atomPayload });

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
        { role: "user", content: wrapUserInput("ledger_rewrite_input", userPayload) },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    await recordError(ctx, {
      source: "cv.rewriteFromLedger",
      message: `gateway ${response.status} ${detail.slice(0, 300)}`,
    });
    await ctx.runMutation(internal.ai.mutations._refundAIQuota, { userId });
    throw new ConvexError(
      response.status === 429
        ? "Layanan AI sedang sibuk. Coba lagi beberapa saat."
        : "Gagal menghubungi layanan AI. Coba lagi nanti.",
    );
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  let parsed: { rewrites?: Array<{ id: string; rewritten: string }> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConvexError("AI mengembalikan format JSON tidak valid. Coba lagi.");
  }

  const rewriteMap = new Map<string, string>();
  for (const r of parsed.rewrites ?? []) {
    if (typeof r.id === "string" && typeof r.rewritten === "string") {
      rewriteMap.set(r.id, r.rewritten);
    }
  }

  const rewrites: LedgerRewrite[] = shipped.map((atom) => {
    const candidate = (rewriteMap.get(atom._id) ?? atom.claim).trim();
    const original = atom.claim;
    const changed = candidate !== original.trim();

    // Validator only runs when the AI actually changed the text —
    // otherwise we always accept the verbatim original.
    const validation = changed
      ? validateRewrite(original, candidate)
      : { ok: true as const, violations: [] as string[] };

    return {
      atomId: atom._id,
      type: atom.type,
      sourceRef: atom.sourceRef,
      original,
      rewritten: candidate,
      accepted: validation.ok,
      violations: validation.violations,
      changed,
    };
  });

  const changedCount = rewrites.filter((r) => r.changed).length;
  const acceptedCount = rewrites.filter((r) => r.changed && r.accepted).length;

  return {
    jobMeta,
    rewrites,
    atomCount: atoms.length,
    changedCount,
    acceptedCount,
  };
}

// ────────────────────────────────────────────────────────────────────

function buildCVSummary(cv: Doc<"cvs">): string {
  const parts: string[] = [];
  parts.push(`Name: ${cv.personalInfo.fullName}`);
  if (cv.personalInfo.location) parts.push(`Location: ${cv.personalInfo.location}`);
  if (cv.personalInfo.summary) parts.push(`Summary: ${cv.personalInfo.summary}`);

  if (cv.experience?.length) {
    parts.push("\nExperience:");
    for (const e of cv.experience.slice(0, 6)) {
      const range = e.current ? `${e.startDate}–sekarang` : `${e.startDate}–${e.endDate ?? "—"}`;
      parts.push(`- ${e.position} @ ${e.company} (${range})`);
      if (e.description) parts.push(`  ${e.description.slice(0, 200)}`);
      if (e.achievements?.length) {
        for (const a of e.achievements.slice(0, 3)) parts.push(`  • ${a.slice(0, 150)}`);
      }
    }
  }

  if (cv.education?.length) {
    parts.push("\nEducation:");
    for (const ed of cv.education.slice(0, 3)) {
      parts.push(`- ${ed.degree} ${ed.field} @ ${ed.institution}`);
    }
  }

  if (cv.skills?.length) {
    parts.push(`\nSkills: ${cv.skills.slice(0, 25).map((s) => s.name).join(", ")}`);
  }

  if (cv.projects?.length) {
    parts.push("\nProjects:");
    for (const p of cv.projects.slice(0, 4)) {
      parts.push(`- ${p.name}: ${p.description.slice(0, 150)} [${p.technologies.slice(0, 5).join(", ")}]`);
    }
  }

  if (cv.certifications?.length) {
    parts.push("\nCertifications: " + cv.certifications.slice(0, 5).map((c) => `${c.name} (${c.issuer})`).join("; "));
  }

  return parts.join("\n");
}
