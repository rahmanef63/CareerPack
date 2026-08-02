import { describe, it, expect } from "vitest";
import {
  scoreATS,
  flattenCVText,
  normalize,
  inferYearsOfExperience,
  fallbackExtractKeywords,
  type CVForScoring,
  type JDForScoring,
} from "./atsScore";

const reactCV: CVForScoring = {
  template: "classic",
  personalInfo: {
    summary:
      "Senior frontend engineer with 5 years building React + TypeScript apps. Performance, accessibility, design systems.",
  },
  skills: [
    { name: "React" },
    { name: "TypeScript" },
    { name: "Next.js" },
    { name: "Tailwind" },
  ],
  experience: [
    {
      position: "Senior Frontend Engineer",
      description: "Built dashboard for 100k+ users with React + Next.js.",
      achievements: [
        "Reduced bundle size by 35% through code splitting",
        "Mentored 4 junior engineers across 6 months",
      ],
      startDate: "2020-01",
      current: true,
    },
  ],
  education: [{ institution: "Universitas Indonesia", degree: "S1 Computer Science" }],
};

const reactJD: JDForScoring = {
  keywords: ["React", "TypeScript", "Next.js", "performance", "accessibility", "Tailwind"],
  hardSkills: ["React", "TypeScript", "Next.js"],
  seniority: "senior",
  minYears: 5,
};

describe("normalize", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalize("  React.JS  with   TypeScript! ")).toBe(
      "react.js with typescript",
    );
  });
});

describe("flattenCVText", () => {
  it("joins summary + skills + experience + education", () => {
    const text = flattenCVText(reactCV);
    expect(text).toContain("react");
    expect(text).toContain("typescript");
    expect(text).toContain("100k");
    expect(text).toContain("universitas indonesia");
  });
});

describe("inferYearsOfExperience", () => {
  it("counts open-ended current role until now", () => {
    const years = inferYearsOfExperience({
      experience: [{ position: "x", startDate: "2020-01", current: true }],
    });
    expect(years).toBeGreaterThanOrEqual(5);
  });
  it("returns 0 when no experience", () => {
    expect(inferYearsOfExperience({})).toBe(0);
  });
});

describe("scoreATS", () => {
  it("scores well-targeted React CV vs React JD as A grade", () => {
    const r = scoreATS(reactCV, reactJD);
    expect(r.grade).toBe("A");
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.matchedKeywords).toContain("react");
    expect(r.missingKeywords).not.toContain("react");
  });

  it("scores empty CV vs any JD as F grade", () => {
    const r = scoreATS({}, reactJD);
    expect(r.grade).toBe("F");
    expect(r.score).toBeLessThan(20);
  });

  it("flags Modern template as parseability concern", () => {
    const r = scoreATS({ ...reactCV, template: "modern" }, reactJD);
    expect(r.formatIssues.some((x) => /Modern/i.test(x))).toBe(true);
    expect(r.breakdown.parseability).toBeLessThan(10);
  });

  it("rewards quantified achievements", () => {
    const noNumbers = {
      ...reactCV,
      experience: [
        {
          ...reactCV.experience![0],
          achievements: ["Improved performance", "Mentored juniors"],
        },
      ],
    };
    const a = scoreATS(reactCV, reactJD);
    const b = scoreATS(noNumbers, reactJD);
    expect(a.breakdown.sectionCompleteness).toBeGreaterThan(
      b.breakdown.sectionCompleteness,
    );
  });

  it("recommends adding missing hard skills", () => {
    const cvWithoutNext: CVForScoring = {
      ...reactCV,
      skills: [{ name: "React" }, { name: "TypeScript" }],
      personalInfo: { summary: "Frontend engineer with React + TypeScript." },
      experience: [
        {
          position: "Frontend",
          description: "React app",
          achievements: ["Built UI"],
          startDate: "2020-01",
          current: true,
        },
      ],
    };
    const r = scoreATS(cvWithoutNext, reactJD);
    expect(
      r.recommendations.some((x) => /Next/i.test(x) || /skill wajib/i.test(x)),
    ).toBe(true);
  });

  it("100% match returns full keyword coverage", () => {
    const jd: JDForScoring = {
      keywords: ["react"],
      hardSkills: [],
    };
    const cv: CVForScoring = { skills: [{ name: "React" }] };
    const r = scoreATS(cv, jd);
    expect(r.matchedKeywords).toEqual(["react"]);
    expect(r.missingKeywords).toEqual([]);
  });

  it("zero-keyword JD does not divide by zero", () => {
    const r = scoreATS(reactCV, { keywords: [], hardSkills: [] });
    expect(Number.isFinite(r.score)).toBe(true);
  });
});

describe("fallbackExtractKeywords", () => {
  it("extracts top frequency tokens, skips stopwords", () => {
    const ks = fallbackExtractKeywords(
      "We need a React developer with React experience and Next.js. The candidate must know TypeScript.",
    );
    expect(ks).toContain("react");
    expect(ks).toContain("typescript");
    expect(ks).not.toContain("the");
    expect(ks).not.toContain("and");
  });

  it("respects limit", () => {
    const ks = fallbackExtractKeywords(
      Array.from({ length: 30 }, (_, i) => `word${i}`).join(" "),
      5,
    );
    expect(ks.length).toBeLessThanOrEqual(5);
  });
});
