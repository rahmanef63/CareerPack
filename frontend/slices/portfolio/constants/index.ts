import type {
  PortfolioCategory,
  PortfolioFormValues,
  PortfolioLinkKind,
} from "../types";

/**
 * Category labels — order drives tab order in the UI. Legacy three
 * stay first; expanded set covers IT, design, writing, music, etc.
 */
export const CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  project: "Proyek",
  design: "Desain",
  writing: "Tulisan",
  certification: "Sertifikasi",
  publication: "Publikasi",
  speaking: "Public Speaking",
  award: "Penghargaan",
  openSource: "Open Source",
  volunteer: "Volunteer",
  music: "Musik",
  photography: "Fotografi",
  video: "Video",
  research: "Riset",
  teaching: "Pengajaran",
  other: "Lainnya",
};

export const CATEGORY_EMOJI_DEFAULT: Record<PortfolioCategory, string> = {
  project: "🚀",
  design: "🎨",
  writing: "✍️",
  certification: "🏅",
  publication: "📚",
  speaking: "🎤",
  award: "🏆",
  openSource: "🌱",
  volunteer: "🤝",
  music: "🎵",
  photography: "📸",
  video: "🎬",
  research: "🔬",
  teaching: "🧑‍🏫",
  other: "📁",
};

export const LINK_KIND_LABELS: Record<PortfolioLinkKind, string> = {
  live: "Live",
  repo: "Repo",
  "case-study": "Studi Kasus",
  slides: "Slide",
  video: "Video",
  article: "Artikel",
  store: "Store",
  other: "Lainnya",
};

export const COVER_GRADIENTS: ReadonlyArray<{ value: string; label: string }> =
  [
    { value: "from-cyan-400 to-cyan-600", label: "Sianida" },
    { value: "from-violet-400 to-violet-600", label: "Ungu" },
    { value: "from-pink-400 to-rose-600", label: "Magenta" },
    { value: "from-amber-400 to-orange-600", label: "Jingga" },
    { value: "from-emerald-400 to-green-600", label: "Hijau" },
    { value: "from-sky-400 to-blue-600", label: "Biru" },
    { value: "from-fuchsia-400 to-purple-600", label: "Fuchsia" },
    { value: "from-slate-500 to-slate-700", label: "Arang" },
  ];

export const EMOJI_SUGGESTIONS: ReadonlyArray<string> = [
  "💻", "🚀", "🎨", "📱", "🤖", "🧠", "📊", "🛠️", "📚", "🎯",
  "🏆", "📝", "🔬", "🎬", "🎧", "🧬", "🌐", "⚡", "🎮", "📸",
  "✍️", "🎤", "🌱", "🤝", "🎵", "🧑‍🏫", "🏅", "🏷️",
];

/**
 * Fallback cover for items with no `coverGradient`/`coverEmoji` of their own
 * (legacy rows from before the cover picker existed — the create form
 * always sets `DEFAULT_FORM`'s cyan/rocket pair going forward). Cards used
 * to `??` straight to one hardcoded slate gradient + a document emoji, so
 * every uncovered item looked identical (2026-08-31 audit: two "Unggulan"
 * cards were visually indistinguishable). Deterministic per item — same
 * project always renders the same fallback, it just isn't the SAME
 * fallback as every other uncovered project. Reuses `COVER_GRADIENTS`
 * (skipping "Arang", the old static slate, so uncovered items look
 * distinctly less "default" than before) and `CATEGORY_EMOJI_DEFAULT` — the
 * emoji is category-driven rather than hashed, since "a real icon for what
 * this actually is" beats one more layer of pseudo-randomness.
 */
const FALLBACK_GRADIENTS = COVER_GRADIENTS.filter((g) => g.label !== "Arang");

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function fallbackCoverFor(
  id: string,
  // `string`, not `PortfolioCategory`: the Convex column is `v.string()`
  // (no server-side enum), so a value that predates a category rename
  // (or a future one this file doesn't know about yet) must not be a type
  // error at every call site — it just falls through to the emoji default.
  category: string,
): { gradient: string; emoji: string } {
  const gradient =
    FALLBACK_GRADIENTS[hashString(id) % FALLBACK_GRADIENTS.length]?.value ??
    "from-slate-500 to-slate-700";
  const emoji =
    CATEGORY_EMOJI_DEFAULT[category as PortfolioCategory] ?? "📄";
  return { gradient, emoji };
}

export const DEFAULT_FORM: PortfolioFormValues = {
  title: "",
  description: "",
  category: "project",
  coverEmoji: "🚀",
  coverGradient: "from-cyan-400 to-cyan-600",
  media: [],
  link: "",
  links: [],
  techStack: [],
  date: new Date().toISOString().slice(0, 10),
  featured: false,
  role: "",
  client: "",
  duration: "",
  outcomes: [],
  collaborators: [],
  skills: [],
  brandingShow: undefined,
};
