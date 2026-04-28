/**
 * Builds the structured payload that the public-page iframe templates
 * consume via `window.__careerpack`. Combines profile + CV +
 * portfolio so each template can populate hero / about / skills /
 * experience / projects / contact from real user data and hide
 * sections that have no data.
 *
 * Field naming matches the data-cp slot keys baked into each
 * template (see frontend/public/personal-branding/templates/v*.html).
 */

import type { Doc } from "../_generated/dataModel";

interface ProfileInput {
  fullName: string;
  publicHeadline: string;
  targetRole: string;
  location: string;
  bio: string;
  skills: string[];
  avatarUrl: string | null;
  contactEmail: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

interface PortfolioInput {
  id: string;
  title: string;
  description: string;
  category: string;
  link: string;
  date: string;
  techStack: string[];
  featured: boolean;
  coverEmoji: string | null;
  coverGradient: string | null;
  coverUrl: string | null;
}

export interface BrandingExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface BrandingEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface BrandingProject {
  name: string;
  description: string;
  technologies: string[];
  link: string;
}

export interface BrandingCertification {
  name: string;
  issuer: string;
  date: string;
}

export interface BrandingLanguage {
  language: string;
  proficiency: string;
}

export interface BrandingProjectCard {
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
}

export type BrandingCtaType = "link" | "email" | "calendly" | "download";

export interface BrandingCta {
  label: string;
  url: string;
  type: BrandingCtaType;
}

export interface BrandingAvailability {
  open: boolean;
  note: string;
}

/**
 * Per-section visibility toggles consumed by buildBrandingPayload to
 * override the default "show whenever data exists" behaviour. When a
 * toggle is `false` we force `has.X = false` so the hydrator hides
 * the section even if data is present. Mirrors AutoToggles +
 * publicBioShow/publicSkillsShow which historically only affected
 * the legacy block builder.
 */
export interface BrandingToggles {
  showExperience: boolean;
  showEducation: boolean;
  showCertifications: boolean;
  showProjects: boolean;
  showLanguages: boolean;
  showBio: boolean;
  showSkills: boolean;
}

export interface BrandingPayload {
  identity: {
    name: string;
    headline: string;
    targetRole: string;
    location: string;
    avatarUrl: string | null;
    contact: {
      email: string;
      linkedin: string;
      portfolio: string;
    };
  };
  about: {
    bio: string;
    summary: string;
  };
  skills: string[];
  experience: BrandingExperience[];
  education: BrandingEducation[];
  certifications: BrandingCertification[];
  languages: BrandingLanguage[];
  projects: BrandingProjectCard[];
  /** Hero-area "available for hire" status. Optional — when `open` is
   *  false the hydrator skips the badge entirely. */
  availability?: BrandingAvailability;
  /** Hero primary call-to-action. When `label` + `url` are both
   *  present the hydrator injects a button just below the hero. */
  cta?: BrandingCta;
  /** User-defined order of section keys. Hydrator reorders matching
   *  `[data-cp-section]` siblings. Sections not in the list keep
   *  their template-default position. */
  sectionOrder?: string[];
  /**
   * Section presence map — UI hydrator uses this to decide which
   * sections to show vs. hide. Authoritative; hydrator should not
   * second-guess by inspecting nested arrays itself.
   */
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

export function buildBrandingPayload({
  profile,
  cv,
  portfolio,
  toggles,
  availability,
  cta,
  sectionOrder,
}: {
  profile: ProfileInput;
  cv: Doc<"cvs"> | null;
  portfolio: PortfolioInput[];
  /** Optional — when omitted every section defaults to visible. */
  toggles?: Partial<BrandingToggles>;
  availability?: BrandingAvailability;
  cta?: BrandingCta;
  sectionOrder?: string[];
}): BrandingPayload {
  const cvSummary = cv?.personalInfo?.summary ?? "";
  const bio = profile.bio || "";

  const experience: BrandingExperience[] = (cv?.experience ?? []).map((e) => ({
    company: e.company ?? "",
    position: e.position ?? "",
    startDate: e.startDate ?? "",
    endDate: e.endDate ?? "",
    current: Boolean(e.current),
    description: e.description ?? "",
    achievements: e.achievements ?? [],
  }));
  const education: BrandingEducation[] = (cv?.education ?? []).map((e) => ({
    institution: e.institution ?? "",
    degree: e.degree ?? "",
    field: e.field ?? "",
    startDate: e.startDate ?? "",
    endDate: e.endDate ?? "",
    gpa: e.gpa ?? "",
  }));
  const certifications: BrandingCertification[] = (cv?.certifications ?? []).map(
    (c) => ({
      name: c.name ?? "",
      issuer: c.issuer ?? "",
      date: c.date ?? "",
    }),
  );
  const languages: BrandingLanguage[] = (cv?.languages ?? []).map((l) => ({
    language: l.language ?? "",
    proficiency: l.proficiency ?? "",
  }));
  const cvProjects: BrandingProject[] = (cv?.projects ?? []).map((p) => ({
    name: p.name ?? "",
    description: p.description ?? "",
    technologies: p.technologies ?? [],
    link: p.link ?? "",
  }));
  const cvSkills: string[] = (cv?.skills ?? [])
    .map((s) => s.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0);

  // Merge profile.skills + CV skills, dedup case-insensitive, profile
  // first (user-curated takes priority over CV's auto-list).
  const skillsMerged: string[] = [];
  const seen = new Set<string>();
  for (const s of [...profile.skills, ...cvSkills]) {
    const k = s.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    skillsMerged.push(s.trim());
  }

  // Project cards = portfolio items + CV projects mapped into the
  // same shape so the hydrator can render them uniformly.
  const projectCards: BrandingProjectCard[] = [
    ...portfolio.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      link: p.link,
      date: p.date,
      techStack: p.techStack,
      featured: p.featured,
      coverEmoji: p.coverEmoji,
      coverUrl: p.coverUrl,
    })),
    ...cvProjects.map((p, i) => ({
      id: `cv-project-${i}`,
      title: p.name,
      description: p.description,
      category: "project",
      link: p.link,
      date: "",
      techStack: p.technologies,
      featured: false,
      coverEmoji: null,
      coverUrl: null,
    })),
  ].filter((p) => p.title.trim().length > 0);

  const hasContact = Boolean(
    profile.contactEmail.trim() ||
      profile.linkedinUrl.trim() ||
      profile.portfolioUrl.trim(),
  );

  // Toggles default to "show when data exists" (omitted toggle = true).
  const t: BrandingToggles = {
    showExperience: toggles?.showExperience ?? true,
    showEducation: toggles?.showEducation ?? true,
    showCertifications: toggles?.showCertifications ?? true,
    showProjects: toggles?.showProjects ?? true,
    showLanguages: toggles?.showLanguages ?? true,
    showBio: toggles?.showBio ?? true,
    showSkills: toggles?.showSkills ?? true,
  };

  // Sanitised availability + cta — drop entries that are missing the
  // pieces needed to render. Saves the hydrator from re-checking.
  const availabilityOut: BrandingAvailability | undefined =
    availability && availability.open
      ? { open: true, note: availability.note ?? "" }
      : undefined;
  const ctaOut: BrandingCta | undefined =
    cta && cta.label.trim() && cta.url.trim()
      ? { label: cta.label.trim(), url: cta.url.trim(), type: cta.type }
      : undefined;

  return {
    identity: {
      name: profile.fullName || "",
      headline: profile.publicHeadline || "",
      targetRole: profile.targetRole || "",
      location: profile.location || "",
      avatarUrl: profile.avatarUrl,
      contact: {
        email: profile.contactEmail || "",
        linkedin: profile.linkedinUrl || "",
        portfolio: profile.portfolioUrl || "",
      },
    },
    about: {
      bio,
      summary: cvSummary,
    },
    skills: skillsMerged,
    experience,
    education,
    certifications,
    languages,
    projects: projectCards,
    availability: availabilityOut,
    cta: ctaOut,
    sectionOrder:
      sectionOrder && sectionOrder.length > 0 ? sectionOrder : undefined,
    has: {
      about: t.showBio && Boolean(bio.trim() || cvSummary.trim()),
      skills: t.showSkills && skillsMerged.length > 0,
      experience: t.showExperience && experience.length > 0,
      education: t.showEducation && education.length > 0,
      certifications: t.showCertifications && certifications.length > 0,
      languages: t.showLanguages && languages.length > 0,
      projects: t.showProjects && projectCards.length > 0,
      contact: hasContact,
    },
  };
}
