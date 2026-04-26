import type { PortfolioCategory, PortfolioFormValues } from "../types";

export const CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  project: "Proyek",
  certification: "Sertifikasi",
  publication: "Publikasi",
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
];

export const DEFAULT_FORM: PortfolioFormValues = {
  title: "",
  description: "",
  category: "project",
  coverEmoji: "🚀",
  coverGradient: "from-cyan-400 to-cyan-600",
  link: "",
  techStack: [],
  date: new Date().toISOString().slice(0, 10),
  featured: false,
};
