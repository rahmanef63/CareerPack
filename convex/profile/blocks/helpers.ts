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

const DANGEROUS_PROTO = /^(?:javascript|vbscript|data|file):/i;

export function trimSafe(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  // Strip C0 control chars + DEL but preserve tabs/newlines/CR + the
  // visible content. Block payloads include user prose.
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, max);
}

// Browsers strip C0 control whitespace (tab, newline, CR, form-feed,
// vertical-tab) AND internal spaces out of a URL scheme at click/parse time
// per the HTML/URL spec, so `java<TAB>script:`, `java<NEWLINE>script:`, and
// `vb<TAB>script:` all resolve to live javascript:/vbscript: URLs. trimSafe
// deliberately keeps tab/newline/CR for prose, so the scheme check must
// collapse that whitespace itself before comparing against DANGEROUS_PROTO —
// otherwise the literal-token comparison is trivially defeated.
function dewhitespaceScheme(s: string): string {
  // Only the candidate scheme prefix matters (everything up to and incl. the
  // first ':'); collapse all whitespace there so a split scheme is exposed.
  const colon = s.indexOf(":");
  if (colon === -1) return s;
  const prefix = s.slice(0, colon + 1).replace(/[\s\x00-\x1F]/g, "");
  return prefix + s.slice(colon + 1);
}

function hasDangerousScheme(s: string): boolean {
  return DANGEROUS_PROTO.test(dewhitespaceScheme(s));
}

export function sanitizeUrl(input: unknown, max: number = MAX_URL_LEN): string {
  const s = trimSafe(input, max);
  if (!s) return "";
  if (hasDangerousScheme(s)) return "";
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

// Attributes kept on allowlisted tags. Everything else (incl. every on*
// handler and `style`) is dropped during the tag-rebuild in step 4, so a
// handler cannot survive regardless of how it is separated from the
// previous attribute (`<a href="x"/onmouseover="…">`, quote-adjacent, etc).
const HTML_ALLOWED_ATTRS = new Set([
  "href", "target", "rel", "title", "class", "lang", "dir",
]);

// Attribute-aware "tag body" sub-pattern: the run of characters between a
// tag name and the tag's real closing `>`. A naive `[^>]*` stops at the FIRST
// `>`, but a `>` can legally live inside a quoted attribute value
// (`<a title="x>"…>`), so that early stop left the trailing markup — incl.
// an `on*=` handler — verbatim (stored XSS). This pattern consumes whole
// quoted strings (which may contain `>`) before any bare char, so matching
// only ends at a `>` that is OUTSIDE quotes.
const TAG_BODY = `(?:"[^"]*"|'[^']*'|[^>"'])*`;

// Strip every on*=… handler. Matches when the handler is preceded by the tag
// start, whitespace, a quote, or a `/` — covering whitespace-separated,
// quote-adjacent (`"onclick=`), and `/`-separated (`/onclick=`) variants that
// a bare `\s+on` lookbehind would miss. The leading delimiter is preserved.
const ON_HANDLER_RE = /(^|[\s"'/])on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

const DANGEROUS_URL_ATTR_RE =
  /\b(href|src|formaction|poster|action|xlink:href)\s*=\s*("[^"]*"|'[^']*')/gi;

function stripOnHandlers(s: string): string {
  return s.replace(ON_HANDLER_RE, "$1");
}

function neutralizeDangerousUrls(s: string): string {
  return s.replace(DANGEROUS_URL_ATTR_RE, (m, attr: string, val: string) => {
    // hasDangerousScheme collapses tab/newline/CR (and any C0 ctrl + internal
    // space) out of the scheme prefix first, so `java<TAB>script:` is caught.
    const inner = val.slice(1, -1).trim();
    if (hasDangerousScheme(inner)) {
      return `${attr}="#"`;
    }
    return m;
  });
}

export function sanitizeHtml(input: unknown): string {
  let s = trimSafe(input, MAX_HTML_LEN);
  if (!s) return "";

  // 1. Drop block-content of the strip-list (incl. children) so nested
  //    tricks like <script><script>x</script></script> still die. Tag bodies
  //    use the attribute-aware TAG_BODY so a `>` inside a quoted attribute
  //    can't truncate the open-tag match early.
  for (const tag of HTML_STRIP_TAGS) {
    const open = new RegExp(`<\\s*${tag}\\b${TAG_BODY}>[\\s\\S]*?<\\s*/\\s*${tag}\\s*>`, "gi");
    s = s.replace(open, "");
    const self = new RegExp(`<\\s*${tag}\\b${TAG_BODY}/?>`, "gi");
    s = s.replace(self, "");
  }

  // 2. Strip every on*=… attribute (any delimiter).
  s = stripOnHandlers(s);

  // 3. Strip dangerous protocols on href/src/formaction/poster/action/xlink:href.
  s = neutralizeDangerousUrls(s);

  // 4. Drop every tag NOT in the allowlist (preserve text content). For
  //    kept tags, REBUILD from an attribute allowlist (HTML_ALLOWED_ATTRS)
  //    rather than trusting step 2's on*= stripper — that stripper requires
  //    a delimiter before `on`, so handlers fused to a quoted value
  //    containing `>` slipped through and re-rendered verbatim. Rebuilding
  //    drops any attribute not on the allowlist no matter the separator, and
  //    re-checks href for dangerous protocols (incl. unquoted values that
  //    step 3's quoted-only regex misses). The tag matcher uses the
  //    attribute-aware TAG_BODY so a quoted `>` no longer ends the tag early.
  s = s.replace(
    new RegExp(`<(/?)\\s*([a-zA-Z][a-zA-Z0-9-]*)\\b(${TAG_BODY})>`, "g"),
    (_m, slash: string, tag: string, attrs: string) => {
      const name = tag.toLowerCase();
      if (!HTML_ALLOWED_TAGS.has(name)) return "";
      if (slash) return `</${name}>`;
      const kept: string[] = [];
      const attrRe = /([a-zA-Z][a-zA-Z0-9:-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g;
      let a: RegExpExecArray | null;
      while ((a = attrRe.exec(attrs)) !== null) {
        const an = a[1].toLowerCase();
        if (!HTML_ALLOWED_ATTRS.has(an)) continue;
        let raw = a[2];
        if (an === "href") {
          const inner = raw.replace(/^["']|["']$/g, "").trim();
          // De-whitespace the scheme prefix before testing so a tab/newline-
          // split `java<TAB>script:` href is rejected, not just the literal.
          if (hasDangerousScheme(inner)) raw = `"#"`;
          else if (!/^["']/.test(raw)) raw = `"${raw}"`;
        }
        kept.push(`${an}=${raw}`);
      }
      return kept.length ? `<${name} ${kept.join(" ")}>` : `<${name}>`;
    },
  );

  // 5. Defensive final pass — re-strip any on*= handler and re-neutralise any
  //    dangerous-protocol URL that a quoted `>` may have shielded from the
  //    earlier passes (belt-and-braces alongside the attribute-aware rebuild).
  s = stripOnHandlers(s);
  s = neutralizeDangerousUrls(s);

  // 6. Force <a target="_blank" rel="noopener noreferrer"> when href is
  //    external — defence against window.opener attacks.
  s = s.replace(new RegExp(`<a\\b(${TAG_BODY})>`, "gi"), (m, attrs: string) => {
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
