"use client";

import { useMemo } from "react";
import {
  type SkillEntry,
  type UnlockedAchievement,
  type RoadmapTheme,
  classFromDomain,
  computeStreak,
  evaluateAchievements,
  levelFromXp,
  themeForDomain,
  totalXp,
  xpToNextLevel,
} from "../lib/gamification";

interface RoadmapShape {
  careerPath: string;
  skills: ReadonlyArray<SkillEntry>;
}

export interface GamificationStats {
  xp: number;
  level: number;
  pctToNext: number;
  xpFloor: number;
  xpCeil: number;
  completed: number;
  total: number;
  streak: number;
  domains: number;
  className: string;
  theme: RoadmapTheme;
  achievements: UnlockedAchievement[];
}

/**
 * Derive RPG-flavoured stats from a single roadmap doc. Pure-derived;
 * no extra Convex calls. Memoised on the skills array reference.
 *
 * Pass `domain` separately because the roadmap doc only carries a slug
 * (`careerPath`), and the domain comes from the joined template doc.
 */
export function useRoadmapGamification(
  roadmap: RoadmapShape | null | undefined,
  domain: string | null | undefined,
): GamificationStats {
  return useMemo(() => {
    const skills = roadmap?.skills ?? [];
    const completedSkills = skills.filter((s) => s.status === "completed");
    const xp = totalXp(skills);
    const level = levelFromXp(xp);
    const { current: xpFloor, next: xpCeil, pctToNext } = xpToNextLevel(xp);
    const streak = computeStreak(skills);

    // Distinct domains touched — for "Polymath" achievements + class.
    const domains = new Set<string>();
    for (const s of completedSkills) {
      if (s.category) domains.add(s.category);
    }

    const achievements = evaluateAchievements({
      completed: completedSkills.length,
      xp,
      streak,
      domains: domains.size,
    });

    return {
      xp,
      level,
      pctToNext,
      xpFloor,
      xpCeil,
      completed: completedSkills.length,
      total: skills.length,
      streak,
      domains: domains.size,
      className: classFromDomain(domain),
      theme: themeForDomain(domain),
      achievements,
    };
  }, [roadmap, domain]);
}
