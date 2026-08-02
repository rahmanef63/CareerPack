import type { ContactFormValues, ContactRole } from "../types";

export const ROLE_LABELS: Record<ContactRole, string> = {
  recruiter: "Rekruter",
  mentor: "Mentor",
  peer: "Rekan",
  other: "Lainnya",
};

export const ROLE_EMOJIS: Record<ContactRole, string> = {
  recruiter: "🎯",
  mentor: "🧠",
  peer: "🤝",
  other: "👤",
};

export const AVATAR_HUES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "from-cyan-400 to-blue-500", label: "Biru" },
  { value: "from-violet-400 to-purple-600", label: "Ungu" },
  { value: "from-pink-400 to-rose-600", label: "Rose" },
  { value: "from-amber-400 to-orange-600", label: "Jingga" },
  { value: "from-emerald-400 to-green-600", label: "Hijau" },
  { value: "from-fuchsia-400 to-pink-600", label: "Magenta" },
];

export const DEFAULT_FORM: ContactFormValues = {
  name: "",
  role: "peer",
  company: "",
  position: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  notes: "",
  avatarEmoji: "",
  avatarHue: "from-cyan-400 to-blue-500",
  favorite: false,
};
