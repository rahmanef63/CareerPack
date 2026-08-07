/**
 * Folding user decisions back into the write payload.
 *
 * This stays trivial because `buildMergePlan` already put the complete final
 * value into `draft` for every array and object that has any addition or any
 * conflict. So `{ on: "cvArray", array, index, value }` always lands on an
 * array that exists, and three conflicts on the same array write three
 * distinct indices and cannot clobber each other.
 */

import type { CVArrayItem, MergePlan, Side, WritePayload } from "./types";

/**
 * Clone `draft`; for each conflict the user resolved to `"theirs"`, write its
 * `apply` into place. A missing decision means `"mine"`, which is a no-op, so
 * reviewing 2 of 5 conflicts and saving is non-lossy. An unknown decision id
 * is ignored. Total and pure — never throws.
 */
export function applyDecisions(
  plan: MergePlan,
  decisions: Readonly<Record<string, Side>>,
): WritePayload {
  const out = structuredClone(plan.draft) as WritePayload;

  for (const conflict of plan.conflicts) {
    if (decisions[conflict.id] !== "theirs") continue;
    const apply = conflict.apply;

    if (apply.on === "profile") {
      out.profile[apply.field] = apply.value;
      continue;
    }
    if (apply.on === "cvPersonal") {
      if (out.cv.personalInfo) out.cv.personalInfo[apply.field] = apply.value;
      continue;
    }

    const target = out.cv[apply.array] as CVArrayItem[] | undefined;
    if (!target || apply.index < 0 || apply.index >= target.length) continue;
    target[apply.index] = structuredClone(apply.value);
  }

  return out;
}

/** Whether the payload would write anything at all. Drives the "Tidak ada
 *  perubahan — CV ini sudah sinkron" branch, which fires no mutation. */
export function hasChanges(p: WritePayload): boolean {
  return Object.keys(p.profile).length > 0 || p.createCv || Object.keys(p.cv).length > 0;
}
