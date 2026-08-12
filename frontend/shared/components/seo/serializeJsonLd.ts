/**
 * Serialise a JSON-LD payload for inlining inside `<script>`.
 *
 * Lives in its own `.ts` file rather than beside the component: vitest runs in
 * the node environment with no JSX transform, so a test importing `JsonLd.tsx`
 * dies at parse time. This is a security boundary and it needs a test more
 * than it needs to be colocated.
 *
 * `JSON.stringify` alone is NOT safe here. The HTML parser ends the element at
 * the first literal `</script`, wherever it appears — including in the middle
 * of a JSON string — so one field containing `</script><script>…` breaks out
 * of the block and runs. That was harmless while `<JsonLd>` only carried the
 * hardcoded Organization/WebSite objects on the landing page ("JSON.stringify
 * is safe; we control the input shape", as the old comment put it). It stopped
 * being true when /roadmap/[slug] began feeding it `roadmapTemplates` rows:
 * `publishMyRoadmap` sets `isPublic: true` with no moderation step, and trims
 * and length-caps the title, description, tags and node text without ever
 * touching an angle bracket.
 *
 * Escaping `<` is what closes the hole; `>` and `&` follow the OWASP guidance,
 * and the two line separators are legal inside a JSON string but end a line for
 * older JS parsers. A JSON parser decodes all five back, so the structured data
 * a crawler reads is identical to the input.
 */

/**
 * Built with `String.fromCharCode` rather than typed: U+2028 and U+2029 render
 * as nothing at all, so a literal one sitting in this file would be invisible
 * in the editor, in a diff, and in review.
 */
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LINE_SEP]: "\\u2028",
  [PARA_SEP]: "\\u2029",
};

const UNSAFE_IN_SCRIPT = new RegExp(`[<>&${LINE_SEP}${PARA_SEP}]`, "g");

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE_IN_SCRIPT, (c) => ESCAPES[c] ?? c);
}
