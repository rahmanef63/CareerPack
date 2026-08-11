import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id, TableNames } from "../_generated/dataModel";

/**
 * One-off repair: fold a duplicate account's data into the one the user
 * actually signs in with.
 *
 * `rahmanef63@gmail.com` ended up with two `users` rows (17 Apr and 5 May) and
 * kept using the newer one, so six CVs, five job applications and a year of
 * portfolio/goal/budget rows sat on an account that never loads. Nothing in
 * the product surfaces this — every query is scoped by `userId`, so the old
 * data is not "hidden", it is unreachable.
 *
 * `internalMutation`, not an admin-facing one: this is a hand-audited move
 * between two specific ids and there is no UI for it. Internal functions are
 * unreachable from any client, which is a stronger guarantee than a role check
 * and needs no session.
 *
 * Run the dry run first and read the counts — it reports exactly what the real
 * run would touch and writes nothing.
 */

/**
 * Owned lists: every row belongs to one user and more than one can exist, so
 * re-pointing `userId` is the whole move.
 *
 * Deliberately excluded:
 * - **Singletons** (`userProfiles`, `documentChecklists`, `financialPlans`,
 *   `roadmapSaved`, `skillRoadmaps`) — the target account already has one of
 *   each and they are the newer, richer copies. Moving the source rows would
 *   put two in a table every query reads with `.first()`, which silently picks
 *   by insertion order.
 * - **Auth tables** (`authAccounts`, `authSessions`, `authRefreshTokens`, …) —
 *   re-pointing a session or a credential at another user is an account
 *   takeover primitive, not a data merge. The source account stays logged in
 *   and simply owns nothing.
 * - **`quickFillBatches`** — undo history whose snapshots reference CV ids
 *   this same run deletes, so a moved batch would offer an "Urungkan" that
 *   restores into nothing.
 */
const OWNED_LISTS = [
  "cvs",
  "portfolioItems",
  "careerGoals",
  "budgetVariables",
  "chatConversations",
  "jobApplications",
  "calendarEvents",
  "contacts",
  "atsScans",
  "mockInterviews",
] as const satisfies readonly TableNames[];

export const mergeUserData = internalMutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    /** CVs to drop instead of move — duplicates and unparsed junk. */
    deleteCvIds: v.optional(v.array(v.id("cvs"))),
    /** Union this CV's skills + languages into `intoCvId`, then delete it.
     *  Used to keep an import that landed on the target account's CV while
     *  still ending up with a single row. */
    foldCvId: v.optional(v.id("cvs")),
    intoCvId: v.optional(v.id("cvs")),
    /** Make the surviving CV the default one. */
    setDefaultCvId: v.optional(v.id("cvs")),
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    moved: v.array(v.string()),
    deletedCvs: v.number(),
    folded: v.string(),
    notes: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const dry = args.dryRun !== false;
    const notes: string[] = [];

    if (args.fromUserId === args.toUserId) {
      throw new Error("fromUserId dan toUserId sama");
    }
    const from = await ctx.db.get(args.fromUserId);
    const to = await ctx.db.get(args.toUserId);
    if (!from || !to) throw new Error("Salah satu akun tidak ditemukan");
    // The whole premise is that these are the same person. Merging across two
    // different addresses would be a data leak with a friendly name on it.
    if (!from.email || from.email.toLowerCase() !== (to.email ?? "").toLowerCase()) {
      throw new Error(
        `Email berbeda — ${from.email ?? "(kosong)"} vs ${to.email ?? "(kosong)"}`,
      );
    }

    const drop = new Set<string>((args.deleteCvIds ?? []).map(String));

    // ---- Delete the CVs that are not worth moving -----------------------
    let deletedCvs = 0;
    for (const cvId of args.deleteCvIds ?? []) {
      const cv = await ctx.db.get(cvId);
      if (!cv) {
        notes.push(`CV ${cvId} sudah tidak ada — dilewati`);
        continue;
      }
      if (cv.userId !== args.fromUserId && cv.userId !== args.toUserId) {
        throw new Error(`CV ${cvId} bukan milik salah satu akun ini`);
      }
      // Scans point at a CV row; leaving them would dangle. Applications on
      // these accounts carry no `cvId`, but clear it where one exists rather
      // than assume that holds.
      const scans = await ctx.db
        .query("atsScans")
        .filter((q) => q.eq(q.field("cvId"), cvId))
        .collect();
      for (const scan of scans) {
        if (!dry) await ctx.db.delete(scan._id);
      }
      if (scans.length > 0) notes.push(`${scans.length} atsScan ikut terhapus (CV ${String(cvId).slice(-8)})`);

      const apps = await ctx.db
        .query("jobApplications")
        .filter((q) => q.eq(q.field("cvId"), cvId))
        .collect();
      for (const app of apps) {
        if (!dry) await ctx.db.patch(app._id, { cvId: undefined });
      }
      if (apps.length > 0) notes.push(`${apps.length} lamaran dilepas dari CV ${String(cvId).slice(-8)}`);

      if (!dry) await ctx.db.delete(cvId);
      deletedCvs++;
    }

    // ---- Fold one CV's set-like fields into another ----------------------
    let folded = "tidak ada";
    if (args.foldCvId && args.intoCvId) {
      const src = await ctx.db.get(args.foldCvId);
      const dst = await ctx.db.get(args.intoCvId);
      if (!src || !dst) throw new Error("CV sumber atau tujuan lipatan tidak ada");

      // Same set semantics the import merge engine uses: case/spacing-
      // insensitive key, existing rows keep the category and proficiency the
      // user tuned by hand.
      const key = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

      const skills = [...dst.skills];
      const seenSkill = new Set(skills.map((s) => key(s.name)));
      let addedSkills = 0;
      for (const s of src.skills) {
        if (seenSkill.has(key(s.name))) continue;
        seenSkill.add(key(s.name));
        skills.push(s);
        addedSkills++;
      }

      const languages = [...dst.languages];
      const seenLang = new Set(languages.map((l) => key(l.language)));
      let addedLangs = 0;
      for (const l of src.languages) {
        if (seenLang.has(key(l.language))) continue;
        seenLang.add(key(l.language));
        languages.push(l);
        addedLangs++;
      }

      if (!dry) {
        await ctx.db.patch(args.intoCvId, { skills, languages });
        await ctx.db.delete(args.foldCvId);
      }
      drop.add(String(args.foldCvId));
      deletedCvs++;
      folded = `+${addedSkills} skill, +${addedLangs} bahasa → CV ${String(args.intoCvId).slice(-8)}`;
    }

    // ---- Move the rest --------------------------------------------------
    const moved: string[] = [];
    for (const table of OWNED_LISTS) {
      // Full scan rather than `by_user`: these tables are per-user small, and
      // a one-off repair should not depend on every one of them having spelled
      // its index the same way.
      const rows = (await ctx.db
        .query(table)
        .filter((q) => q.eq(q.field("userId"), args.fromUserId))
        .collect()) as Array<Doc<TableNames> & { _id: Id<TableNames> }>;
      let n = 0;
      for (const row of rows) {
        if (drop.has(String(row._id))) continue;
        if (!dry) {
          await ctx.db.patch(row._id, {
            userId: args.toUserId,
          } as unknown as Partial<Doc<TableNames>>);
        }
        n++;
      }
      if (n > 0) moved.push(`${table}=${n}`);
    }

    if (args.setDefaultCvId) {
      const cv = await ctx.db.get(args.setDefaultCvId);
      if (!cv) {
        notes.push("setDefaultCvId tidak ada — dilewati");
      } else if (!dry) {
        const others = await ctx.db
          .query("cvs")
          .filter((q) => q.eq(q.field("userId"), args.toUserId))
          .collect();
        for (const other of others) {
          if (other.isDefault && other._id !== args.setDefaultCvId) {
            await ctx.db.patch(other._id, { isDefault: false });
          }
        }
        await ctx.db.patch(args.setDefaultCvId, { isDefault: true });
      }
    }

    if (dry) notes.push("DRY RUN — tidak ada yang ditulis");
    return { moved, deletedCvs, folded, notes };
  },
});
