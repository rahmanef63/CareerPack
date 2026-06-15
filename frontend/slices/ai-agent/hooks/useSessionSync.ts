"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@/shared/hooks/useAuth";
import { api } from "../../../../convex/_generated/api";
import type { AgentAction } from "@/shared/types/agent";
import {
  type ChatSession, type Message, MIGRATION_DONE_KEY, STORAGE_KEY,
  loadSessions, newSession,
} from "../types/console";

/** Hydration + cross-device sync for chat sessions. */
export function useSessionSync() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  const { state: authState } = useAuth();
  const canWriteChat = authState.isAuthenticated;

  const serverSessions = useQuery(
    api.ai.queries.listChatSessions,
    canWriteChat ? {} : "skip",
  );
  const activeServerSession = useQuery(
    api.ai.queries.getChatSession,
    activeId && canWriteChat ? { sessionId: activeId } : "skip",
  );
  const upsertSessionRaw = useMutation(api.ai.mutations.upsertChatSession);
  const deleteSessionMutation = useMutation(api.ai.mutations.deleteChatSession);

  const upsertSession = useCallback(
    (args: Parameters<typeof upsertSessionRaw>[0]) => {
      if (!canWriteChat) return Promise.resolve(null);
      return upsertSessionRaw(args);
    },
    [upsertSessionRaw, canWriteChat],
  );

  const hydratedRef = useRef(false);
  const migratedRef = useRef(false);
  // Each entry keeps the live timer plus the bound upsert for that
  // session, so a still-pending transcript write can be flushed (not just
  // cancelled) when the console closes — otherwise the last AI turn that
  // landed inside the debounce window is dropped.
  const pendingUpserts = useRef<
    Map<string, { timer: ReturnType<typeof setTimeout>; run: () => void }>
  >(new Map());

  useEffect(() => {
    if (serverSessions === undefined) return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const alreadyMigrated =
      typeof window !== "undefined" &&
      window.localStorage.getItem(MIGRATION_DONE_KEY) === "1";
    const legacy = !alreadyMigrated ? loadSessions() : [];

    if (legacy.length > 0 && !migratedRef.current) {
      migratedRef.current = true;
      Promise.all(
        legacy.map((s) =>
          upsertSession({
            sessionId: s.id,
            title: s.title || "Percakapan",
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            messages: s.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.text,
              timestamp: m.ts,
              actions: m.actions?.map((a) => ({
                type: a.type,
                payload: a.payload,
                status: "pending" as const,
              })),
            })),
          }).catch((e) => {
            console.error("[chat-sync] migrate upsert failed", e);
            return null;
          }),
        ),
      ).finally(() => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(MIGRATION_DONE_KEY, "1");
          window.localStorage.removeItem(STORAGE_KEY);
        }
      });
      setSessions(legacy);
      setActiveId(legacy[0].id);
      return;
    }

    if (serverSessions.length === 0) {
      const fresh = newSession();
      setSessions([fresh]);
      setActiveId(fresh.id);
      upsertSession({
        sessionId: fresh.id,
        title: fresh.title,
        createdAt: fresh.createdAt,
        updatedAt: fresh.updatedAt,
        messages: fresh.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.text,
          timestamp: m.ts,
        })),
      }).catch((e) => {
        console.error("[chat-sync] fresh session upsert failed", e);
        return null;
      });
    } else {
      const shells: ChatSession[] = serverSessions.map((s) => ({
        id: s.sessionId,
        title: s.title,
        messages: [],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        // Denormalized metadata lets the history rail show the real count
        // before the transcript hydrates via getChatSession.
        messageCount: s.messageCount,
      }));
      setSessions(shells);
      setActiveId(shells[0].id);
    }
  }, [serverSessions, upsertSession]);

  // Merge server transcript into local state for the active session.
  useEffect(() => {
    if (!activeServerSession) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeServerSession.sessionId) return s;
        const localIds = new Set(s.messages.map((m) => m.id));
        const serverMsgs = activeServerSession.messages
          .filter((m) => !localIds.has(m.id))
          .map<Message>((m) => ({
            id: m.id,
            role: (m.role === "user" ? "user" : "assistant") as Message["role"],
            text: m.content,
            ts: m.timestamp,
            actions: m.actions?.map(
              (a) => ({ type: a.type, payload: a.payload }) as AgentAction,
            ),
          }));
        if (s.messages.length === 0 && serverMsgs.length > 0) {
          return {
            ...s,
            messages: serverMsgs,
            title: activeServerSession.title,
            createdAt: activeServerSession.createdAt,
            updatedAt: activeServerSession.updatedAt,
          };
        }
        return s;
      }),
    );
  }, [activeServerSession]);

  // Debounced upsert on local change.
  useEffect(() => {
    if (!hydratedRef.current) return;
    for (const s of sessions) {
      if (s.messages.length === 0) continue;
      const existing = pendingUpserts.current.get(s.id);
      if (existing) clearTimeout(existing.timer);
      // Capture this session's write so the timer and the unmount flush
      // persist the same snapshot.
      const run = () => {
        upsertSession({
          sessionId: s.id,
          title: s.title || "Percakapan",
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          messages: s.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.text,
            timestamp: m.ts,
            actions: m.actions?.map((a) => ({
              type: a.type,
              payload: a.payload,
              status: "pending" as const,
            })),
          })),
        }).catch((e) => {
          console.error("[chat-sync] debounced upsert failed", e);
          return null;
        });
      };
      const t = setTimeout(() => {
        pendingUpserts.current.delete(s.id);
        run();
      }, 400);
      pendingUpserts.current.set(s.id, { timer: t, run });
    }
  }, [sessions, upsertSession]);

  // Mount-only: flush every queued transcript write when the console
  // unmounts (route change / drawer close), so the final AI turn that
  // landed inside the debounce window is persisted instead of dropped.
  // Depends on nothing render-scoped, so it never re-runs mid-session.
  useEffect(() => {
    const timers = pendingUpserts.current;
    return () => {
      for (const { timer, run } of timers.values()) {
        clearTimeout(timer);
        run();
      }
      timers.clear();
    };
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      const pending = pendingUpserts.current.get(id);
      if (pending) {
        clearTimeout(pending.timer);
        pendingUpserts.current.delete(id);
      }
      deleteSessionMutation({ sessionId: id }).catch(() => null);
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (next.length === 0) {
          const fresh = newSession();
          setActiveId(fresh.id);
          return [fresh];
        }
        if (id === activeId) setActiveId(next[0].id);
        return next;
      });
    },
    [activeId, deleteSessionMutation],
  );

  return { sessions, setSessions, activeId, setActiveId, deleteSession };
}
