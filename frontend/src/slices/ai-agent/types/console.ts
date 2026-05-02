import type { AgentAction } from "@/shared/types/agent";
import type { AIProgress } from "./progress";

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: AgentAction[];
  /** Server-measured agent run timeline. Only assistant messages
   *  carry it. Absent on legacy messages from before this field
   *  existed — UI must treat as optional. */
  progress?: AIProgress;
  ts: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export const STORAGE_KEY = "careerpack_ai_sessions";
export const MIGRATION_DONE_KEY = "careerpack_ai_sessions_migrated_v1";

export const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text:
    "Halo, saya **Asisten AI** CareerPack. Saya bisa **melakukan tindakan** di aplikasi ini — " +
    "auto-isi CV, buat roadmap, mulai simulasi wawancara, dan lain-lain. " +
    "Coba ketik `/` untuk melihat perintah, atau tanya bebas.",
  ts: Date.now(),
};

export function newSession(): ChatSession {
  const now = Date.now();
  return {
    id: `s-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: "Percakapan baru",
    messages: [WELCOME],
    createdAt: now,
    updatedAt: now,
  };
}

export function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
