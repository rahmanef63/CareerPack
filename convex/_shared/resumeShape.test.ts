import { describe, it, expect } from "vitest";
import { coerceResumeShape } from "./resumeShape";

describe("coerceResumeShape — omit, never default", () => {
  it("drops every empty, whitespace-only and empty-array field", () => {
    const out = coerceResumeShape({
      fullName: "",
      email: "   ",
      phone: "\n\t ",
      location: null,
      summary: 42,
      skills: [],
      interests: ["", "  "],
      experience: [],
      languages: [],
    });
    expect(out).toEqual({});
    expect(Object.keys(out)).toHaveLength(0);
    expect("fullName" in out).toBe(false);
    expect("skills" in out).toBe(false);
  });

  it("never invents an experienceLevel", () => {
    expect(coerceResumeShape({ fullName: "Budi" }).experienceLevel).toBeUndefined();
    expect(coerceResumeShape({ experienceLevel: "sangat senior" }).experienceLevel).toBeUndefined();
    expect(coerceResumeShape({ experienceLevel: "SENIOR" }).experienceLevel).toBe("senior");
  });

  it("keeps real values, including the line structure of long text", () => {
    const out = coerceResumeShape({
      fullName: "  Budi Santoso ",
      summary: "Backend engineer.\nJakarta.",
      skills: ["React", "", "Node.js"],
    });
    expect(out).toEqual({
      fullName: "Budi Santoso",
      summary: "Backend engineer.\nJakarta.",
      skills: ["React", "Node.js"],
    });
  });
});

describe("coerceResumeShape — rows", () => {
  it("drops rows missing their identity field", () => {
    const out = coerceResumeShape({
      experience: [{ company: "Tokopedia", position: "BE" }, { position: "FE" }, { company: "  " }],
      education: [{ institution: "ITB" }, { degree: "S1" }],
      certifications: [{ name: "AWS SAA" }, { issuer: "AWS" }],
      languages: [{ language: "Indonesia" }, { proficiency: "Native" }],
      projects: [{ name: "CareerPack" }, { description: "x" }],
    });
    expect(out.experience).toEqual([{ company: "Tokopedia", position: "BE" }]);
    expect(out.education).toEqual([{ institution: "ITB" }]);
    expect(out.certifications).toEqual([{ name: "AWS SAA" }]);
    expect(out.languages).toEqual([{ language: "Indonesia" }]);
    expect(out.projects).toEqual([{ name: "CareerPack" }]);
  });

  it("caps arrays at 60 rows", () => {
    const out = coerceResumeShape({
      skills: Array.from({ length: 90 }, (_, i) => `skill-${i}`),
      experience: Array.from({ length: 90 }, (_, i) => ({ company: `PT ${i}` })),
    });
    expect(out.skills).toHaveLength(60);
    expect(out.experience).toHaveLength(60);
    expect(out.experience?.[59]).toEqual({ company: "PT 59" });
  });

  it("keeps `current` only when it really is a boolean", () => {
    const out = coerceResumeShape({
      experience: [
        { company: "A", current: true },
        { company: "B", current: "yes" },
      ],
    });
    expect(out.experience?.[0].current).toBe(true);
    expect("current" in (out.experience?.[1] ?? {})).toBe(false);
  });
});

describe("coerceResumeShape — input shapes", () => {
  it("reads a bare object and a `{ profile: … }` wrapper alike", () => {
    const bare = coerceResumeShape({ fullName: "Budi", skills: ["Go"] });
    const nested = coerceResumeShape({ profile: { fullName: "Budi", skills: ["Go"] } });
    expect(bare).toEqual({ fullName: "Budi", skills: ["Go"] });
    expect(nested).toEqual(bare);
  });

  it("reads a wrapper whose arrays stayed at the root", () => {
    const out = coerceResumeShape({
      profile: { fullName: "Budi" },
      experience: [{ company: "Tokopedia" }],
    });
    expect(out).toEqual({ fullName: "Budi", experience: [{ company: "Tokopedia" }] });
  });

  it("does not let a blank wrapper field erase the root's real one", () => {
    const out = coerceResumeShape({
      fullName: "Budi",
      skills: ["Go"],
      profile: { fullName: "", skills: [], location: "Jakarta" },
    });
    expect(out).toEqual({ fullName: "Budi", skills: ["Go"], location: "Jakarta" });
  });

  it("returns {} for junk instead of throwing", () => {
    expect(coerceResumeShape(null)).toEqual({});
    expect(coerceResumeShape("x")).toEqual({});
    expect(coerceResumeShape([])).toEqual({});
    expect(coerceResumeShape(undefined)).toEqual({});
  });
});
