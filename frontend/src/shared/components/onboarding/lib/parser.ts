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

export function parseQuickFillJSON(input: string): ParseResult {
  const raw = input.trim();
  if (!raw) {
    return { ok: false, error: "Tempel JSON dari respon AI di kolom ini." };
  }

  // Strategy 1 — direct parse.
  const direct = tryParse(raw);
  if (direct) return { ok: true, value: direct };

  // Strategy 2 — strip markdown fence ```json ... ```.
  const fenced = stripFence(raw);
  if (fenced && fenced !== raw) {
    const f = tryParse(fenced);
    if (f) return { ok: true, value: f };
  }

  // Strategy 3 — extract first balanced { ... } substring.
  const extracted = extractFirstObject(raw);
  if (extracted) {
    const e = tryParse(extracted);
    if (e) return { ok: true, value: e };
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
