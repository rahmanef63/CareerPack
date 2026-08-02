"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export type LedgerAtomType =
  | "achievement"
  | "skill"
  | "role"
  | "education"
  | "certification"
  | "project"
  | "summary";

export interface LedgerAtom {
  _id: Id<"truthAtoms">;
  _creationTime: number;
  userId: Id<"users">;
  cvId: Id<"cvs">;
  claim: string;
  type: LedgerAtomType;
  sourceRef?: string;
  proofStorageId?: Id<"_storage">;
  hash: string;
  supersededBy?: Id<"truthAtoms">;
  attestedAt: number;
}

/**
 * Client surface for the Truth Ledger — the append-only, hash-
 * addressable substrate that the constrained rewriter is bound to.
 *
 * Pass a `cvId`. The hook resolves the active (non-superseded) atom
 * set + exposes mutations for bootstrap (`seed`), single-atom add,
 * supersession (edit-as-new-row), and hard delete.
 */
export function useTruthLedger(cvId: Id<"cvs"> | null | undefined) {
  const atomsRaw = useQuery(
    api.engine.atoms.queries.listByCv,
    cvId ? { cvId } : "skip",
  );

  const seedMutation = useMutation(api.engine.atoms.mutations.seedFromCV);
  const addMutation = useMutation(api.engine.atoms.mutations.add);
  const supersedeMutation = useMutation(
    api.engine.atoms.mutations.supersede,
  );
  const removeMutation = useMutation(api.engine.atoms.mutations.remove);

  const atoms = (atomsRaw ?? []) as LedgerAtom[];

  return {
    atoms,
    isLoading: cvId ? atomsRaw === undefined : false,
    isEmpty: cvId ? atomsRaw !== undefined && atoms.length === 0 : false,
    seed: cvId
      ? async () => await seedMutation({ cvId })
      : async () => ({ inserted: 0, skipped: 0 }),
    add: cvId
      ? async (input: {
          claim: string;
          type: LedgerAtomType;
          sourceRef?: string;
        }) => await addMutation({ cvId, ...input })
      : async () => {
          throw new Error("CV id wajib");
        },
    supersede: async (atomId: Id<"truthAtoms">, claim: string) =>
      await supersedeMutation({ atomId, claim }),
    remove: async (atomId: Id<"truthAtoms">) =>
      await removeMutation({ atomId }),
  };
}
