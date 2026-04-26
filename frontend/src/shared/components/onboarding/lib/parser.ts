/**
 * Lenient JSON extractor — accepts AI replies in any of these forms:
 *   - pure JSON
 *   - JSON wrapped in ```json … ``` or ``` … ```
 *   - JSON embedded inside prose ("Sure! Here's your JSON: {...} Hope it
 *     helps!")
 *
 * Returns the parsed object or a structured error so the UI can hint
 * the user about what to fix.
 */

export type ParseResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string };

const KNOWN_SECTION_KEYS = new Set([
  "profile",
  "cv",
  "portfolio",
  "goals",
  "applications",
  "contacts",
]);

/** Some AI replies wrap the payload in a single key like `{ data: {...} }`,
 *  `{ response: {...} }`, or `{ result: {...} }`. If the parsed object's
 *  keys don't include any known section but the single nested object does,
 *  unwrap it. Recurses one extra level so `{ data: { result: {...} } }` works. */
function unwrapShell(obj: Record<string, unknown>, depth = 2): Record<string, unknown> {
  if (depth <= 0) return obj;
  const keys = Object.keys(obj);
  const hasKnown = keys.some((k) => KNOWN_SECTION_KEYS.has(k));
  if (hasKnown) return obj;
  if (keys.length === 1) {
    const inner = obj[keys[0]];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return unwrapShell(inner as Record<string, unknown>, depth - 1);
    }
  }
  return obj;
}

export function parseQuickFillJSON(input: string): ParseResult {
  const raw = input.trim();
  if (!raw) {
    return { ok: false, error: "Tempel JSON dari respon AI di kolom ini." };
  }

  // Strategy 1 — direct parse.
  const direct = tryParse(raw);
  if (direct) return { ok: true, value: unwrapShell(direct) };

  // Strategy 2 — strip markdown fence ```json ... ```.
  const fenced = stripFence(raw);
  if (fenced && fenced !== raw) {
    const f = tryParse(fenced);
    if (f) return { ok: true, value: unwrapShell(f) };
  }

  // Strategy 3 — extract first balanced { ... } substring.
  const extracted = extractFirstObject(raw);
  if (extracted) {
    const e = tryParse(extracted);
    if (e) return { ok: true, value: unwrapShell(e) };
  }

  return {
    ok: false,
    error:
      "JSON tidak terbaca. Pastikan: tidak ada teks sebelum/sesudah, kunci pakai tanda kutip ganda, koma trailing dibuang.",
  };
}

function tryParse(s: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function stripFence(s: string): string | null {
  // Match ```json ... ``` or ``` ... ``` (json optional).
  const m = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (!m) return null;
  return m[1].trim();
}

function extractFirstObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (c === "\\") {
        escaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        return s.slice(start, i + 1);
      }
    }
  }
  return null;
}
