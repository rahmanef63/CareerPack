/**
 * Pure ATS scoring — no AI, no DB, fully testable.
 *
 * Score = sum of 5 weighted dimensions (max 100):
 *   - keywordCoverage   35  (% of JD keywords found in CV body)
 *   - hardSkills        25  (intersection of requiredSkills with CV skills)
 *   - experienceFit     15  (seniority + years overlap)
 *   - sectionCompleteness 15 (summary, achievements with metrics, education)
 *   - parseability      10  (template choice + photo presence + length sanity)
 *
 * Grades: A 90+, B 75+, C 60+, D 45+, F <45.
 *
 * Designed so a generic CV vs frontend JD lands ~60-70 (B/C), a
 * well-targeted CV lands 85+ (A), and an empty CV lands ~10 (F).
 */

export interface CVSkill {
  name: string;
}
export interface CVExperience {
  position: string;
  description?: string;
  achievements?: string[];
  startDate?: string;
  endDate?: string;
  current?: boolean;
}
export interface CVEducation {
  institution: string;
  degree?: string;
}
export interface CVForScoring {
  template?: string;
  personalInfo?: { summary?: string; avatarStorageId?: string };
  skills?: CVSkill[];
  experience?: CVExperience[];
  education?: CVEducation[];
}

export interface JDForScoring {
  /** Keyword set extracted from the JD (lowercased, stemmed lightly). */
  keywords: string[];
  /** Required hard skills (e.g. listing.requiredSkills). */
  hardSkills: string[];
  /** "junior" | "entry-level" | "mid-level" | "senior" | "lead" */
  seniority?: string;
  /** Minimum years of experience required (parsed from description). */
  minYears?: number;
}

export interface ATSBreakdown {
  keywordCoverage: number;
  hardSkills: number;
  experienceFit: number;
  sectionCompleteness: number;
  parseability: number;
}

export interface ATSResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: ATSBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  formatIssues: string[];
  recommendations: string[];
}

/** Lowercased + collapsed-whitespace + stripped-punctuation. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+#.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Concatenate every searchable text field on the CV into one blob. */
export function flattenCVText(cv: CVForScoring): string {
  const parts: string[] = [];
  if (cv.personalInfo?.summary) parts.push(cv.personalInfo.summary);
  for (const s of cv.skills ?? []) parts.push(s.name);
  for (const exp of cv.experience ?? []) {
    parts.push(exp.position);
    if (exp.description) parts.push(exp.description);
    for (const a of exp.achievements ?? []) parts.push(a);
  }
  for (const edu of cv.education ?? []) {
    parts.push(edu.institution);
    if (edu.degree) parts.push(edu.degree);
  }
  return normalize(parts.join(" \n "));
}

/** True iff the CV body contains the keyword as a whole token. */
function containsToken(haystack: string, needle: string): boolean {
  const n = normalize(needle);
  if (!n) return false;
  // Word boundary at either side. `\b` doesn't handle hyphen/dot well so
  // we sandwich with start/end OR whitespace.
  const re = new RegExp(
    `(^|[^\\p{L}\\p{N}])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\p{N}]|$)`,
    "u",
  );
  return re.test(haystack);
}

/**
 * Compute years of experience from CV.experience entries.
 * Treats `current: true` entries as ending today. Falls back to
 * counting years between earliest startDate and latest endDate.
 */
export function inferYearsOfExperience(cv: CVForScoring): number {
  const exps = cv.experience ?? [];
  if (exps.length === 0) return 0;
  let earliestStart = Infinity;
  let latestEnd = 0;
  const now = Date.now();
  for (const e of exps) {
    const start = e.startDate ? Date.parse(`${e.startDate}-01`) : NaN;
    const end = e.current
      ? now
      : e.endDate
        ? Date.parse(`${e.endDate}-01`)
        : NaN;
    if (!Number.isNaN(start)) earliestStart = Math.min(earliestStart, start);
    if (!Number.isNaN(end)) latestEnd = Math.max(latestEnd, end);
  }
  if (earliestStart === Infinity || latestEnd === 0) return 0;
  return Math.max(0, (latestEnd - earliestStart) / (365.25 * 24 * 60 * 60 * 1000));
}

const SENIORITY_YEARS: Record<string, number> = {
  intern: 0,
  "entry-level": 0,
  junior: 1,
  "mid-level": 3,
  senior: 5,
  lead: 7,
  staff: 8,
  principal: 10,
};

function expectedYearsForSeniority(level: string | undefined): number {
  if (!level) return 0;
  return SENIORITY_YEARS[level.toLowerCase()] ?? 0;
}

/** Returns true when the achievement string looks "quantified" — has at
 *  least one number+unit ("25%", "3 months", "$10k", "1.5x"). */
function isQuantified(s: string): boolean {
  return /\b\d+([\.,]\d+)?\s*(%|x|k|m|jt|juta|orang|users?|clients?|months?|years?|jam|hari|hour|day|week)\b/i.test(
    s,
  ) || /\$\s*\d/.test(s) || /\bRp\s*\d/i.test(s);
}

export function scoreATS(cv: CVForScoring, jd: JDForScoring): ATSResult {
  const cvBody = flattenCVText(cv);
  const cvSkills = (cv.skills ?? []).map((s) => normalize(s.name));

  // -- 1) Keyword coverage (35) ------------------------------------------
  const uniqueKeywords = Array.from(
    new Set(jd.keywords.map((k) => normalize(k)).filter(Boolean)),
  );
  const matched: string[] = [];
  const missing: string[] = [];
  for (const k of uniqueKeywords) {
    if (containsToken(cvBody, k)) matched.push(k);
    else missing.push(k);
  }
  const coverageRatio =
    uniqueKeywords.length === 0 ? 1 : matched.length / uniqueKeywords.length;
  const keywordCoverage = Math.round(coverageRatio * 35);

  // -- 2) Hard skills (25) -----------------------------------------------
  const hardWanted = jd.hardSkills.map((s) => normalize(s)).filter(Boolean);
  const hardMatched = hardWanted.filter(
    (s) => cvSkills.includes(s) || containsToken(cvBody, s),
  ).length;
  const hardSkillsScore =
    hardWanted.length === 0
      ? 25
      : Math.round((hardMatched / hardWanted.length) * 25);

  // -- 3) Experience fit (15) --------------------------------------------
  const years = inferYearsOfExperience(cv);
  const expectedYears = Math.max(
    expectedYearsForSeniority(jd.seniority),
    jd.minYears ?? 0,
  );
  let experienceFit: number;
  if (expectedYears === 0) {
    experienceFit = 12;
  } else if (years >= expectedYears) {
    experienceFit = 15;
  } else if (years >= expectedYears * 0.6) {
    experienceFit = 9;
  } else if (years > 0) {
    experienceFit = 5;
  } else {
    experienceFit = 0;
  }

  // -- 4) Section completeness (15) --------------------------------------
  let sectionCompleteness = 0;
  const summary = cv.personalInfo?.summary?.trim() ?? "";
  if (summary.length >= 80) sectionCompleteness += 5;
  else if (summary.length > 0) sectionCompleteness += 2;
  const achievements = (cv.experience ?? []).flatMap((e) => e.achievements ?? []);
  const quantified = achievements.filter(isQuantified).length;
  if (quantified >= 2) sectionCompleteness += 6;
  else if (quantified === 1) sectionCompleteness += 3;
  else if (achievements.length > 0) sectionCompleteness += 1;
  if ((cv.education ?? []).length > 0) sectionCompleteness += 4;

  // -- 5) Parseability (10) ----------------------------------------------
  // Template Modern uses a 2-column layout that some legacy ATS parsers
  // misread; we deduct 3 points for it. Photo presence is a soft minus
  // (international ATS prefers no photo); we only flag if showPicture
  // would be inferred from avatar present + summary length suggests
  // international audience (heuristic). For MVP, simple rules:
  let parseability = 10;
  const formatIssues: string[] = [];
  if (cv.template === "modern") {
    parseability -= 3;
    formatIssues.push(
      "Template Modern menggunakan 2 kolom — beberapa parser ATS lama bisa salah membaca urutan teks. Pertimbangkan template Classic atau Minimal untuk lamaran internasional.",
    );
  }
  if (!summary || summary.length < 40) {
    parseability -= 2;
    formatIssues.push(
      "Ringkasan profesional terlalu pendek — ATS sering memakai ringkasan untuk klasifikasi awal. Tambahkan 2-3 kalimat memuat targetRole + tahun pengalaman + keyword utama.",
    );
  }
  if ((cv.experience ?? []).length === 0) {
    parseability -= 4;
    formatIssues.push("CV belum mencantumkan pengalaman kerja sama sekali.");
  }
  parseability = Math.max(0, parseability);

  // -- Total + grade -----------------------------------------------------
  const total =
    keywordCoverage +
    hardSkillsScore +
    experienceFit +
    sectionCompleteness +
    parseability;
  const score = Math.max(0, Math.min(100, total));
  const grade: ATSResult["grade"] =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 45 ? "D" : "F";

  // -- Recommendations ---------------------------------------------------
  const recommendations: string[] = [];
  if (missing.length > 0) {
    const top = missing.slice(0, 6).join(", ");
    recommendations.push(
      `Tambahkan keyword berikut secara natural di ringkasan / pengalaman: ${top}.`,
    );
  }
  if (hardWanted.length > 0 && hardMatched < hardWanted.length) {
    const missingHard = hardWanted.filter(
      (s) => !cvSkills.includes(s) && !containsToken(cvBody, s),
    );
    recommendations.push(
      `Skill wajib lowongan yang belum tercantum: ${missingHard.slice(0, 5).join(", ")}. Tambahkan ke daftar Skills jika Anda menguasainya.`,
    );
  }
  if (quantified < 2 && achievements.length > 0) {
    recommendations.push(
      "Kuantifikasi pencapaian Anda — misalnya 'menaikkan konversi 18%' atau 'mengelola 12 anggota tim'. ATS dan recruiter lebih memprioritaskan angka.",
    );
  }
  if (summary.length < 80) {
    recommendations.push(
      "Perpanjang ringkasan profesional ke 80-200 karakter dengan menyebut role target + 2-3 keyword industri.",
    );
  }
  if (expectedYears > 0 && years < expectedYears) {
    recommendations.push(
      `Lowongan ini menargetkan ~${expectedYears} tahun pengalaman; CV Anda saat ini sekitar ${years.toFixed(1)} tahun. Tonjolkan project / freelance / magang relevan untuk menjembatani gap.`,
    );
  }

  return {
    score,
    grade,
    breakdown: {
      keywordCoverage,
      hardSkills: hardSkillsScore,
      experienceFit,
      sectionCompleteness,
      parseability,
    },
    matchedKeywords: matched,
    missingKeywords: missing,
    formatIssues,
    recommendations,
  };
}

/**
 * Cheap regex-only keyword extractor. Used as a fallback when the AI
 * extraction fails (rate-limited, network blip, JSON-parse error, etc.).
 * Splits the JD into tokens, filters by a stop-list + length, and
 * returns the most-frequent multi-word phrases first. Not as precise as
 * an AI extraction but good enough to keep the score meaningful.
 */
const STOPWORDS = new Set<string>([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for",
  "with", "as", "is", "are", "was", "were", "be", "been", "being", "this",
  "that", "we", "you", "they", "i", "have", "has", "had", "will", "would",
  "should", "could", "may", "must", "shall", "can", "do", "does", "did",
  "your", "our", "their", "his", "her", "its", "any", "all", "some", "no",
  "not", "only", "very", "more", "most", "much", "many", "few", "other",
  "such", "into", "than", "then", "by", "from", "about", "if", "so",
  "dan", "atau", "yang", "untuk", "dengan", "pada", "di", "ke", "dari",
  "ini", "itu", "akan", "bisa", "harus", "agar", "saja", "juga", "kami",
  "kita", "anda", "saya", "kalau", "supaya", "dalam", "lebih", "atau",
  "tahun", "year", "years", "experience", "ability", "skills", "skill",
  "knowledge", "preferred", "required", "must", "good", "strong",
]);

export function fallbackExtractKeywords(jdText: string, limit = 24): string[] {
  const norm = normalize(jdText);
  const tokens = norm.split(/[\s,;.!?()/]+/).filter(Boolean);
  const counts = new Map<string, number>();
  for (const t of tokens) {
    if (t.length < 3) continue;
    if (/^\d+$/.test(t)) continue;
    if (STOPWORDS.has(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}
