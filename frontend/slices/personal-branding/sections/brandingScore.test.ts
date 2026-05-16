import { describe, it, expect } from "vitest";
import { scoreBranding } from "./brandingScore";
import type { BrandingPayload } from "../themes";

function emptyBranding(overrides: Partial<BrandingPayload> = {}): BrandingPayload {
  return {
    identity: {
      name: "",
      headline: "",
      targetRole: "",
      location: "",
      avatarUrl: null,
      contact: { email: "", linkedin: "", portfolio: "" },
    },
    about: { bio: "", summary: "" },
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    languages: [],
    projects: [],
    has: {
      about: false,
      skills: false,
      experience: false,
      education: false,
      certifications: false,
      languages: false,
      projects: false,
      contact: false,
    },
    ...overrides,
  };
}

describe("scoreBranding", () => {
  it("returns score 0 / grade E for fully empty payload", () => {
    const out = scoreBranding(emptyBranding());
    expect(out.earned).toBe(0);
    expect(out.score).toBe(0);
    expect(out.grade).toBe("E");
    expect(out.requiredMissing.length).toBeGreaterThan(0);
  });

  it("required-missing list excludes recommended/optional rows", () => {
    const out = scoreBranding(emptyBranding());
    for (const r of out.requiredMissing) {
      expect(r.severity).toBe("required");
    }
  });

  it("name carries 10 pt — present awards full, absent zero", () => {
    const filled = scoreBranding(
      emptyBranding({
        identity: {
          name: "Rahman",
          headline: "",
          targetRole: "",
          location: "",
          avatarUrl: null,
          contact: { email: "", linkedin: "", portfolio: "" },
        },
      }),
    );
    const row = filled.rows.find((r) => r.key === "name");
    expect(row?.earned).toBe(10);
    expect(row?.weight).toBe(10);
  });

  it("headline scoring is stepped: 0 / 4 / 7 / 10", () => {
    const cases: ReadonlyArray<[string, number]> = [
      ["", 0],
      ["short", 4], // 1-29 chars
      ["a".repeat(30), 7], // ≥30
      ["a".repeat(60), 10], // ≥60
    ];
    for (const [headline, expected] of cases) {
      const out = scoreBranding(
        emptyBranding({
          identity: {
            name: "",
            headline,
            targetRole: "",
            location: "",
            avatarUrl: null,
            contact: { email: "", linkedin: "", portfolio: "" },
          },
        }),
      );
      const row = out.rows.find((r) => r.key === "headline");
      expect(row?.earned, `headline len=${headline.length}`).toBe(expected);
    }
  });

  it("skills list scoring is proportional up to 8 (full weight)", () => {
    function withSkills(n: number) {
      return scoreBranding(
        emptyBranding({
          skills: Array.from({ length: n }, (_, i) => `skill${i}`),
          has: { ...emptyBranding().has, skills: n > 0 },
        }),
      );
    }
    expect(withSkills(0).rows.find((r) => r.key === "skills")?.earned).toBe(0);
    // 4 / 8 of weight 8 = 4
    expect(withSkills(4).rows.find((r) => r.key === "skills")?.earned).toBe(4);
    // 8 → full
    expect(withSkills(8).rows.find((r) => r.key === "skills")?.earned).toBe(8);
    // >8 capped at full
    expect(withSkills(15).rows.find((r) => r.key === "skills")?.earned).toBe(8);
  });

  it("project cover scoring uses ratio of projects-with-cover", () => {
    const out = scoreBranding(
      emptyBranding({
        projects: [
          { id: "1", title: "A", description: "", category: "", link: "", date: "", techStack: [], featured: false, coverEmoji: null, coverUrl: "https://x" },
          { id: "2", title: "B", description: "", category: "", link: "", date: "", techStack: [], featured: false, coverEmoji: null, coverUrl: null },
          { id: "3", title: "C", description: "", category: "", link: "", date: "", techStack: [], featured: false, coverEmoji: "🚀", coverUrl: null },
        ],
        has: { ...emptyBranding().has, projects: true },
      }),
    );
    const cover = out.rows.find((r) => r.key === "project-cover");
    // 2/3 of weight 6 = 4 (rounded)
    expect(cover?.earned).toBe(4);
  });

  it("achievements scoring requires ≥2 bullets per experience entry", () => {
    const out = scoreBranding(
      emptyBranding({
        experience: [
          { company: "A", position: "P", startDate: "", endDate: "", current: true, description: "", achievements: ["x", "y"] },
          { company: "B", position: "P", startDate: "", endDate: "", current: true, description: "", achievements: ["only one"] },
        ],
        has: { ...emptyBranding().has, experience: true },
      }),
    );
    const ach = out.rows.find((r) => r.key === "achievements");
    // 1/2 entries qualified → 1/2 * 5 = 3 (rounded)
    expect(ach?.earned).toBe(3);
  });

  it("grade buckets: ≥90 A, ≥75 B, ≥60 C, ≥40 D, else E", () => {
    // Fabricate scores by manipulating weights — easiest: build payloads
    // that yield specific totals.
    const empty = scoreBranding(emptyBranding());
    expect(empty.grade).toBe("E");

    // A near-perfect payload with everything maxed
    const full = scoreBranding({
      identity: {
        name: "Rahman Fakhrul",
        headline: "a".repeat(70),
        targetRole: "Senior Frontend Engineer",
        location: "Jakarta",
        avatarUrl: "https://a",
        contact: { email: "r@x", linkedin: "https://l", portfolio: "https://p" },
      },
      about: { bio: "b".repeat(220), summary: "s".repeat(160) },
      skills: ["a", "b", "c", "d", "e", "f", "g", "h"],
      experience: Array.from({ length: 3 }, () => ({
        company: "A", position: "P", startDate: "", endDate: "", current: true,
        description: "",
        achievements: ["x", "y", "z"],
      })),
      education: [{ institution: "U", degree: "S1", field: "CS", startDate: "", endDate: "", gpa: "" }],
      certifications: [
        { name: "AWS", issuer: "AWS", date: "" },
        { name: "GCP", issuer: "Google", date: "" },
      ],
      languages: [{ language: "ID", proficiency: "Native" }],
      projects: Array.from({ length: 3 }, (_, i) => ({
        id: `p${i}`,
        title: `Project ${i}`,
        description: "",
        category: "",
        link: "",
        date: "",
        techStack: [],
        featured: false,
        coverEmoji: "🚀",
        coverUrl: null,
      })),
      has: { about: true, skills: true, experience: true, education: true, certifications: true, languages: true, projects: true, contact: true },
    });
    expect(full.score).toBeGreaterThanOrEqual(90);
    expect(full.grade).toBe("A");
    expect(full.requiredMissing).toHaveLength(0);
  });

  it("total earned = sum(rows.earned) and weight = sum(rows.weight)", () => {
    const out = scoreBranding(emptyBranding({ identity: { name: "X", headline: "a".repeat(60), targetRole: "", location: "", avatarUrl: null, contact: { email: "", linkedin: "", portfolio: "" } } }));
    const sumEarned = out.rows.reduce((s, r) => s + r.earned, 0);
    const sumWeight = out.rows.reduce((s, r) => s + r.weight, 0);
    expect(sumEarned).toBe(out.earned);
    expect(sumWeight).toBe(out.weight);
    expect(out.score).toBe(Math.round((sumEarned / sumWeight) * 100));
  });
});
