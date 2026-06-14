/**
 * Small input-cap helpers for mutation args. Convex validators (`v.*`)
 * enforce shape/type but not length, so user free-text can otherwise be
 * stored unbounded. Errors are Indonesian to match the rest of the app.
 */

/** Trim + require non-empty, capped at `max`. Throws if empty or too long. */
export function requireLen(field: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error(`${field} harus 1-${max} karakter`);
  }
  return trimmed;
}

/**
 * Trim an OPTIONAL string and cap at `max`. Returns `undefined` for
 * absent/blank input (so clearing a field works), throws only when the
 * value exceeds `max`.
 */
export function capLen(
  field: string,
  value: string | undefined,
  max: number,
): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.length > max) {
    throw new Error(`${field} maksimal ${max} karakter`);
  }
  return trimmed;
}

/**
 * True if `text` carries a control character other than the three
 * whitespace ones we permit in free-text (tab, LF, CR). Mirrors the
 * check previously inlined in profile/mutations.ts so every cap can
 * reject smuggled NUL / ANSI escapes that would corrupt stored copy.
 */
export function containsControlChar(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 9 || code === 10 || code === 13) continue;
    if (code < 32 || code === 127) return true;
  }
  return false;
}

/**
 * Trim, length-cap, and control-char-reject a free-text field. This is
 * the canonical short-text validator shared by profile / application /
 * CV mutations — keep the Indonesian copy in sync with the rest of the
 * app. Returns the trimmed value; throws `"<field> maksimal N karakter"`
 * on oversize and `"<field> mengandung karakter tidak valid"` on a
 * control char.
 */
export function assertShortText(value: string, max: number, field: string): string {
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${field} maksimal ${max} karakter`);
  if (containsControlChar(trimmed)) {
    throw new Error(`${field} mengandung karakter tidak valid`);
  }
  return trimmed;
}

/**
 * Cap an array of free-text entries: at most `maxEntries` items, each
 * run through `assertShortText` with `maxLen`, dropping blanks. Throws
 * `"<field> maksimal N entri"` when the array is too long.
 */
export function capStringArray(
  values: string[],
  opts: { maxEntries: number; maxLen: number; field: string; entryField: string },
): string[] {
  if (values.length > opts.maxEntries) {
    throw new Error(`${opts.field} maksimal ${opts.maxEntries} entri`);
  }
  return values
    .map((s) => assertShortText(s, opts.maxLen, opts.entryField))
    .filter((s) => s.length > 0);
}
