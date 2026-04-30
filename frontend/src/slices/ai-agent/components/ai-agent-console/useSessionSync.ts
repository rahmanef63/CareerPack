"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@/shared/hooks/useAuth";
import { api } from "../../../../../../convex/_generated/api";
import type { AgentAction } from "@/shared/types/agent";
import {
  type ChatSession, type Message, MIGRATION_DONE_KEY, STORAGE_KEY,
  loadSessions, newSession,
} from "./types";

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
  const pendingUpserts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
          }).catch(() => null),
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
      }).catch(() => null);
    } else {
      const shells: ChatSession[] = serverSessions.map((s) => ({
        id: s.sessionId,
        title: s.title,
        messages: [],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
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
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
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
        }).catch(() => null);
        pendingUpserts.current.delete(s.id);
      }, 400);
      pendingUpserts.current.set(s.id, t);
    }
  }, [sessions, upsertSession]);

  const deleteSession = useCallback(
    (id: string) => {
      const pending = pendingUpserts.current.get(id);
      if (pending) {
        clearTimeout(pending);
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
