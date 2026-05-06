/**
 * AgentAction contract — shared between the AI agent (publisher) and
 * every slice that subscribes via the aiActionBus.
 *
 * As of 2026-05-06, the only typed action is `nav.go` — the AI's
 * navigate primitive that every slash command + nav-link can emit.
 * All other actions are manifest-driven (`<sliceId>.<verb>`) and flow
 * as generic `{ type: string; payload: unknown }` envelopes through
 * the bus, validated and dispatched by each slice's `*Capabilities`
 * binder.
 *
 * Old discriminated arms (`cv.fillExperience`, `roadmap.generate`,
 * `match.recommend`, …) have been removed — they were emitted only
 * by the legacy `runAgent()` slash heuristic with no real backend
 * listener. See [docs/progress/2026-05-06-ai-dispatch-audit.md].
 */

export type AgentAction = {
  type: "nav.go";
  payload: { view: string };
};

export type AgentActionType = AgentAction["type"];

export interface AgentActionMeta {
  label: string;
  description: string;
  cta: string;
}

export const AGENT_ACTION_META: Record<AgentActionType, AgentActionMeta> = {
  "nav.go": {
    label: "Buka Halaman",
    description: "Pindah ke halaman terkait.",
    cta: "Buka",
  },
};
