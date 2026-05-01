/**
 * Pluggable email sender.
 *
 * - If `RESEND_API_KEY` is set in Convex env, sends via Resend REST API.
 * - Otherwise, logs the message to backend stdout (dev fallback).
 *
 * Kept dep-free (uses fetch) so we don't pull a vendor SDK into the
 * Convex bundle. Add additional providers (Postmark, SES) by branching
 * on a different env var here.
 *
 * Env vars (set in Dokploy / `npx convex env set`):
 *   RESEND_API_KEY  — required to actually deliver mail
 *   EMAIL_FROM      — sender address; must match a verified Resend domain
 *   APP_URL         — base URL for links inside email bodies (e.g. https://careerpack.org)
 */

const RESEND_API = "https://api.resend.com/emails";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /**
   * Stable per-template tag for reputation tracking and Postmaster Tools.
   * E.g. "password-reset", "welcome". Resend tags also let us filter
   * deliverability per template in their dashboard.
   */
  tag?: string;
}

export type SendResult =
  | { ok: true; provider: "resend" | "console" }
  | { ok: false; reason: string };

export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "CareerPack <noreply@careerpack.local>";
  // Reply-To address (defaults to support inbox so users can actually
  // reply to transactional mail — a strong "real human" signal for
  // Gmail's bayesian filter, more so than perfect SPF/DKIM).
  const replyTo = process.env.EMAIL_REPLY_TO ?? extractAddress(from);

  if (!apiKey) {
    console.log(
      `[email:dev] to=${input.to} subject="${input.subject}"\n${input.text ?? stripHtml(input.html)}`,
    );
    return { ok: true, provider: "console" };
  }

  // Generic mailto-form List-Unsubscribe — RFC 2369. Doesn't require a
  // public endpoint, doesn't break transactional semantics, and is one
  // of Gmail's "trusted sender" signals (per its 2024 bulk-sender rules).
  // Better than no header even on a low-volume new domain.
  const listUnsubscribe = `<mailto:${replyTo}?subject=Unsubscribe>`;

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

/** Pull `addr@host` out of `Display Name <addr@host>` form. */
function extractAddress(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return m ? m[1].trim() : from.trim();
}

export function renderWelcomeEmail(fullName: string, dashboardUrl: string): { subject: string; html: string; text: string } {
  // Plain transactional voice — no emoji in subject/body, single CTA,
  // short prose. Trade marketing flourish for inbox placement on a new
  // domain. Once domain reputation builds (~weeks), we can re-introduce
  // richer formatting if engagement metrics support it.
  const subject = "Akun CareerPack kamu sudah aktif";
  const safeUrl = escapeHtml(dashboardUrl);
  const safeName = escapeHtml(fullName || "");
  const greeting = safeName ? `Halo ${safeName},` : "Halo,";
  const html = `<!doctype html><html lang="id"><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:24px auto;padding:0 16px;color:#111827;background:#ffffff">
  <p style="margin:0 0 12px;line-height:1.6">${greeting}</p>
  <p style="margin:0 0 12px;line-height:1.6">Akun CareerPack kamu sudah aktif. Kami juga menyiapkan starter data (CV draft, checklist dokumen, dan roadmap skill) supaya kamu tidak mulai dari halaman kosong.</p>
  <p style="margin:0 0 12px;line-height:1.6">Buka dashboard di sini: <a href="${safeUrl}" style="color:#0ea5e9">${safeUrl}</a></p>
  <p style="margin:0 0 12px;line-height:1.6">Kalau ada pertanyaan, balas email ini langsung — kami yang baca.</p>
  <p style="margin:24px 0 0;line-height:1.6">Salam,<br/>Tim CareerPack</p>
</body></html>`;
  const text = `${greeting}\n\nAkun CareerPack kamu sudah aktif. Kami juga menyiapkan starter data (CV draft, checklist dokumen, dan roadmap skill) supaya kamu tidak mulai dari halaman kosong.\n\nBuka dashboard di sini: ${dashboardUrl}\n\nKalau ada pertanyaan, balas email ini langsung — kami yang baca.\n\nSalam,\nTim CareerPack`;
  return { subject, html, text };
}

export function renderResetEmail(resetLink: string): { subject: string; html: string; text: string } {
  const subject = "Reset Kata Sandi CareerPack";
  const safe = escapeHtml(resetLink);
  const html = `<!doctype html><html lang="id"><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:24px auto;padding:0 16px;color:#111827;background:#ffffff">
  <h2 style="margin:0 0 16px;font-size:20px">Reset Kata Sandi CareerPack</h2>
  <p style="margin:0 0 12px;line-height:1.55">Klik tombol di bawah untuk membuat kata sandi baru. Link berlaku 30 menit.</p>
  <p style="margin:24px 0">
    <a href="${safe}" style="display:inline-block;padding:12px 20px;background:#0ea5e9;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">Reset Kata Sandi</a>
  </p>
  <p style="margin:0 0 12px;font-size:13px;color:#6b7280">Jika tombol tidak bekerja, salin link berikut ke browser:<br><span style="word-break:break-all">${safe}</span></p>
  <p style="margin:0;font-size:13px;color:#6b7280">Jika Anda tidak meminta reset kata sandi, abaikan email ini — akun Anda tetap aman.</p>
</body></html>`;
  const text = `Reset Kata Sandi CareerPack\n\nKlik link berikut untuk reset (berlaku 30 menit):\n${resetLink}\n\nJika Anda tidak meminta reset, abaikan email ini.`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
