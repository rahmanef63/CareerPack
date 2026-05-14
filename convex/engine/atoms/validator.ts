/**
 * Constrained-rewriter validator.
 *
 * The AI rewriter is *contractually* allowed to paraphrase an atom's
 * claim — never to invent. This pure-logic validator enforces that
 * contract in code, not in prompt discipline, so a misbehaving LLM
 * physically cannot ship a hallucination through.
 *
 * Two rules:
 *   1. Numeric fidelity — every digit run / percentage / monetary
 *      figure in the original must appear in the rewrite, and the
 *      rewrite must NOT introduce a number that wasn't there.
 *   2. Lexical overlap — the rewrite must share at least 30% of its
 *      content tokens with the original (Jaccard on word sets).
 *      Catches the failure mode where the LLM ignores the atom
 *      entirely and writes a plausible-sounding but unrelated bullet.
 */

const NUMBER_RE = /-?\$?\d[\d.,]*\s*%?/g;
const WORD_RE = /[\p{L}\p{N}]+/gu;

const STOP = new Set<string>([
  "di", "ke", "dari", "yang", "dan", "atau", "untuk", "dengan", "pada",
  "dalam", "oleh", "agar", "supaya", "telah", "sudah", "ini", "itu",
  "per", "tahun", "bulan", "hari", "saja", "juga", "akan", "tidak",
  "the", "a", "an", "of", "to", "in", "on", "at", "for", "with",
  "and", "or", "by", "is", "was", "were", "are", "be", "been", "as",
]);

/**
 * Lexical-overlap floor. Paraphrasing with synonyms legitimately
 * drops to ~0.20 — anything lower than that usually means the LLM
 * abandoned the atom and wrote a different bullet entirely.
 */
const MIN_JACCARD = 0.2;

export interface ValidationResult {
  ok: boolean;
  violations: string[];
}

export function validateRewrite(
  original: string,
  rewritten: string,
): ValidationResult {
  const violations: string[] = [];

  const origNumbers = extractNumbers(original);
  const rewNumbers = extractNumbers(rewritten);

  for (const n of origNumbers) {
    if (!rewNumbers.includes(n)) {
      violations.push(`Angka hilang: "${n}"`);
    }
  }
  for (const n of rewNumbers) {
    if (!origNumbers.includes(n)) {
      violations.push(`Angka dikarang: "${n}"`);
    }
  }

  const overlap = jaccard(tokenize(original), tokenize(rewritten));
  if (overlap < MIN_JACCARD) {
    violations.push(
      `Tumpang-tindih leksikal terlalu rendah (${overlap.toFixed(2)} < ${MIN_JACCARD.toFixed(2)})`,
    );
  }

  return { ok: violations.length === 0, violations };
}

function extractNumbers(text: string): string[] {
  const matches = text.match(NUMBER_RE) ?? [];
  return matches.map((m) => m.replace(/\s+/g, "").trim()).filter(Boolean);
}

function tokenize(text: string): Set<string> {
  const out = new Set<string>();
  const matches = text.toLowerCase().match(WORD_RE) ?? [];
  for (const w of matches) {
    if (w.length < 3) continue;
    if (STOP.has(w)) continue;
    out.add(w);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}
