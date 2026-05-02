import type { SliceManifest, SliceSkill } from "@/shared/types/sliceManifest";
import { settingsManifest } from "@/slices/settings";

/**
 * Central slice manifest registry.
 *
 * One import per slice. To onboard a new slice:
 * 1. Add `manifest.ts` in the slice folder.
 * 2. Export it via the slice's `index.ts` barrel.
 * 3. Add ONE line here: `import { fooManifest } from "@/slices/foo";`
 *    + an entry in the `SLICE_REGISTRY` array.
 *
 * Derived collections (NAV_PRIMARY, NAV_MORE, ALL_SKILLS, …) are
 * computed once at module load and exported for nav components, the
 * AI agent slash popover, the catch-all router, etc. No runtime cost
 * per render.
 *
 * Phased migration (current state): only `settingsManifest` is here
 * yet. Existing nav still derives from `navConfig.ts`. As each slice
 * gains a manifest, this registry takes over and `navConfig.ts` will
 * be retired. Both can coexist during the transition — nav reads
 * `MORE_APPS` (legacy) and the AI agent reads `ALL_SKILLS` (new).
 */
export const SLICE_REGISTRY: ReadonlyArray<SliceManifest> = [
  settingsManifest,
  // future: cv-generator, skill-roadmap, mock-interview, matcher,
  // career-dashboard, networking, financial-calculator, … (one line
  // each as their manifests land).
];

/* ────────────────────────────────────────────────────────────────
 * Derived: navigation
 * ────────────────────────────────────────────────────────────── */

export const NAV_PRIMARY = SLICE_REGISTRY
  .filter((s) => s.nav?.placement === "primary")
  .sort((a, b) => (a.nav?.order ?? 0) - (b.nav?.order ?? 0));

export const NAV_MORE = SLICE_REGISTRY
  .filter((s) => s.nav?.placement === "more")
  .sort((a, b) => (a.nav?.order ?? 0) - (b.nav?.order ?? 0));

/** Resolve nav href for a slice, falling back to the convention. */
export function navHref(slice: SliceManifest): string {
  return slice.nav?.href ?? `/dashboard/${slice.id}`;
}

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
