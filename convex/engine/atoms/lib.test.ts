import { describe, it, expect } from "vitest";
import type { Id } from "../../_generated/dataModel";
import {
  atomHash,
  canonicalizeClaim,
  experienceAchievementRef,
  singletonRef,
} from "./lib";

const userId = "user_1" as unknown as Id<"users">;
const cvId = "cv_1" as unknown as Id<"cvs">;
const base = {
  userId,
  cvId,
  claim: "Led a team of 5 engineers",
  type: "achievement" as const,
  attestedAt: 1_700_000_000_000,
};

describe("canonicalizeClaim", () => {
  it("lowercases, trims, and collapses whitespace", () => {
    expect(canonicalizeClaim("  Led   a\tTEAM\n of 5  ")).toBe("led a team of 5");
  });

  it("strips zero-width characters", () => {
    expect(canonicalizeClaim("a​b‌‍c﻿")).toBe("abc");
  });

  it("preserves numbers and percentages verbatim", () => {
    expect(canonicalizeClaim("Grew revenue 25%")).toBe("grew revenue 25%");
    expect(canonicalizeClaim("Grew revenue 20%")).not.toBe(
      canonicalizeClaim("Grew revenue 25%"),
    );
  });
});

describe("atomHash", () => {
  it("is a 16-char hex string", () => {
    expect(atomHash(base)).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is deterministic for identical input", () => {
    expect(atomHash(base)).toBe(atomHash({ ...base }));
  });

  it("treats canonically-equal claims as the same atom", () => {
    expect(atomHash(base)).toBe(
      atomHash({ ...base, claim: "  led A TEAM of 5 ENGINEERS " }),
    );
  });

  it("changes when the claim's meaningful content changes", () => {
    expect(atomHash(base)).not.toBe(atomHash({ ...base, claim: "Led a team of 6 engineers" }));
  });

  it("changes with type, attestedAt, and sourceRef", () => {
    expect(atomHash(base)).not.toBe(atomHash({ ...base, type: "skill" }));
    expect(atomHash(base)).not.toBe(atomHash({ ...base, attestedAt: base.attestedAt + 1 }));
    expect(atomHash(base)).not.toBe(atomHash({ ...base, sourceRef: "skill:1" }));
  });

  it("separates fields so concatenation collisions don't occur", () => {
    // "ab"+"c" vs "a"+"bc" style: different sourceRef boundaries must differ.
    const a = atomHash({ ...base, sourceRef: "ab", claim: "c" });
    const b = atomHash({ ...base, sourceRef: "a", claim: "bc" });
    expect(a).not.toBe(b);
  });
});

describe("ref builders", () => {
  it("builds experience-achievement refs", () => {
    expect(experienceAchievementRef("exp1", 2)).toBe("experience:exp1:achievement:2");
  });

  it("builds singleton refs", () => {
    expect(singletonRef("skill", "s1")).toBe("skill:s1");
    expect(singletonRef("project", "p1")).toBe("project:p1");
  });
});
