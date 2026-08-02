/**
 * Pure gamification math — no React, no DB. Takes the shape of a
 * `skillRoadmaps` doc + completion set and derives RPG-flavoured stats:
 * XP, level, streak, achievements, class.
 *
 * Single roadmap per user (current schema), so stats reflect the active
 * roadmap. When the user switches careerPath the previous progress is
 * replaced, not preserved — this is a known limitation of the current
 * data model and OK for v1 of gamification.
 */

export interface SkillEntry {
  id: string;
  status: string;
  estimatedHours: number;
  category: string;
  completedAt?: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;     // lucide name
  tier: "bronze" | "silver" | "gold" | "legendary";
}

export interface UnlockedAchievement extends AchievementDef {
  unlockedAt: number;
}

// XP granted per estimated hour of a completed topic. Picked so that a
// 30h topic = 300 XP, hitting level 2 (200 XP) by the second topic.
export const XP_PER_HOUR = 10;

/** Triangular leveling curve: 100 XP for L1, 300 cumulative for L2, etc. */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round((100 * (level - 1) * level) / 2);
}

/** Inverse — return the level for a given total XP. Always ≥ 1. */
export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  // Solve L*(L-1)/2 * 100 ≤ xp → L ≤ (1 + sqrt(1 + 8*xp/100)) / 2
  return Math.floor((1 + Math.sqrt(1 + (8 * xp) / 100)) / 2);
}

/** XP needed to reach the next level from the current total. */
export function xpToNextLevel(xp: number): { current: number; next: number; pctToNext: number } {
  const lvl = levelFromXp(xp);
  const current = xpRequiredForLevel(lvl);
  const next = xpRequiredForLevel(lvl + 1);
  const span = Math.max(1, next - current);
  return {
    current,
    next,
    pctToNext: Math.min(100, Math.round(((xp - current) / span) * 100)),
  };
}

/** Total XP from completed skill entries. */
export function totalXp(skills: ReadonlyArray<SkillEntry>): number {
  return skills
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.estimatedHours * XP_PER_HOUR, 0);
}

/**
 * Streak = consecutive days, walking BACKWARDS from today, with at least
 * one `completedAt` falling in that calendar day. Caps at 365 to avoid
 * pathological loops if a clock skews.
 */
export function computeStreak(skills: ReadonlyArray<SkillEntry>, now = Date.now()): number {
  const days = new Set<string>();
  for (const s of skills) {
    if (!s.completedAt) continue;
    const d = new Date(s.completedAt);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  if (days.size === 0) return 0;

  let streak = 0;
  const cursor = new Date(now);
  for (let i = 0; i < 365; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (days.has(key)) {
      streak++;
    } else if (streak > 0 || i > 0) {
      // Allow today to be missing without breaking yesterday's streak.
      if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ---- Achievements ------------------------------------------------------

export const ACHIEVEMENT_DEFS: ReadonlyArray<{
  def: AchievementDef;
  test: (s: { completed: number; xp: number; streak: number; domains: number }) => boolean;
}> = [
  { def: { id: "first-step", title: "Langkah Pertama", description: "Selesaikan 1 topik", icon: "Footprints", tier: "bronze" }, test: (s) => s.completed >= 1 },
  { def: { id: "getting-started", title: "Pemanasan", description: "Selesaikan 5 topik", icon: "Flame", tier: "bronze" }, test: (s) => s.completed >= 5 },
  { def: { id: "dedicated", title: "Konsisten", description: "Selesaikan 10 topik", icon: "Target", tier: "silver" }, test: (s) => s.completed >= 10 },
  { def: { id: "warrior", title: "Pejuang", description: "Selesaikan 25 topik", icon: "Swords", tier: "silver" }, test: (s) => s.completed >= 25 },
  { def: { id: "master", title: "Master", description: "Selesaikan 50 topik", icon: "Crown", tier: "gold" }, test: (s) => s.completed >= 50 },
  { def: { id: "legend", title: "Legenda", description: "Selesaikan 100 topik", icon: "Trophy", tier: "legendary" }, test: (s) => s.completed >= 100 },
  { def: { id: "level-5", title: "Level 5", description: "Capai Level 5", icon: "Star", tier: "silver" }, test: (s) => levelFromXp(s.xp) >= 5 },
  { def: { id: "level-10", title: "Level 10", description: "Capai Level 10", icon: "Sparkles", tier: "gold" }, test: (s) => levelFromXp(s.xp) >= 10 },
  { def: { id: "streak-3", title: "Tiga Hari", description: "Belajar 3 hari beruntun", icon: "Zap", tier: "bronze" }, test: (s) => s.streak >= 3 },
  { def: { id: "streak-7", title: "Seminggu Penuh", description: "Belajar 7 hari beruntun", icon: "FlameKindling", tier: "gold" }, test: (s) => s.streak >= 7 },
];

export function evaluateAchievements(stats: {
  completed: number;
  xp: number;
  streak: number;
  domains: number;
}): UnlockedAchievement[] {
  const now = Date.now();
  return ACHIEVEMENT_DEFS
    .filter(({ test }) => test(stats))
    .map(({ def }) => ({ ...def, unlockedAt: now }));
}

// ---- Class title -------------------------------------------------------

const CLASS_BY_DOMAIN: Record<string, string> = {
  tech: "Hacker",
  business: "Strategist",
  creative: "Artisan",
  education: "Mentor",
  health: "Healer",
  finance: "Banker",
  hr: "Diplomat",
  operations: "Engineer",
  government: "Officer",
  social: "Advocate",
  hospitality: "Host",
};

export function classFromDomain(domain: string | undefined | null): string {
  if (!domain) return "Apprentice";
  return CLASS_BY_DOMAIN[domain] ?? "Apprentice";
}

// ---- Theme -------------------------------------------------------------

export interface RoadmapTheme {
  name: string;
  primary: string;   // tailwind class for primary surface
  glow: string;      // tailwind class for glow effect
  accentText: string;
}

const THEME_BY_DOMAIN: Record<string, RoadmapTheme> = {
  tech:        { name: "Cyber",     primary: "from-blue-500 to-cyan-500",       glow: "shadow-[0_0_20px_-2px_rgb(59_130_246/0.5)]",  accentText: "text-blue-500"   },
  business:    { name: "Empire",    primary: "from-amber-500 to-yellow-500",    glow: "shadow-[0_0_20px_-2px_rgb(245_158_11/0.5)]",  accentText: "text-amber-500"  },
  creative:    { name: "Atelier",   primary: "from-purple-500 to-pink-500",     glow: "shadow-[0_0_20px_-2px_rgb(168_85_247/0.5)]",  accentText: "text-purple-500" },
  education:   { name: "Academy",   primary: "from-indigo-500 to-blue-500",     glow: "shadow-[0_0_20px_-2px_rgb(99_102_241/0.5)]",  accentText: "text-indigo-500" },
  health:      { name: "Sanctuary", primary: "from-rose-500 to-red-500",        glow: "shadow-[0_0_20px_-2px_rgb(244_63_94/0.5)]",   accentText: "text-rose-500"   },
  finance:     { name: "Vault",     primary: "from-emerald-500 to-teal-500",    glow: "shadow-[0_0_20px_-2px_rgb(16_185_129/0.5)]",  accentText: "text-emerald-500"},
  hr:          { name: "Council",   primary: "from-violet-500 to-purple-500",   glow: "shadow-[0_0_20px_-2px_rgb(139_92_246/0.5)]",  accentText: "text-violet-500" },
  operations:  { name: "Workshop",  primary: "from-orange-500 to-amber-500",    glow: "shadow-[0_0_20px_-2px_rgb(249_115_22/0.5)]",  accentText: "text-orange-500" },
  government:  { name: "Hall",      primary: "from-slate-500 to-gray-500",      glow: "shadow-[0_0_20px_-2px_rgb(100_116_139/0.5)]", accentText: "text-slate-500"  },
  social:      { name: "Outreach",  primary: "from-pink-500 to-rose-500",       glow: "shadow-[0_0_20px_-2px_rgb(236_72_153/0.5)]",  accentText: "text-pink-500"   },
  hospitality: { name: "Lounge",    primary: "from-fuchsia-500 to-pink-500",    glow: "shadow-[0_0_20px_-2px_rgb(217_70_239/0.5)]",  accentText: "text-fuchsia-500"},
};

export function themeForDomain(domain: string | undefined | null): RoadmapTheme {
  if (!domain) return THEME_BY_DOMAIN.tech;
  return THEME_BY_DOMAIN[domain] ?? THEME_BY_DOMAIN.tech;
}
