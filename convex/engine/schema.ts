import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Engine domain — proprietary career-state primitives.
 *
 * The `engine/*` namespace owns logic that is *uniquely ours*: the
 * Truth Ledger, ID Career Graph, Outcome Feed, and Quest entity.
 * Each module composes on top of the existing slice schemas (cv,
 * matcher, roadmap, ...) without replacing them — the slices remain
 * the user-facing "view layer", the engine adds the substrate
 * Notion / ChatGPT cannot replicate.
 *
 * Phase 1: Truth Ledger only. Future phases add careerNodes,
 * careerEdges, outcomeEvents, careerQuests.
 */
export const engineTables = {
  /**
   * Atomic, append-only, hash-addressable career claim.
   *
   * Every fact that appears in a user's CV — a bullet point under an
   * experience, a skill proficiency, a certification — is stored
   * here as a single atom. The AI rewriter is contractually bound
   * to its `claim` text: it may *paraphrase* an atom but cannot
   * invent a new one. This makes CV hallucination impossible by
   * construction rather than by prompt discipline.
   *
   * Append-only: edits are modelled as supersession (new row with
   * `supersededBy` pointing to the old atom's id). This preserves
   * the full claim history for audit / Merkle proofs.
   */
  truthAtoms: defineTable({
    userId: v.id("users"),
    cvId: v.id("cvs"),

    /** Human-readable claim text. The unit of AI-paraphrasable truth. */
    claim: v.string(),

    /** Coarse category — drives which CV section renders the atom. */
    type: v.union(
      v.literal("achievement"),
      v.literal("skill"),
      v.literal("role"),
      v.literal("education"),
      v.literal("certification"),
      v.literal("project"),
      v.literal("summary"),
    ),

    /**
     * Where this atom was lifted from in the user's CV. Lets the
     * renderer round-trip atom → bullet without re-running NLU on
     * every paint. Optional because freeform user-added atoms
     * don't have a single source bullet yet.
     *
     * Format: `"experience:{expId}:achievement:{idx}"`,
     *         `"skill:{skillId}"`, `"project:{projectId}"`, etc.
     */
    sourceRef: v.optional(v.string()),

    /**
     * Optional file proving the claim (ijazah, sertifikat, payslip
     * redacted, GitHub commit link as a hosted image). Phase 1 keeps
     * proof opaque — Phase 2 adds a Merkle-leaf hash over proof
     * bytes for tamper-evidence.
     */
    proofStorageId: v.optional(v.id("_storage")),

    /**
     * sha256(userId | claim | type | sourceRef | attestedAt). Used
     * for dedup + future Merkle-tree root of the CV. Stored hex.
     */
    hash: v.string(),

    /**
     * If this atom was replaced (user edited the claim text), points
     * to the new atom that supersedes it. Active atoms have this
     * field unset. Never delete — the ledger is append-only.
     */
    supersededBy: v.optional(v.id("truthAtoms")),

    /**
     * Timestamp when the user attested this claim is true. Same as
     * `_creationTime` for the first revision; for supersessions it
     * marks when the *new* claim was attested.
     */
    attestedAt: v.number(),
  })
    .index("by_user_cv", ["userId", "cvId"])
    .index("by_hash", ["hash"]),
};
