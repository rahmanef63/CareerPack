import { describe, it, expect } from "vitest";
import { buildBrandingPayload } from "./brandingPayload";
import type { Doc } from "../_generated/dataModel";

/**
 * brandingPayload is the contract the iframe templates depend on.
 * Drift here = silent rendering bugs in the public page. These tests
 * pin the shape AND the gating logic (publicXShow toggles, dedup,
 * empty-list `has` flags).
 */

const emptyProfile = {
  fullName: "",
  publicHeadline: "",
  targetRole: "",
  location: "",
  bio: "",
  skills: [],
  avatarUrl: null,
  contactEmail: "",
  linkedinUrl: "",
  portfolioUrl: "",
};

function fullCv(): Doc<"cvs"> {
  return {
    _id: "cv1" as Doc<"cvs">["_id"],
    _creationTime: 0,
    userId: "u1" as Doc<"cvs">["userId"],
    title: "CV",
    isDefault: true,
    template: "modern",
    targetRole: "FE",
    targetCompany: "Acme",
    personalInfo: {
      fullName: "Rahman",
      email: "r@x.com",
      phone: "",
      location: "Jakarta",
      website: "",
      linkedin: "",
      summary: "Builds resilient frontends.",
    },
    experience: [
      {
        id: "e1",
        company: "A",
        position: "Eng",
        startDate: "2022",
        endDate: "2024",
        current: false,
        description: "did stuff",
        achievements: ["shipped x", "led y"],
      },
    ],
    education: [
      {
        id: "ed1",
        institution: "X Univ",
        degree: "S1",
        field: "CS",
        startDate: "2018",
        endDate: "2022",
        gpa: "3.8",
      },
    ],
    skills: [{ id: "s1", name: "TypeScript", level: "Advanced" }],
    certifications: [{ id: "c1", name: "AWS SAA", issuer: "AWS", date: "2023" }],
    languages: [{ id: "l1", language: "Indonesian", proficiency: "Native" }],
    projects: [
      {
        id: "p1",
        name: "Side Project",
        description: "thing",
        technologies: ["React"],
        link: "https://x",
      },
    ],
  } as unknown as Doc<"cvs">;
}

describe("buildBrandingPayload", () => {
  it("returns empty has-flags when no data is present", () => {
    const out = buildBrandingPayload({
      profile: emptyProfile,
      cv: null,
      portfolio: [],
    });
    expect(out.has).toEqual({
      about: false,
      skills: false,
      experience: false,
      education: false,
      certifications: false,
      languages: false,
      projects: false,
      contact: false,
    });
  });

  it("flags `about` true when summary OR bio is present", () => {
    const withBio = buildBrandingPayload({
      profile: { ...emptyProfile, bio: "Hello" },
      cv: null,
      portfolio: [],
    });
    expect(withBio.has.about).toBe(true);

    const withSummary = buildBrandingPayload({
      profile: emptyProfile,
      cv: fullCv(),
      portfolio: [],
    });
    expect(withSummary.has.about).toBe(true);
    expect(withSummary.about.summary).toBe("Builds resilient frontends.");
  });

  it("merges profile + CV skills, dedups case-insensitively, profile-first", () => {
    const out = buildBrandingPayload({
      profile: { ...emptyProfile, skills: ["React", "Tailwind"] },
      cv: {
        ...fullCv(),
        skills: [
          { id: "1", name: "react" }, // dup of profile (case-insensitive)
          { id: "2", name: "Vite" },
        ],
      } as unknown as Doc<"cvs">,
      portfolio: [],
    });
    expect(out.skills).toEqual(["React", "Tailwind", "Vite"]);
  });

  it("maps experience entries with all fields and `current` boolean", () => {
    const out = buildBrandingPayload({
      profile: emptyProfile,
      cv: fullCv(),
      portfolio: [],
    });
    expect(out.experience).toHaveLength(1);
    expect(out.experience[0]).toMatchObject({
      company: "A",
      position: "Eng",
      startDate: "2022",
      endDate: "2024",
      current: false,
      description: "did stuff",
      achievements: ["shipped x", "led y"],
    });
  });

  it("maps education / certifications / languages from CV", () => {
    const out = buildBrandingPayload({
      profile: emptyProfile,
      cv: fullCv(),
      portfolio: [],
    });
    expect(out.education[0].institution).toBe("X Univ");
    expect(out.certifications[0].name).toBe("AWS SAA");
    expect(out.languages[0].language).toBe("Indonesian");
    expect(out.has.education).toBe(true);
    expect(out.has.certifications).toBe(true);
    expect(out.has.languages).toBe(true);
  });

  it("merges portfolio + CV projects, drops untitled entries", () => {
    const out = buildBrandingPayload({
      profile: emptyProfile,
      cv: fullCv(),
      portfolio: [
        {
          id: "port1",
          title: "Portfolio Item",
          description: "real",
          category: "design",
          link: "",
          date: "2024",
          techStack: ["Figma"],
          featured: true,
          coverEmoji: "🎨",
          coverGradient: null,
          coverUrl: null,
        },
        {
          id: "port2",
          title: "", // dropped
          description: "",
          category: "",
          link: "",
          date: "",
          techStack: [],
          featured: false,
          coverEmoji: null,
          coverGradient: null,
          coverUrl: null,
        },
      ],
    });
    // portfolio item + CV project; empty-title dropped.
    expect(out.projects).toHaveLength(2);
    expect(out.projects[0].title).toBe("Portfolio Item");
    expect(out.projects[1].title).toBe("Side Project");
    expect(out.has.projects).toBe(true);
  });

  it("contact has-flag is true when ANY of email/linkedin/portfolio set", () => {
    expect(
      buildBrandingPayload({
        profile: { ...emptyProfile, contactEmail: "x@y" },
        cv: null,
        portfolio: [],
      }).has.contact,
    ).toBe(true);
    expect(
      buildBrandingPayload({
        profile: { ...emptyProfile, linkedinUrl: "https://l" },
        cv: null,
        portfolio: [],
      }).has.contact,
    ).toBe(true);
    expect(
      buildBrandingPayload({
        profile: { ...emptyProfile, portfolioUrl: "https://p" },
        cv: null,
        portfolio: [],
      }).has.contact,
    ).toBe(true);
  });

  it("identity slot keys all carry through", () => {
    const out = buildBrandingPayload({
      profile: {
        fullName: "Rahman",
        publicHeadline: "FE Engineer",
        targetRole: "Senior FE",
        location: "Jakarta",
        bio: "",
        skills: [],
        avatarUrl: "https://a",
        contactEmail: "r@x.com",
        linkedinUrl: "https://l",
        portfolioUrl: "https://p",
      },
      cv: null,
      portfolio: [],
    });
    expect(out.identity).toEqual({
      name: "Rahman",
      headline: "FE Engineer",
      targetRole: "Senior FE",
      location: "Jakarta",
      avatarUrl: "https://a",
      contact: { email: "r@x.com", linkedin: "https://l", portfolio: "https://p" },
    });
  });
});
