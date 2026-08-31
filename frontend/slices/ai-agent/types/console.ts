import type { AgentAction } from "@/shared/types/agent";
import type { AIProgress } from "./progress";

/** Whether the user has already acted on a proposed action. Persisted so an
 *  approved card does not re-arm itself after a reload or a history switch —
 *  clicking it again used to fire the mutation a second time. */
export type ActionStatus = "pending" | "approved" | "rejected";

export type StoredAction = AgentAction & { status?: ActionStatus };

export type AttachmentKind = "image" | "document";

export interface MessageAttachment {
  kind: AttachmentKind;
  fileName: string;
  /** Convex storage id — lets a reloaded session re-resolve a signed URL via
   *  `files.queries.getFileUrl`. Absent while still uploading. */
  storageId?: string;
  /** Local object URL, valid only in the tab that created it — never sent to
   *  the server, never persisted. Used for an instant preview before the
   *  upload (or a reload) hands back a real `storageId`. */
  previewUrl?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: StoredAction[];
  /** Files the user attached to this turn. Metadata only — the pixel data /
   *  extracted text that reached the model is never stored (see
   *  ai/schema.ts's `attachments` comment). */
  attachments?: MessageAttachment[];
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
  /** Denormalized count from the server list query, used to render the
   *  history rail without hydrating the full transcript. Absent on
   *  locally-created sessions (fall back to `messages.length`). */
  messageCount?: number;
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
    id: `s-${crypto.randomUUID()}`,
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
