/**
 * Sanitisation helpers used across block sanitisers.
 *
 * Security model:
 * - HTML block — strict regex strip of script/style/iframe/object/embed/
 *   svg/math/link/meta tags + on*= handlers + javascript:/vbscript:/
 *   data: protocols on href/src.
 * - Embed block — never trusts user-supplied iframe markup; only
 *   accepts a URL, normalises to (provider, id).
 * - Image / link URLs — must start with https:// (or relative `/`),
 *   strips javascript:/data:/file: shells.
 */

import { MAX_HTML_LEN, MAX_URL_LEN, type EmbedProvider } from "./types";

export function trimSafe(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  // Strip C0 control chars + DEL but preserve tabs/newlines/CR + the
  // visible content. Block payloads include user prose.
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, max);
}

export function sanitizeUrl(input: unknown, max: number = MAX_URL_LEN): string {
  const s = trimSafe(input, max);
  if (!s) return "";
  const lower = s.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:")
  ) {
    return "";
  }
  if (s.startsWith("/") || s.startsWith("#")) return s;
  if (!/^https?:\/\//i.test(s)) return "";
  try {
    const url = new URL(s);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

const HTML_STRIP_TAGS = new Set([
  "script", "style", "iframe", "object", "embed", "svg", "math",
  "link", "meta", "form", "input", "textarea", "select", "button", "base",
]);

const HTML_ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "code", "pre",
  "blockquote", "hr",
  "h2", "h3", "h4",
  "ul", "ol", "li",
  "a", "span",
]);

export function sanitizeHtml(input: unknown): string {
  let s = trimSafe(input, MAX_HTML_LEN);
  if (!s) return "";

  // 1. Drop block-content of the strip-list (incl. children) so nested
  //    tricks like <script><script>x</script></script> still die.
  for (const tag of HTML_STRIP_TAGS) {
    const open = new RegExp(`<\\s*${tag}\\b[^>]*>[\\s\\S]*?<\\s*/\\s*${tag}\\s*>`, "gi");
    s = s.replace(open, "");
    const self = new RegExp(`<\\s*${tag}\\b[^>]*/?>`, "gi");
    s = s.replace(self, "");
  }

  // 2. Strip every on*=… attribute.
  s = s.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 3. Strip dangerous protocols on href/src/formaction/poster/action/xlink:href.
  s = s.replace(
    /\b(href|src|formaction|poster|action|xlink:href)\s*=\s*("[^"]*"|'[^']*')/gi,
    (m, attr, val: string) => {
      const inner = val.slice(1, -1).trim().toLowerCase();
      if (
        inner.startsWith("javascript:") ||
        inner.startsWith("vbscript:") ||
        inner.startsWith("data:") ||
        inner.startsWith("file:")
      ) {
        return `${attr}="#"`;
      }
      return m;
    },
  );

  // 4. Drop every tag NOT in the allowlist (preserve text content).
  s = s.replace(/<\/?\s*([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g, (m, tag: string) => {
    return HTML_ALLOWED_TAGS.has(tag.toLowerCase()) ? m : "";
  });

  // 5. Force <a target="_blank" rel="noopener noreferrer"> when href is
  //    external — defence against window.opener attacks.
  s = s.replace(/<a\b([^>]*)>/gi, (m, attrs: string) => {
    if (!/href\s*=/.test(attrs)) return m;
    let out = attrs;
    if (!/\btarget\s*=/.test(out)) out += ` target="_blank"`;
    if (!/\brel\s*=/.test(out)) out += ` rel="noopener noreferrer"`;
    return `<a${out}>`;
  });

  return s;
}

const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{6,})/i;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/i;
const SPOTIFY_RE = /open\.spotify\.com\/(track|album|playlist|episode|show)\/([\w]+)/i;
const SOUNDCLOUD_RE = /soundcloud\.com\/[\w-]+\/[\w-]+/i;

export function parseEmbedUrl(
  url: string,
): { provider: EmbedProvider; id: string } | null {
  const trimmed = trimSafe(url, MAX_URL_LEN);
  if (!trimmed) return null;
  const yt = trimmed.match(YOUTUBE_RE);
  if (yt) return { provider: "youtube", id: yt[1] };
  const vm = trimmed.match(VIMEO_RE);
  if (vm) return { provider: "vimeo", id: vm[1] };
  const sp = trimmed.match(SPOTIFY_RE);
  if (sp) return { provider: "spotify", id: `${sp[1]}/${sp[2]}` };
  if (SOUNDCLOUD_RE.test(trimmed)) return { provider: "soundcloud", id: trimmed };
  return null;
}
