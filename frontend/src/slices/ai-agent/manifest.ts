import { Bot } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * AI Agent slice — global FAB + chat console + slash dispatch +
 * approval cards. Owns the cross-slice agentic flow rather than a
 * dedicated dashboard URL. No `route` here because the console is a
 * portal mounted in `Providers.tsx`, not a routed page. Skills could
 * meta-introspect the agent (list chat sessions, clear history) but
 * those are accessible via the chat UI itself; exposing them as
 * agent-callable would risk recursion.
 */
export const aiAgentManifest: SliceManifest = {
  id: "ai-agent",
  label: "AI Agent",
  description: "Console chat + slash + agentic action dispatch",
  icon: Bot,
};
