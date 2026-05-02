/**
 * Pluggable email sender + render helpers.
 *
 * - If `RESEND_API_KEY` is set in Convex env, sends via Resend REST API.
 * - Otherwise, logs the message to backend stdout (dev fallback).
 *
 * Kept dep-free (uses fetch + WebCrypto) so we don't pull a vendor SDK
 * into the Convex bundle. Add additional providers (Postmark, SES) by
 * branching on a different env var here.
 *
 * Env vars (set in Dokploy / `npx convex env set`):
 *   RESEND_API_KEY  — required to actually deliver mail
 *   EMAIL_FROM      — sender address; must match a verified Resend domain
 *   APP_URL         — base URL for links + unsubscribe endpoint
 *   EMAIL_REPLY_TO  — optional; defaults to address part of EMAIL_FROM
 */

import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

const RESEND_API = "https://api.resend.com/emails";
const APP_NAME = "CareerPack";
const APP_TAGLINE = "Toolkit karir untuk job-seeker Indonesia";
const BRAND_COLOR = "#0ea5e9"; // career-500
const FOOTER_BG = "#f8fafc";   // slate-50
const TEXT = "#111827";
const MUTED = "#6b7280";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /**
   * Stable per-template tag for reputation tracking and Postmaster
   * Tools. Resend dashboard filters deliverability per tag.
   */
  tag?: string;
  /**
   * Bypass the unsubscribe check. Set true ONLY for transactional mail
   * the user expects regardless of marketing prefs (password reset,
   * security alerts). Default `false` — welcome / digests / etc. respect
   * unsubscribed list.
   */
  alwaysSend?: boolean;
}

export type SendResult =
  | { ok: true; provider: "resend" | "console" }
  | { ok: false; reason: string };

/**
 * Send an email. Caller must be inside an action or internalAction
 * (needs ctx.runQuery for the unsubscribe lookup). Pass the action ctx;
 * we route the lookup through `internal.admin.unsubscribes._isUnsubscribed`.
 */
export async function sendEmail(
  ctx: ActionCtx,
  input: SendEmailInput,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "CareerPack <noreply@careerpack.local>";
  const replyTo = process.env.EMAIL_REPLY_TO ?? extractAddress(from);
  const appUrl = (process.env.APP_URL ?? "https://careerpack.local").replace(/\/$/, "");

  // Unsubscribe gate (skipped for alwaysSend transactional mail).
  if (!input.alwaysSend) {
    try {
      const { internal } = await import("../_generated/api");
      const unsubbed = await ctx.runQuery(
        internal.admin.unsubscribes._isUnsubscribed,
        { email: input.to.toLowerCase() },
      );
      if (unsubbed) {
        console.log(`[email] skipped — unsubscribed to=${input.to} tag=${input.tag ?? "n/a"}`);
        return { ok: true, provider: "console" };
      }
    } catch (err) {
      // Don't block sending if the lookup fails — just log.
      console.warn(`[email] unsubscribe lookup failed: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  const unsubUrl = await buildUnsubscribeUrl(appUrl, input.to);
  const listUnsubscribe = `<${unsubUrl}>, <mailto:${replyTo}?subject=Unsubscribe>`;

  if (!apiKey) {
    console.log(
      `[email:dev] to=${input.to} subject="${input.subject}" tag=${input.tag ?? "n/a"}\n${input.text ?? stripHtml(input.html)}`,
    );
    return { ok: true, provider: "console" };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        reply_to: replyTo,
        ...(input.text ? { text: input.text } : {}),
        ...(input.tag ? { tags: [{ name: "category", value: input.tag }] } : {}),
        headers: {
          "List-Unsubscribe": listUnsubscribe,
          // RFC 8058 — Gmail and Yahoo honour this for one-click unsub.
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "X-Entity-Ref-ID": `${input.tag ?? "tx"}-${Date.now().toString(36)}`,
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const reason = `resend_${res.status}`;
      console.error(`[email] ${reason}: ${body.slice(0, 200)}`);
      return { ok: false, reason };
    }
    return { ok: true, provider: "resend" };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown";
    console.error(`[email] fetch failed: ${reason}`);
    return { ok: false, reason };
  }
}

// ---------------------------------------------------------------------------
// Layout — every email rendered through `renderEmail` so header / footer /
// branding / unsubscribe link stay consistent. Plain inline-style HTML so
// every email client (Gmail, Outlook, Apple Mail) renders identically.
// ---------------------------------------------------------------------------

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

interface EmailLayoutInput {
  subject: string;
  preheader: string;
  bodyHtml: string;
  bodyText: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

export async function renderEmail(input: EmailLayoutInput, recipient: string): Promise<RenderedEmail> {
  const appUrl = (process.env.APP_URL ?? "https://careerpack.local").replace(/\/$/, "");
  const unsubUrl = await buildUnsubscribeUrl(appUrl, recipient);
  const safeAppUrl = escapeHtml(appUrl);
  const safeUnsub = escapeHtml(unsubUrl);
  const safePreheader = escapeHtml(input.preheader);

  const cta = input.ctaUrl && input.ctaLabel
    ? `<p style="margin:24px 0">
         <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:12px 22px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">${escapeHtml(input.ctaLabel)}</a>
       </p>`
    : "";

  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(input.subject)}</title></head>
<body style="margin:0;padding:0;background:${FOOTER_BG};font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:${TEXT}">
  <!-- Preheader (hidden in body, shown in inbox preview) -->
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;visibility:hidden;mso-hide:all">${safePreheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FOOTER_BG};padding:24px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04)">

        <!-- Header -->
        <tr><td style="padding:20px 24px;background:${BRAND_COLOR};color:#ffffff">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-size:18px;font-weight:700;letter-spacing:-0.01em">
                <a href="${safeAppUrl}" style="color:#ffffff;text-decoration:none">${APP_NAME}</a>
              </td>
              <td align="right" style="font-size:12px;color:rgba(255,255,255,0.85)">
                ${escapeHtml(APP_TAGLINE)}
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 28px 8px 28px;font-size:15px;line-height:1.6">
          ${input.bodyHtml}
          ${cta}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 28px;border-top:1px solid #e5e7eb;background:${FOOTER_BG}">
          <p style="margin:0 0 8px;font-size:12px;color:${MUTED};line-height:1.55">
            <strong style="color:${TEXT}">${APP_NAME}</strong> — ${escapeHtml(APP_TAGLINE)}<br/>
            Kamu menerima email ini karena terdaftar sebagai user di <a href="${safeAppUrl}" style="color:${MUTED}">careerpack.org</a>.
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:${MUTED}">
            <a href="${safeAppUrl}" style="color:${MUTED};text-decoration:underline">Buka dashboard</a>
            &nbsp;·&nbsp;
            <a href="${safeAppUrl}/privacy" style="color:${MUTED};text-decoration:underline">Privacy</a>
            &nbsp;·&nbsp;
            <a href="${safeAppUrl}/terms" style="color:${MUTED};text-decoration:underline">Terms</a>
            &nbsp;·&nbsp;
            <a href="${safeUnsub}" style="color:${MUTED};text-decoration:underline">Unsubscribe</a>
          </p>
          <p style="margin:12px 0 0;font-size:11px;color:${MUTED};line-height:1.5">
            Tidak menerima email yang kamu harapkan? Cek folder Spam / Promotions, lalu tandai email ini "Bukan Spam" supaya pesan berikutnya masuk inbox.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

  const ctaText = input.ctaUrl && input.ctaLabel ? `\n\n${input.ctaLabel}: ${input.ctaUrl}\n` : "\n";
  const text = `${input.bodyText}${ctaText}\n--\n${APP_NAME} — ${APP_TAGLINE}\n${appUrl}\n\nUnsubscribe: ${unsubUrl}\nTidak menerima email seperti ini? Cek folder Spam dan tandai "Bukan Spam".`;

  return { subject: input.subject, html, text };
}

// ---------------------------------------------------------------------------
// Per-template render functions — each returns RenderedEmail. All run
// through renderEmail so layout stays consistent.
// ---------------------------------------------------------------------------

export async function renderResetEmail(resetLink: string, recipient: string): Promise<RenderedEmail> {
  const safeUrl = escapeHtml(resetLink);
  const bodyHtml = `<p style="margin:0 0 12px">Halo,</p>
<p style="margin:0 0 12px">Kami menerima permintaan untuk mengatur ulang kata sandi akun CareerPack kamu. Klik tombol di bawah untuk membuat kata sandi baru. Link berlaku 30 menit.</p>
<p style="margin:0 0 12px;font-size:13px;color:${MUTED}">Kalau tombol tidak bekerja, salin link berikut ke browser:<br/><span style="word-break:break-all">${safeUrl}</span></p>
<p style="margin:0;font-size:13px;color:${MUTED}">Tidak meminta reset? Abaikan email ini — akun kamu tetap aman.</p>`;
  const bodyText = `Halo,\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun CareerPack kamu. Buka link berikut untuk membuat kata sandi baru (berlaku 30 menit):\n\n${resetLink}\n\nTidak meminta reset? Abaikan email ini.`;

  return renderEmail({
    subject: "Reset kata sandi CareerPack",
    preheader: "Buka link di dalam email untuk reset kata sandi. Link berlaku 30 menit.",
    bodyHtml,
    bodyText,
    ctaUrl: resetLink,
    ctaLabel: "Reset Kata Sandi",
  }, recipient);
}

export async function renderWelcomeEmail(fullName: string, dashboardUrl: string, recipient: string): Promise<RenderedEmail> {
  const safeName = escapeHtml(fullName || "");
  const greeting = safeName ? `Halo ${safeName},` : "Halo,";
  const bodyHtml = `<p style="margin:0 0 12px">${greeting}</p>
<p style="margin:0 0 12px">Akun CareerPack kamu sudah aktif. Kami juga menyiapkan starter data (CV draft, checklist dokumen, dan roadmap skill) supaya kamu tidak mulai dari halaman kosong.</p>
<p style="margin:0 0 12px">Kalau ada pertanyaan, balas email ini langsung — kami yang baca.</p>`;
  const bodyText = `${greeting}\n\nAkun CareerPack kamu sudah aktif. Kami juga menyiapkan starter data (CV draft, checklist dokumen, dan roadmap skill) supaya kamu tidak mulai dari halaman kosong.\n\nKalau ada pertanyaan, balas email ini langsung — kami yang baca.`;

  return renderEmail({
    subject: "Akun CareerPack kamu sudah aktif",
    preheader: "Starter data sudah disiapkan. Buka dashboard untuk mulai.",
    bodyHtml,
    bodyText,
    ctaUrl: dashboardUrl,
    ctaLabel: "Buka Dashboard",
  }, recipient);
}

export interface DigestJobItem {
  title: string;
  company: string;
  location: string;
  workMode: string;
  category?: string;
  score: number;
  applyUrl?: string;
  detailUrl: string;
}

export async function renderJobDigestEmail(
  fullName: string,
  jobs: DigestJobItem[],
  dashboardUrl: string,
  recipient: string,
): Promise<RenderedEmail> {
  const greeting = fullName ? `Halo ${escapeHtml(fullName)},` : "Halo,";
  const cards = jobs
    .map((j) => {
      const score = `${j.score}% cocok`;
      const meta = [j.location, j.workMode]
        .filter(Boolean)
        .map(escapeHtml)
        .join(" · ");
      return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <tr><td style="padding:14px 16px">
    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:${TEXT}">
      <a href="${escapeHtml(j.detailUrl)}" style="color:${TEXT};text-decoration:none">${escapeHtml(j.title)}</a>
    </p>
    <p style="margin:0 0 6px;font-size:13px;color:${MUTED}">${escapeHtml(j.company)} · ${meta}</p>
    <p style="margin:0;font-size:12px">
      <span style="display:inline-block;padding:2px 8px;background:${BRAND_COLOR}1A;color:${BRAND_COLOR};border-radius:999px;font-weight:600">${score}</span>
      ${j.applyUrl ? `<a href="${escapeHtml(j.applyUrl)}" style="margin-left:10px;color:${BRAND_COLOR};text-decoration:underline">Lamar →</a>` : ""}
    </p>
  </td></tr>
</table>`;
    })
    .join("");

  const bodyHtml = `<p style="margin:0 0 12px">${greeting}</p>
<p style="margin:0 0 16px">Ini ${jobs.length} lowongan baru yang paling cocok dengan profil kamu minggu ini:</p>
${cards}
<p style="margin:16px 0 0;font-size:13px;color:${MUTED}">Kalau kamu tidak mau menerima digest mingguan, kamu bisa matikan dari Setelan atau klik link Unsubscribe di bawah.</p>`;

  const bodyText = [
    greeting,
    "",
    `${jobs.length} lowongan baru cocok untukmu minggu ini:`,
    "",
    ...jobs.map((j, i) => `${i + 1}. ${j.title} @ ${j.company} (${j.score}% cocok)\n   ${j.detailUrl}${j.applyUrl ? `\n   Lamar: ${j.applyUrl}` : ""}`),
  ].join("\n");

  return renderEmail(
    {
      subject: `${jobs.length} lowongan cocok untukmu — CareerPack`,
      preheader: `Top ${jobs.length} lowongan minggu ini berdasarkan target role + skills kamu.`,
      bodyHtml,
      bodyText,
      ctaUrl: dashboardUrl,
      ctaLabel: "Buka Dashboard",
    },
    recipient,
  );
}

// ---------------------------------------------------------------------------
// Unsubscribe — HMAC-signed token over the recipient email so users can
// only unsubscribe themselves, not arbitrary addresses.
// ---------------------------------------------------------------------------

/**
 * Build a one-click unsubscribe URL with HMAC-signed token. Verifying:
 * see `convex/admin/unsubscribes.ts#verifyUnsubscribeToken`.
 */
export async function buildUnsubscribeUrl(appUrl: string, email: string): Promise<string> {
  const token = await signUnsubscribeToken(email);
  const params = new URLSearchParams({ email: email.toLowerCase(), token });
  return `${appUrl}/api/unsubscribe?${params.toString()}`;
}

export async function signUnsubscribeToken(email: string): Promise<string> {
  const key = await unsubscribeKey();
  const data = new TextEncoder().encode(email.toLowerCase().trim());
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return bytesToBase64Url(new Uint8Array(sig));
}

export async function verifyUnsubscribeToken(email: string, token: string): Promise<boolean> {
  const expected = await signUnsubscribeToken(email);
  return timingSafeEqualStr(expected, token);
}

async function unsubscribeKey(): Promise<CryptoKey> {
  // Derive from RESEND_API_KEY so we don't need a separate env var.
  // Property: token reveals nothing about the API key (HMAC is one-way),
  // and rotating the API key invalidates outstanding unsub links —
  // acceptable trade since users can re-click from the next email.
  const seed = process.env.RESEND_API_KEY ?? "careerpack-fallback-unsub-key";
  const seedBytes = new TextEncoder().encode(`${seed}::unsub-v1`);
  return crypto.subtle.importKey(
    "raw",
    seedBytes as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  // eslint-disable-next-line no-restricted-globals
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pull `addr@host` out of `Display Name <addr@host>` form. */
function extractAddress(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return m ? m[1].trim() : from.trim();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// re-exports for the typecheck — these helpers are intended for use only
// within `_shared/email.ts`. Exporting the function types in case future
// callers need them.
export type { QueryCtx, MutationCtx };
