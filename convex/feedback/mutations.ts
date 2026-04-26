import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser } from "../_shared/auth";

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 4000;

export const submitFeedback = mutation({
  args: {
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await optionalUser(ctx);

    const subject = args.subject.trim();
    const message = args.message.trim();

    if (subject.length === 0) {
      throw new Error("Subjek tidak boleh kosong");
    }
    if (subject.length > SUBJECT_MAX) {
      throw new Error(`Subjek maksimal ${SUBJECT_MAX} karakter`);
    }
    if (message.length < 5) {
      throw new Error("Pesan terlalu pendek (min. 5 karakter)");
    }
    if (message.length > MESSAGE_MAX) {
      throw new Error(`Pesan maksimal ${MESSAGE_MAX} karakter`);
    }

    await ctx.db.insert("feedback", {
      userId: userId ?? undefined,
      subject,
      message,
      timestamp: Date.now(),
    });

    return { ok: true };
  },
});
