import { describe, it, expect } from "vitest";
import {
  stripCodeFence,
  parseJsonOrThrow,
  readString,
  readNumber,
  readStringArray,
  coerceJobShape,
  coerceProfileShape,
} from "./aiOutput";

describe("stripCodeFence", () => {
  it("returns input unchanged when no fence present", () => {
    expect(stripCodeFence('{"a":1}')).toBe('{"a":1}');
  });

  it("strips ```json fenced block", () => {
    const input = '```json\n{"a":1}\n```';
    expect(stripCodeFence(input)).toBe('{"a":1}');
  });

  it("strips bare ``` fenced block", () => {
    const input = '```\n{"a":1}\n```';
    expect(stripCodeFence(input)).toBe('{"a":1}');
  });

  it("trims leading/trailing whitespace", () => {
    expect(stripCodeFence('   {"a":1}   ')).toBe('{"a":1}');
  });

  it("preserves internal whitespace inside fence", () => {
    const input = '```json\n{\n  "a": 1\n}\n```';
    expect(stripCodeFence(input)).toBe('{\n  "a": 1\n}');
  });

  it("handles upper-case JSON tag", () => {
    expect(stripCodeFence('```JSON\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("returns original for partial fence", () => {
    expect(stripCodeFence('```{"a":1}')).toBe('```{"a":1}');
  });
});

describe("parseJsonOrThrow", () => {
  it("parses fenced JSON", () => {
    expect(parseJsonOrThrow('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("parses bare JSON", () => {
    expect(parseJsonOrThrow('{"a":1}')).toEqual({ a: 1 });
  });

  it("throws localized message on invalid JSON", () => {
    expect(() => parseJsonOrThrow("not json")).toThrowError(
      /format JSON tidak valid/i,
    );
  });

  it("throws on empty fenced block", () => {
    expect(() => parseJsonOrThrow("```json\n```")).toThrow();
  });
});

describe("readString", () => {
  it("returns string value as-is", () => {
    expect(readString("hello")).toBe("hello");
  });

  it("returns empty string for non-string types", () => {
    expect(readString(42)).toBe("");
    expect(readString(null)).toBe("");
    expect(readString(undefined)).toBe("");
    expect(readString({ x: 1 })).toBe("");
    expect(readString([])).toBe("");
  });
});

describe("readNumber", () => {
  it("returns finite numbers as-is", () => {
    expect(readNumber(42)).toBe(42);
    expect(readNumber(0)).toBe(0);
    expect(readNumber(-1.5)).toBe(-1.5);
  });

  it("parses numeric strings", () => {
    expect(readNumber("42")).toBe(42);
    expect(readNumber("  42  ")).toBe(42);
    expect(readNumber("-3.14")).toBe(-3.14);
  });

  it("rejects non-numeric strings", () => {
    expect(readNumber("forty-two")).toBeUndefined();
    expect(readNumber("4.2.0")).toBeUndefined();
    expect(readNumber("4e2")).toBeUndefined();
    expect(readNumber("")).toBeUndefined();
  });

  it("rejects non-finite + non-string types", () => {
    expect(readNumber(NaN)).toBeUndefined();
    expect(readNumber(Infinity)).toBeUndefined();
    expect(readNumber(null)).toBeUndefined();
    expect(readNumber({})).toBeUndefined();
    expect(readNumber([])).toBeUndefined();
  });
});

describe("readStringArray", () => {
  it("returns array of valid strings", () => {
    expect(readStringArray(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("filters non-strings + empty strings", () => {
    expect(readStringArray(["a", 1, null, "", "  ", "b"])).toEqual(["a", "b"]);
  });

  it("returns empty array for non-array", () => {
    expect(readStringArray("not array")).toEqual([]);
    expect(readStringArray(null)).toEqual([]);
    expect(readStringArray(undefined)).toEqual([]);
    expect(readStringArray({ a: 1 })).toEqual([]);
  });

  it("handles AI-returned realistic skills array", () => {
    const aiOutput = ["React", "TypeScript", "  Next.js  ", null, "", "Node.js"];
    expect(readStringArray(aiOutput)).toEqual([
      "React",
      "TypeScript",
      "  Next.js  ",
      "Node.js",
    ]);
  });
});

describe("coerceJobShape", () => {
  it("returns full default shape for empty input", () => {
    expect(coerceJobShape({})).toEqual({
      title: "",
      company: "",
      location: "",
      workMode: "onsite",
      employmentType: "full-time",
      seniority: "mid-level",
      salaryMin: null,
      salaryMax: null,
      currency: null,
      description: "",
      requiredSkills: [],
      applyUrl: null,
    });
  });

  it("passes well-formed AI output through", () => {
    const aiOutput = {
      title: "Senior React Engineer",
      company: "Acme",
      location: "Jakarta",
      workMode: "remote",
      employmentType: "full-time",
      seniority: "senior",
      salaryMin: 20000000,
      salaryMax: 35000000,
      currency: "IDR",
      description: "Build product UI.",
      requiredSkills: ["React", "TypeScript", "Next.js"],
      applyUrl: "https://acme.example/jobs/1",
    };
    expect(coerceJobShape(aiOutput)).toEqual(aiOutput);
  });

  it("rejects unknown enum values, falls back to default", () => {
    const aiOutput = {
      title: "Dev",
      company: "Acme",
      location: "Remote",
      workMode: "TELEWORK",
      employmentType: "freelance",
      seniority: "rockstar",
      currency: "GBP",
    };
    const out = coerceJobShape(aiOutput);
    expect(out.workMode).toBe("onsite");
    expect(out.employmentType).toBe("full-time");
    expect(out.seniority).toBe("mid-level");
    expect(out.currency).toBeNull();
  });

  it("coerces salary as numeric string", () => {
    const out = coerceJobShape({ salaryMin: "5000000", salaryMax: "10000000" });
    expect(out.salaryMin).toBe(5000000);
    expect(out.salaryMax).toBe(10000000);
  });

  it("falls back to null when salary unparseable", () => {
    const out = coerceJobShape({ salaryMin: "competitive", salaryMax: null });
    expect(out.salaryMin).toBeNull();
    expect(out.salaryMax).toBeNull();
  });

  it("filters non-string skills", () => {
    const out = coerceJobShape({ requiredSkills: ["React", 42, null, "TypeScript", ""] });
    expect(out.requiredSkills).toEqual(["React", "TypeScript"]);
  });

  it("nullifies empty applyUrl string", () => {
    expect(coerceJobShape({ applyUrl: "" }).applyUrl).toBeNull();
    expect(coerceJobShape({ applyUrl: 0 }).applyUrl).toBeNull();
  });

  it("survives null/undefined/non-object input", () => {
    expect(() => coerceJobShape(null)).not.toThrow();
    expect(() => coerceJobShape(undefined)).not.toThrow();
    expect(() => coerceJobShape("not an object")).not.toThrow();
    expect(() => coerceJobShape([1, 2, 3])).not.toThrow();
  });

  it("handles full snapshot of realistic AI reply", () => {
    const raw = `{
      "title": "Junior Backend Engineer",
      "company": "GoTo",
      "location": "Jakarta, Indonesia",
      "workMode": "hybrid",
      "employmentType": "full-time",
      "seniority": "junior",
      "salaryMin": 8000000,
      "salaryMax": 14000000,
      "currency": "IDR",
      "description": "Build payment infra.",
      "requiredSkills": ["Go", "PostgreSQL", "Kafka"],
      "applyUrl": "https://gotocompany.com/careers/123"
    }`;
    const parsed = parseJsonOrThrow(raw);
    expect(coerceJobShape(parsed)).toMatchSnapshot();
  });

  it("handles fenced markdown reply end-to-end", () => {
    const fenced = '```json\n{"title":"Eng","company":"X","location":"Bandung","workMode":"onsite","seniority":"junior"}\n```';
    const parsed = parseJsonOrThrow(fenced);
    const shape = coerceJobShape(parsed);
    expect(shape.title).toBe("Eng");
    expect(shape.workMode).toBe("onsite");
    expect(shape.seniority).toBe("junior");
  });
});

describe("coerceProfileShape", () => {
  it("returns full default shape for empty input", () => {
    expect(coerceProfileShape({})).toEqual({
      profile: {
        fullName: "",
        phone: "",
        location: "",
        targetRole: "",
        experienceLevel: "mid-level",
        bio: "",
        skills: [],
        interests: [],
      },
    });
  });

  it("accepts root-level profile object (AI shape)", () => {
    const aiOutput = {
      profile: {
        fullName: "Jane Smith",
        phone: "+628123",
        location: "Bali, Indonesia",
        targetRole: "Frontend Engineer",
        experienceLevel: "senior",
        bio: "10 yrs of UX",
        skills: ["React"],
        interests: ["yoga"],
      },
    };
    expect(coerceProfileShape(aiOutput)).toEqual(aiOutput);
  });

  it("accepts flat object (no profile wrapper) — AI sometimes drops it", () => {
    const aiOutput = {
      fullName: "Jane",
      location: "Jakarta",
      targetRole: "PM",
      experienceLevel: "mid-level",
      skills: ["Roadmaps"],
    };
    const out = coerceProfileShape(aiOutput);
    expect(out.profile.fullName).toBe("Jane");
    expect(out.profile.location).toBe("Jakarta");
    expect(out.profile.skills).toEqual(["Roadmaps"]);
  });

  it("rejects unknown experienceLevel, falls back to mid-level", () => {
    const out = coerceProfileShape({ profile: { experienceLevel: "wizard" } });
    expect(out.profile.experienceLevel).toBe("mid-level");
  });

  it("survives null/undefined/non-object input", () => {
    expect(() => coerceProfileShape(null)).not.toThrow();
    expect(() => coerceProfileShape(undefined)).not.toThrow();
    expect(() => coerceProfileShape("not an object")).not.toThrow();
  });
});
