import type { SliceManifest, SliceSkill } from "@/shared/types/sliceManifest";
// Import each manifest from its `manifest.ts` file directly — NOT via the
// slice barrel `@/slices/<slice>`. Reason: ai-agent's barrel re-exports
// `AIAgentConsole` / `slashCommands` / `ApproveActionCard`, which import
// `ALL_SKILLS` / `SKILLS_BY_*` from THIS module. Going via the barrel
// would close the cycle and break with a `Cannot access X before
// initialization` TDZ error in production minified bundles. Direct
// `/manifest` imports keep this file's transitive graph at lucide +
// type-only — no React, no Convex, no slice components.
import { settingsManifest } from "@/slices/settings/manifest";
import { calendarManifest } from "@/slices/calendar/manifest";
import { careerDashboardManifest } from "@/slices/career-dashboard/manifest";
import { networkingManifest } from "@/slices/networking/manifest";
import { documentChecklistManifest } from "@/slices/document-checklist/manifest";
import { cvGeneratorManifest } from "@/slices/cv-generator/manifest";
import { skillRoadmapManifest } from "@/slices/skill-roadmap/manifest";
import { matcherManifest } from "@/slices/matcher/manifest";
import { mockInterviewManifest } from "@/slices/mock-interview/manifest";
import { financialCalculatorManifest } from "@/slices/financial-calculator/manifest";
import { portfolioManifest } from "@/slices/portfolio/manifest";
import { notificationsManifest } from "@/slices/notifications/manifest";
import { personalBrandingManifest } from "@/slices/personal-branding/manifest";
import { authManifest } from "@/slices/auth/manifest";
import { heroManifest } from "@/slices/hero/manifest";
import { dashboardHomeManifest } from "@/slices/dashboard-home/manifest";
import { aiAgentManifest } from "@/slices/ai-agent/manifest";
import { aiSettingsManifest } from "@/slices/ai-settings/manifest";
import { adminPanelManifest } from "@/slices/admin-panel/manifest";
import { libraryManifest } from "@/slices/library/manifest";
import { helpManifest } from "@/slices/help/manifest";
import { databaseManifest } from "@/slices/database/manifest";

/**
 * Central slice manifest registry — AI skill catalog only.
 *
 * One import per slice. To onboard a new slice's AI skills:
 * 1. Add `manifest.ts` in the slice folder.
 * 2. Export it via the slice's `index.ts` barrel.
 * 3. Add ONE line here: `import { fooManifest } from "@/slices/foo";`
 *    + an entry in the `SLICE_REGISTRY` array.
 *
 * Derived collections (ALL_SKILLS, SKILLS_BY_ID, SKILLS_BY_SLASH,
 * SLASH_SKILLS) are computed once at module load and exported for the
 * AI agent slash popover, approval cards, and the LLM system-prompt
 * brief. No runtime cost per render.
 *
 * Scope is the AI agent only. Routing and navigation do NOT read this
 * registry — routing is owned by `DASHBOARD_VIEWS`
 * (`shared/lib/dashboardRoutes.tsx`) and nav by `PRIMARY_NAV` /
 * `MORE_APPS` (`shared/components/layout/navConfig.ts`). Every slice is
 * still registered here (even skill-less ones) so the AI catalog has a
 * complete, single source of truth.
 */
export const SLICE_REGISTRY: ReadonlyArray<SliceManifest> = [
  settingsManifest,
  calendarManifest,
  careerDashboardManifest,
  networkingManifest,
  documentChecklistManifest,
  cvGeneratorManifest,
  skillRoadmapManifest,
  matcherManifest,
  mockInterviewManifest,
  financialCalculatorManifest,
  portfolioManifest,
  notificationsManifest,
  personalBrandingManifest,
  // Passive / route-only / minimal-skill slices.
  authManifest,
  heroManifest,
  dashboardHomeManifest,
  aiAgentManifest,
  aiSettingsManifest,
  adminPanelManifest,
  libraryManifest,
  helpManifest,
  databaseManifest,
];

/* ────────────────────────────────────────────────────────────────
 * Derived: AI skill catalog
 * ────────────────────────────────────────────────────────────── */

export const ALL_SKILLS: ReadonlyArray<SliceSkill> = SLICE_REGISTRY.flatMap(
  (s) => s.skills ?? [],
);

/** O(1) lookup by skill id. Used by ApproveActionCard for label/cta. */
export const SKILLS_BY_ID: ReadonlyMap<string, SliceSkill> = new Map(
  ALL_SKILLS.map((s) => [s.id, s]),
);

/** O(1) lookup by slash command (lowercased). */
export const SKILLS_BY_SLASH: ReadonlyMap<string, SliceSkill> = new Map(
  ALL_SKILLS
    .filter((s): s is SliceSkill & { slashCommand: string } => Boolean(s.slashCommand))
    .map((s) => [s.slashCommand.toLowerCase(), s]),
);

/** Skills that have a slash command — fed to the AI agent's slash
 *  popover. Sorted alphabetically for predictable UX. */
export const SLASH_SKILLS = ALL_SKILLS
  .filter((s) => s.slashCommand)
  .sort((a, b) => (a.slashCommand ?? "").localeCompare(b.slashCommand ?? ""));

/**
 * Compact skill list for the LLM system prompt. Format:
 *   `<skillId>: <description> [args: phone(string)]`
 * Truncates description to 120 chars to keep token cost predictable.
 */
export function llmSkillBrief(): string {
  if (ALL_SKILLS.length === 0) return "";
  const lines = ALL_SKILLS.map((s) => {
    const args = s.args
      ? ` [args: ${Object.entries(s.args)
          .map(([k, v]) => `${k}(${v.type}${v.required ? "" : "?"})`)
          .join(", ")}]`
      : "";
    const desc = s.description.length > 120 ? s.description.slice(0, 117) + "..." : s.description;
    return `- ${s.id}: ${desc}${args}`;
  });
  return lines.join("\n");
}
