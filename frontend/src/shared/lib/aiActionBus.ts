"use client";

import type { AgentAction, AgentActionType } from "@/features/ai-agent/lib/agentActions";

type Listener<T extends AgentAction = AgentAction> = (action: T) => void;

const listeners = new Map<AgentActionType | "*", Set<Listener>>();

export function subscribe<T extends AgentAction = AgentAction>(
  type: AgentActionType | "*",
  fn: Listener<T>
): () => void {
  let bucket = listeners.get(type);
  if (!bucket) {
    bucket = new Set();
    listeners.set(type, bucket);
  }
  bucket.add(fn as Listener);
  return () => {
    bucket?.delete(fn as Listener);
  };
}

export function publish(action: AgentAction): void {
  listeners.get(action.type)?.forEach((fn) => fn(action));
  listeners.get("*")?.forEach((fn) => fn(action));
}
