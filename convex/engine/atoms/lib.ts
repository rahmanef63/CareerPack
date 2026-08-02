import type { Id } from "../../_generated/dataModel";

export type AtomType =
  | "achievement"
  | "skill"
  | "role"
  | "education"
  | "certification"
  | "project"
  | "summary";

export const ATOM_TYPES: readonly AtomType[] = [
  "achievement",
  "skill",
  "role",
  "education",
  "certification",
  "project",
  "summary",
] as const;

/**
 * Deterministic 64-bit FNV-1a hash → hex. Not cryptographically
 * collision-resistant but sufficient for atom dedup + ledger
 * fingerprinting at MVP scale (per-user keyspace). Phase 2 will swap
 * to crypto.subtle.digest("SHA-256", …) when the Merkle-root proofs
 * land.
 */
export function atomHash(input: {
  userId: Id<"users">;
  cvId: Id<"cvs">;
  claim: string;
  type: AtomType;
  sourceRef?: string;
  attestedAt: number;
}): string {
  const joined = [
    String(input.userId),
    String(input.cvId),
    input.type,
    input.sourceRef ?? "",
    input.attestedAt.toString(36),
    canonicalizeClaim(input.claim),
  ].join("|");

  // 64-bit FNV-1a, split into two 32-bit accumulators.
  let h1 = 0xcbf29ce4 >>> 0;
  let h2 = 0x84222325 >>> 0;
  for (let i = 0; i < joined.length; i++) {
    const c = joined.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c;
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  return (
    h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")
  );
}

/**
 * Canonical form for hash + dedup — strips zero-width whitespace,
 * collapses runs of whitespace, lower-cases. Preserves numbers /
 * percentages / dates verbatim so an atom whose only difference is
 * "20%" → "25%" hashes differently.
 */
export function canonicalizeClaim(claim: string): string {
  return claim
    .replace(/[​-‍﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Build the `sourceRef` string for an experience-achievement origin. */
export function experienceAchievementRef(
  experienceId: string,
  achievementIdx: number,
): string {
  return `experience:${experienceId}:achievement:${achievementIdx}`;
}

/** Build a `sourceRef` for a skill / project / certification origin. */
export function singletonRef(
  kind: "skill" | "project" | "certification" | "summary" | "role" | "education",
  id: string,
): string {
  return `${kind}:${id}`;
}
