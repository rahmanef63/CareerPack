import { describe, it, expect } from "vitest";
import {
  xpRequiredForLevel,
  levelFromXp,
  xpToNextLevel,
  totalXp,
  computeStreak,
  evaluateAchievements,
  XP_PER_HOUR,
  type SkillEntry,
} from "./gamification";

const DAY = 24 * 60 * 60 * 1000;
// Fixed reference "now" at local noon to keep day-boundary math stable.
const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime();

function completed(hours: number, completedAt?: number): SkillEntry {
  return { id: `${hours}-${completedAt ?? 0}`, status: "completed", estimatedHours: hours, category: "tech", completedAt };
}

describe("xpRequiredForLevel", () => {
  it("level ≤ 1 needs 0 XP", () => {
    expect(xpRequiredForLevel(1)).toBe(0);
    expect(xpRequiredForLevel(0)).toBe(0);
  });

  it("follows the triangular curve", () => {
    expect(xpRequiredForLevel(2)).toBe(100);
    expect(xpRequiredForLevel(3)).toBe(300);
    expect(xpRequiredForLevel(4)).toBe(600);
    expect(xpRequiredForLevel(5)).toBe(1000);
  });

  it("is strictly increasing", () => {
    for (let l = 2; l <= 20; l++) {
      expect(xpRequiredForLevel(l)).toBeGreaterThan(xpRequiredForLevel(l - 1));
    }
  });
});

describe("levelFromXp", () => {
  it("is always at least 1", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(-50)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
  });

  it("is the inverse of xpRequiredForLevel at each threshold", () => {
    for (let l = 2; l <= 20; l++) {
      expect(levelFromXp(xpRequiredForLevel(l))).toBe(l);
      // One XP below the threshold is still the previous level.
      expect(levelFromXp(xpRequiredForLevel(l) - 1)).toBe(l - 1);
    }
  });
});

describe("xpToNextLevel", () => {
  it("reports 0% right at a level threshold and <100% mid-level", () => {
    expect(xpToNextLevel(100).pctToNext).toBe(0); // exactly level 2
    const mid = xpToNextLevel(200); // between L2 (100) and L3 (300)
    expect(mid.current).toBe(100);
    expect(mid.next).toBe(300);
    expect(mid.pctToNext).toBe(50);
  });
});

describe("totalXp", () => {
  it("counts only completed skills × XP_PER_HOUR", () => {
    const skills: SkillEntry[] = [
      completed(10),
      { id: "x", status: "in-progress", estimatedHours: 99, category: "tech" },
      completed(5),
    ];
    expect(totalXp(skills)).toBe((10 + 5) * XP_PER_HOUR);
  });

  it("is 0 with nothing completed", () => {
    expect(totalXp([{ id: "x", status: "todo", estimatedHours: 10, category: "tech" }])).toBe(0);
  });
});

describe("computeStreak", () => {
  it("is 0 with no completions", () => {
    expect(computeStreak([], NOW)).toBe(0);
    expect(computeStreak([completed(5)], NOW)).toBe(0); // no completedAt
  });

  it("counts a single completion today as 1", () => {
    expect(computeStreak([completed(5, NOW)], NOW)).toBe(1);
  });

  it("counts consecutive days", () => {
    const skills = [completed(5, NOW), completed(5, NOW - DAY), completed(5, NOW - 2 * DAY)];
    expect(computeStreak(skills, NOW)).toBe(3);
  });

  it("allows today to be missing (counts from yesterday)", () => {
    const skills = [completed(5, NOW - DAY), completed(5, NOW - 2 * DAY)];
    expect(computeStreak(skills, NOW)).toBe(2);
  });

  it("breaks on a gap", () => {
    // today + 2 days ago, but yesterday missing → only today counts.
    const skills = [completed(5, NOW), completed(5, NOW - 2 * DAY)];
    expect(computeStreak(skills, NOW)).toBe(1);
  });

  it("dedups multiple completions on the same day", () => {
    const skills = [completed(5, NOW), completed(3, NOW)];
    expect(computeStreak(skills, NOW)).toBe(1);
  });
});

describe("evaluateAchievements", () => {
  it("unlocks tiered completion + level + streak badges by threshold", () => {
    const ids = (s: Parameters<typeof evaluateAchievements>[0]) =>
      new Set(evaluateAchievements(s).map((a) => a.id));

    const none = ids({ completed: 0, xp: 0, streak: 0, domains: 0 });
    expect(none.size).toBe(0);

    const some = ids({ completed: 5, xp: 1000, streak: 3, domains: 1 });
    expect(some.has("first-step")).toBe(true);
    expect(some.has("getting-started")).toBe(true);
    expect(some.has("dedicated")).toBe(false); // needs 10
    expect(some.has("level-5")).toBe(true); // xp 1000 = level 5
    expect(some.has("streak-3")).toBe(true);
    expect(some.has("streak-7")).toBe(false);
  });
});
