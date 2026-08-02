export const HEADLINE_PREFIX = "Semua yang Anda Butuhkan untuk ";
export const HEADLINE_HIGHLIGHT = "Karir Impian.";

export const LEAD_PARAGRAPH =
  "Siapkan CV, lengkapi dokumen, latih wawancara, dan lacak setiap lamaran — semuanya di satu tempat.";

/**
 * The one English sentence on an otherwise Indonesian page.
 *
 * The product stays Indonesian — its users are Indonesian job seekers, and
 * auto-translating for an en-locale browser in Jakarta is the worse failure
 * (see `shared/lib/googleTranslate.ts`). But a visitor arriving from an English
 * link — Product Hunt, a shared tweet — currently reads only the Indonesian
 * headline and gets no signal at all: not what this is, not who it is for, not
 * that one tap translates the whole app. One static line converts that bounce
 * into either an informed decision or a translate tap, and an Indonesian reader
 * simply skims past it.
 *
 * Rendered with `translate="no"`, because Google Translate runs id→en from the
 * cookie and would otherwise mangle text that is already English.
 */
export const ENGLISH_TAGLINE =
  "A career toolkit for Indonesian job seekers — CV builder, application tracker, mock interviews, AI assistant. Free forever, and one tap translates the whole app.";

export const CTA_PRIMARY_LABEL = "Mulai Gratis";
export const CTA_DEMO_LABEL = "Lihat Demo";
export const CTA_DEMO_LOADING_LABEL = "Memulai sesi demo…";

// ponytail: plain strings, not {id,label} — the string is its own key,
// which is the whole reason hero.types.ts could go.
export const TRUST_POINTS = [
  "Gratis selamanya",
  "Tanpa kartu kredit",
  "Data Anda tidak dijual",
];
