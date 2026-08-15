/**
 * Per-section opt-in toggles for the public branding page.
 *
 * This file used to also hold `buildAutoBlocks` — a 250-line generator that
 * turned profile + CV + portfolio into a `Block[]` on every public page read.
 * Nothing rendered its output: the iframe templates hydrate from
 * `buildBrandingPayload` (brandingPayload.ts), and the block field was
 * dropped on the floor by both the public route and the editor preview. It
 * was deleted with the block builder (2026-08-15); the toggles stayed, since
 * they still gate what `buildBrandingPayload` emits.
 *
 * Imported by:
 * - convex/profile/queries.ts + brandingPayload.ts (server)
 * - frontend/slices/personal-branding/form/* (editor state)
 *
 * The filename is kept so those import paths don't churn.
 */

export interface AutoToggles {
  showExperience: boolean;
  showEducation: boolean;
  showCertifications: boolean;
  showProjects: boolean;
  showSocial: boolean;
  showLanguages: boolean;
}

/** Everything on by default — a new page shows whatever data exists. */
export const DEFAULT_AUTO_TOGGLES: AutoToggles = {
  showExperience: true,
  showEducation: true,
  showCertifications: true,
  showProjects: true,
  showSocial: true,
  showLanguages: true,
};
