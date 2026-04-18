/**
 * Re-export from shared — `AgentAction` is the cross-slice contract so it
 * lives under `@/slices/shared/types/agent`. This file stays for backward
 * compatibility with in-slice imports.
 */

export {
  AGENT_ACTION_META as ACTION_META,
  type AgentAction,
  type AgentActionType,
  type AgentActionMeta,
} from "@/slices/shared/types/agent";
