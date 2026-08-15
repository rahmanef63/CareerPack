import type { PersonalBrandingTheme } from "../blocks/types";
import type { ShowMoreList } from "../components/BrandingShowMoreDialog";

export const VALID_SHOW_MORE_LISTS: ReadonlySet<ShowMoreList> = new Set([
  "projects",
  "skills",
  "experience",
  "education",
  "certifications",
  "languages",
]);

/** Branding payload mirrors `convex/profile/brandingPayload.ts`. The
 *  iframe templates read it from `window.__careerpack` and use
 *  `data-cp` markers + `has` flags to populate / hide sections. */
export interface BrandingPayload {
  identity: {
    name: string;
    headline: string;
    targetRole: string;
    location: string;
    avatarUrl: string | null;
    contact: { email: string; linkedin: string; portfolio: string };
  };
  about: { bio: string; summary: string };
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }>;
  certifications: Array<{ name: string; issuer: string; date: string }>;
  languages: Array<{ language: string; proficiency: string }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    link: string;
    date: string;
    techStack: string[];
    featured: boolean;
    coverEmoji: string | null;
    coverUrl: string | null;
  }>;
  availability?: { open: boolean; note: string };
  cta?: {
    label: string;
    url: string;
    type: "link" | "email" | "calendly" | "download";
  };
  /** User-style customization (color/font/radius/density). */
  style?: {
    primary?: string;
    font?: "sans" | "serif" | "mono";
    radius?: "none" | "sm" | "md" | "lg" | "full";
    density?: "compact" | "normal" | "spacious";
  };
  sectionOrder?: string[];
  has: {
    about: boolean;
    skills: boolean;
    experience: boolean;
    education: boolean;
    certifications: boolean;
    languages: boolean;
    projects: boolean;
    contact: boolean;
  };
}

export interface ProfileShape {
  slug: string;
  displayName: string;
  theme: PersonalBrandingTheme;
  accent: string | null;
  /** The user's own page document. When set it replaces the built-in
   *  template file; the data payload is injected into it either way. */
  html?: string | null;
  /** Optional — when present, fed into the iframe so templates render
   *  with real data and hide empty sections. */
  branding?: BrandingPayload;
}

export interface FloatingNavItem {
  id: string;
  label: string;
  iconHtml: string;
}
