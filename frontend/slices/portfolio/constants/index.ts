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
