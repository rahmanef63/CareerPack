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
}

export type SendResult =
  | { ok: true; provider: "resend" | "console" }
  | { ok: false; reason: string };

export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "CareerPack <noreply@careerpack.local>";

  if (!apiKey) {
    console.log(
      `[email:dev] to=${input.to} subject="${input.subject}"\n${input.text ?? stripHtml(input.html)}`,
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
        ...(input.text ? { text: input.text } : {}),
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
