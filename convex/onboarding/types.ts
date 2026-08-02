/**
 * Quick-fill JSON payload types — shared by the client (parser /
 * preview / type guards) and the server (sanitiser + dispatch).
 *
 * Every section is optional so the user can paste partial JSON
 * (e.g. only `profile`, or only `portfolio`). Inside each section,
 * fields that are required by the underlying table are marked
 * required; the sanitiser drops the whole section if those are
 * missing. Optional fields just become undefined on insert.
 */

export type ExperienceLevel =
  | "entry-level"
  | "junior"
  | "mid-level"
  | "senior"
  | "lead";

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "entry-level",
  "junior",
  "mid-level",
  "senior",
  "lead",
];

export interface QuickFillProfile {
  fullName: string;
  phone?: string;
  location: string;
  targetRole: string;
  experienceLevel: ExperienceLevel | string;
  bio?: string;
  skills?: string[];
  interests?: string[];
}

export interface QuickFillCVPersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  linkedin?: string;
  portfolio?: string;
  dateOfBirth?: string;
}

export interface QuickFillCVExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  achievements?: string[];
}

export interface QuickFillCVEducation {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

export interface QuickFillCVSkill {
  name: string;
  category?: string;
  proficiency?: number;
}

export interface QuickFillCVCertification {
  name: string;
  issuer?: string;
  date?: string;
  expiryDate?: string;
}

export interface QuickFillCVLanguage {
  language: string;
  proficiency: string;
}

export interface QuickFillCVProject {
  name: string;
  description?: string;
  technologies?: string[];
  link?: string;
}

export interface QuickFillCV {
  title?: string;
  template?: string;
  personalInfo: QuickFillCVPersonalInfo;
  experience?: QuickFillCVExperience[];
  education?: QuickFillCVEducation[];
  skills?: QuickFillCVSkill[];
  certifications?: QuickFillCVCertification[];
  languages?: QuickFillCVLanguage[];
  projects?: QuickFillCVProject[];
}

export interface QuickFillPortfolioItem {
  title: string;
  description: string;
  category: "project" | "certification" | "publication" | string;
  link?: string;
  techStack?: string[];
  /** YYYY-MM-DD. */
  date: string;
  featured?: boolean;
  coverEmoji?: string;
  coverGradient?: string;
}

export interface QuickFillGoal {
  title: string;
  description: string;
  category: string;
  /** Either an absolute YYYY-MM-DD date OR a positive integer
   *  meaning "days from now". The sanitiser normalises both. */
  targetDate: string | number;
  milestones?: Array<{ title: string; completed?: boolean }>;
}

export interface QuickFillApplication {
  company: string;
  position: string;
  location: string;
  /** Status is freeform but we recommend: applied|screening|interview|offer|rejected. */
  status?: string;
  source?: string;
  salary?: string;
  notes?: string;
  /** YYYY-MM-DD or "days ago" integer. */
  appliedDate?: string | number;
}

export interface QuickFillContact {
  name: string;
  /** recruiter | mentor | peer | other */
  role: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  notes?: string;
}

export interface QuickFillPayload {
  profile?: QuickFillProfile;
  cv?: QuickFillCV;
  portfolio?: QuickFillPortfolioItem[];
  goals?: QuickFillGoal[];
  applications?: QuickFillApplication[];
  contacts?: QuickFillContact[];
}

/** Per-section import outcome reported back to the UI. */
export interface QuickFillResult {
  profile: boolean;
  cv: boolean;
  portfolio: { added: number; skipped: number };
  goals: { added: number; skipped: number };
  applications: { added: number; skipped: number };
  contacts: { added: number; skipped: number };
  warnings: string[];
}

export type QuickFillScope =
  | "all"
  | "profile-cv"
  | "profile"
  | "cv"
  | "portfolio"
  | "goals"
  | "applications"
  | "contacts";

export const SCOPE_LABELS: Record<QuickFillScope, { title: string; description: string }> = {
  all: {
    title: "Lengkap",
    description: "Profil + CV + Portofolio + Goals + Lamaran + Kontak — paket lengkap untuk akun baru.",
  },
  "profile-cv": {
    title: "Profil + CV",
    description: "Esensial — informasi pribadi + CV terstruktur.",
  },
  profile: {
    title: "Profil saja",
    description: "Nama, lokasi, target role, skills, bio.",
  },
  cv: {
    title: "CV saja",
    description: "CV lengkap dengan pengalaman, pendidikan, sertifikasi, proyek.",
  },
  portfolio: {
    title: "Portofolio",
    description: "Daftar project, sertifikasi, publikasi.",
  },
  goals: {
    title: "Goals",
    description: "Target karir + milestones.",
  },
  applications: {
    title: "Lamaran",
    description: "Riwayat lamaran kerja.",
  },
  contacts: {
    title: "Kontak / Networking",
    description: "Recruiter, mentor, peer.",
  },
};
