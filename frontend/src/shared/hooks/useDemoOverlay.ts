"use client";

/**
 * Demo overlay hooks — one per feature. Each persists to localStorage so
 * the anonymous demo session has a real-feeling sandbox without writing
 * to Convex. Components branch on `useIsDemo()` to swap their state
 * source between Convex queries and the matching `useDemo*Overlay` hook.
 *
 * Implementation lives in `useDemoOverlay/<feature>.ts`. This file is a
 * stable re-export aggregator so callers can keep importing from
 * `@/shared/hooks/useDemoOverlay`.
 */

import { useAuth } from "./useAuth";

/** True while the current session is the anonymous demo user. */
export function useIsDemo(): boolean {
  const { state } = useAuth();
  return state.isDemo;
}

export { useDemoApplicationsOverlay } from "./useDemoOverlay/applications";
export { useDemoPortfolioOverlay } from "./useDemoOverlay/portfolio";
export { useDemoContactsOverlay } from "./useDemoOverlay/contacts";
export { useDemoCVOverlay } from "./useDemoOverlay/cv";
export {
  useDemoAgendaOverlay,
  type DemoAgendaItem,
} from "./useDemoOverlay/agenda";
export { useDemoNotificationsOverlay } from "./useDemoOverlay/notifications";
export {
  useDemoChecklistOverlay,
  type DemoChecklistMap,
} from "./useDemoOverlay/checklist";
export {
  useDemoProfileOverlay,
  type DemoProfileState,
} from "./useDemoOverlay/profile";
export { useDemoPBOverlay } from "./useDemoOverlay/personalBranding";
