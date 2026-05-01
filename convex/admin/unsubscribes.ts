import { httpAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { verifyUnsubscribeToken } from "../_shared/email";

/**
 * Unsubscribe routes — wired in `convex/router.ts`:
 *
 *   GET  /api/unsubscribe?email=...&token=...   → confirm page (no DB write)
 *   POST /api/unsubscribe?email=...&token=...   → mark unsubscribed
 *
 * Both verify HMAC-signed token over the recipient email so users can
 * only unsubscribe themselves. POST is the one-click handler that Gmail
 * (and anything honouring RFC 8058) calls when the user hits the
 * unsubscribe button in the inbox toolbar.
 */

export const handleUnsubscribeGet = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") ?? "").toLowerCase();
  const token = url.searchParams.get("token") ?? "";
  if (!email || !token) return htmlPage(400, badRequestPage());

  const valid = await verifyUnsubscribeToken(email, token);
  if (!valid) return htmlPage(400, badRequestPage());

  const already = await ctx.runQuery(internal.admin.unsubscribes._isUnsubscribed, { email });
  if (already) return htmlPage(200, alreadyUnsubscribedPage(email));

  return htmlPage(200, confirmPage(email, token));
});

export const handleUnsubscribePost = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") ?? "").toLowerCase();
  const token = url.searchParams.get("token") ?? "";
  if (!email || !token) return htmlPage(400, badRequestPage());

  const valid = await verifyUnsubscribeToken(email, token);
  if (!valid) return htmlPage(400, badRequestPage());

  await ctx.runMutation(internal.admin.unsubscribes._markUnsubscribed, {
    email,
    source: "user_one_click",
  });

  // Gmail's one-click client expects 200 + any small body. Browsers from
  // the GET landing page POST then redirect to the same URL via JS for
  // the success view.
  return htmlPage(200, successPage(email));
});

// --- internal data access ---------------------------------------------------

export const _isUnsubscribed = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("emailUnsubscribes")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    return row !== null;
  },
});

export const _markUnsubscribed = internalMutation({
  args: { email: v.string(), source: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const existing = await ctx.db
      .query("emailUnsubscribes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) return { duplicate: true };
    await ctx.db.insert("emailUnsubscribes", {
      email,
      source: args.source,
      reason: args.reason,
      unsubscribedAt: Date.now(),
    });
    return { duplicate: false };
  },
});

// --- HTML pages -------------------------------------------------------------

function htmlPage(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function shell(title: string, content: string): string {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title>
<style>body{margin:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111827}main{max-width:480px;margin:48px auto;padding:32px;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.05)}h1{margin:0 0 12px;font-size:20px}p{margin:0 0 12px;line-height:1.55;color:#374151}.muted{color:#6b7280;font-size:13px}.btn{display:inline-block;padding:10px 18px;background:#0ea5e9;color:#fff;border-radius:8px;border:0;font-weight:600;cursor:pointer;text-decoration:none;font-size:14px}.btn-ghost{background:transparent;color:#6b7280;border:1px solid #d1d5db}.row{display:flex;gap:8px;margin-top:16px}</style></head><body><main>${content}</main></body></html>`;
}

function confirmPage(email: string, token: string): string {
  const safeEmail = escape(email);
  const safeToken = escape(token);
  return shell(
    "Berhenti berlangganan — CareerPack",
    `<h1>Berhenti berlangganan?</h1>
<p>Email <strong>${safeEmail}</strong> tidak akan lagi menerima email non-transactional dari CareerPack (welcome, ringkasan mingguan, dll).</p>
<p class="muted">Email penting seperti <em>reset kata sandi</em> dan <em>peringatan keamanan</em> tetap dikirim — sesuai standar transactional email.</p>
<form method="POST" action="/api/unsubscribe?email=${safeEmail}&token=${safeToken}" class="row">
  <button type="submit" class="btn">Ya, berhenti berlangganan</button>
  <a href="https://careerpack.org" class="btn btn-ghost">Batal</a>
</form>`,
  );
}

function successPage(email: string): string {
  return shell(
    "Berhasil berhenti — CareerPack",
    `<h1>Sudah berhenti berlangganan</h1>
<p>Email <strong>${escape(email)}</strong> tidak akan lagi menerima email non-transactional.</p>
<p class="muted">Berubah pikiran? Kirim email ke <a href="mailto:support@careerpack.org">support@careerpack.org</a> dengan subject <em>Re-subscribe</em>.</p>
<p><a href="https://careerpack.org" class="btn btn-ghost">Kembali ke CareerPack</a></p>`,
  );
}

function alreadyUnsubscribedPage(email: string): string {
  return shell(
    "Sudah unsubscribe — CareerPack",
    `<h1>Email ini sudah di-unsubscribe</h1>
<p><strong>${escape(email)}</strong> sebelumnya sudah memilih berhenti berlangganan. Tidak ada yang perlu dilakukan lagi.</p>
<p><a href="https://careerpack.org" class="btn btn-ghost">Kembali ke CareerPack</a></p>`,
  );
}

function badRequestPage(): string {
  return shell(
    "Link tidak valid — CareerPack",
    `<h1>Link unsubscribe tidak valid</h1>
<p>Token tidak cocok atau sudah kedaluwarsa. Hubungi <a href="mailto:support@careerpack.org">support@careerpack.org</a> kalau perlu bantuan.</p>`,
  );
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
