"use client";

import type { AgentAction, AgentActionType } from "../types/agent";

/**
 * Generic action envelope. Compatible with the legacy `AgentAction`
 * discriminated union AND with manifest-driven `SkillAction` envelopes
 * whose `type` is a runtime-resolved skill id (e.g.
 * "settings.update-phone"). The bus stays string-keyed so adding a
 * new skill does not require touching this file or the legacy union.
 */
export interface BusAction<P = unknown> {
  type: string;
  payload: P;
}

type Listener = (action: BusAction) => void;

const listeners = new Map<string, Set<Listener>>();

/**
 * Subscribe to actions on the AI bus.
 *
 * Two overloads:
 * 1. Legacy: passing one of the `AgentActionType` literals (e.g.
 *    `"nav.go"`) narrows the callback param to the matching member of
 *    the `AgentAction` discriminated union — keeps existing slice
 *    subscribers fully typed without any caller change.
 * 2. Manifest skill: passing an arbitrary skill id (e.g.
 *    `"settings.update-phone"`) returns a `BusAction<P>` whose
 *    payload shape is whatever the caller declared via generic `P`.
 *    Use this from slice capability binders.
 *
 * `"*"` subscribes to all actions, payload typed as `unknown`.
 */
export function subscribe<T extends AgentActionType>(
  type: T,
  fn: (action: Extract<AgentAction, { type: T }>) => void,
): () => void;
export function subscribe<P = unknown>(
  type: string | "*",
  fn: (action: BusAction<P>) => void,
): () => void;
// Implementation signature uses `(action: never) => void` for the
// callback to accept both narrower-payload AgentAction subscribers
// AND wider BusAction<unknown> subscribers (param contravariance —
// `never` is the bottom type, so any function param shape is
// assignable to it). The bus only stores and dispatches functions;
// it never inspects payloads, so the loose impl typing is safe.
export function subscribe(
  type: string,
  fn: (action: never) => void,
): () => void {
  let bucket = listeners.get(type);
  if (!bucket) {
    bucket = new Set();
    listeners.set(type, bucket);
  }
  const wrapped = fn as Listener;
  bucket.add(wrapped);
  return () => {
    bucket?.delete(wrapped);
  };
}

export function publish(action: BusAction | AgentAction): void {
  listeners.get(action.type)?.forEach((fn) => fn(action as BusAction));
  listeners.get("*")?.forEach((fn) => fn(action as BusAction));
}
