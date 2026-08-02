/**
 * Client-side payload summariser — counts items per section + flags
 * shape problems before sending to the server. Mirrors the server's
 * sanitisers (convex/onboarding/sanitize.ts) so what the user sees here
 * matches what the server accepts. Divergence between preview and
 * server was the silent-failure bug we hit before.
 */

export interface PreviewSection {
  key: string;
  label: string;
  count: number;
  ok: boolean;
  hint?: string;
  /** When the section is an array, how many items were dropped. */
  dropped?: number;
}

export interface PreviewSummary {
  sections: PreviewSection[];
  totalCount: number;
  fatalErrors: string[];
}

/** Strict-string check matching server's `asString` — value must be a
 *  non-empty string after trim. Truthy-only (`Boolean(x.fullName)`) was
 *  too loose: `{fullName: {first: "A"}}` would pass preview but fail
 *  server. */
function isStr(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/** First non-empty string from any candidate. Mirrors server's
 *  pickString fallback. */
function firstStr(...candidates: unknown[]): boolean {
  return candidates.some(isStr);
}

export function buildPreview(payload: Record<string, unknown>): PreviewSummary {
  const sections: PreviewSection[] = [];
  const fatalErrors: string[] = [];

  // ---- Profile ----------------------------------------------------
  if (payload.profile !== undefined) {
    const p = payload.profile as Record<string, unknown> | null;
    if (!p || typeof p !== "object") {
      sections.push({
        key: "profile",
        label: "Profil",
        count: 0,
        ok: false,
        hint: "Bukan objek JSON",
      });
    } else {
      const missing: string[] = [];
      if (!isStr(p.fullName)) missing.push("fullName");
      if (!isStr(p.location)) missing.push("location");
      if (!isStr(p.targetRole)) missing.push("targetRole");
      const ok = missing.length === 0;
      sections.push({
        key: "profile",
        label: "Profil",
        count: ok ? 1 : 0,
        ok,
        hint: ok ? undefined : `Butuh ${missing.join(" + ")}`,
      });
    }
  }

  // ---- CV ---------------------------------------------------------
  if (payload.cv !== undefined) {
    const c = payload.cv as Record<string, unknown> | null;
    if (!c || typeof c !== "object") {
      sections.push({ key: "cv", label: "CV", count: 0, ok: false, hint: "Bukan objek JSON" });
    } else {
      const pi = (c.personalInfo as Record<string, unknown> | undefined) ?? {};
      // Mirror server pickString fallbacks: top-level `fullName/name` + `email`.
      const hasName = firstStr(pi.fullName, pi.name, c.fullName, c.name);
      const hasEmail = firstStr(pi.email, c.email);
      const ok = hasName && hasEmail;
      const missing: string[] = [];
      if (!hasName) missing.push("personalInfo.fullName");
      if (!hasEmail) missing.push("personalInfo.email");
      sections.push({
        key: "cv",
        label: "CV",
        count: ok ? 1 : 0,
        ok,
        hint: ok ? undefined : `Butuh ${missing.join(" + ")}`,
      });

      // Also surface per-array preview drops so the user knows BEFORE
      // submitting that experience/education/etc items will be dropped.
      if (ok) {
        const subChecks: Array<[string, string, string[]]> = [
          ["experience", "pengalaman", ["company", "position", "startDate"]],
          ["education", "pendidikan", ["institution"]],
          ["skills", "skill", ["name"]],
          ["certifications", "sertifikasi", ["name"]],
          ["languages", "bahasa", ["language", "proficiency"]],
          ["projects", "proyek", ["name"]],
        ];
        const cvDropDetails: string[] = [];
        for (const [k, lbl, req] of subChecks) {
          const arr = c[k];
          if (!Array.isArray(arr) || arr.length === 0) continue;
          const valid = arr.filter((it) => {
            if (!it || typeof it !== "object") return false;
            const r = it as Record<string, unknown>;
            return req.every((f) => isStr(r[f]));
          }).length;
          const dropped = arr.length - valid;
          if (dropped > 0) cvDropDetails.push(`${dropped} ${lbl}`);
        }
        if (cvDropDetails.length > 0) {
          // Replace the existing CV section with one that surfaces the drops.
          const cvSection = sections[sections.length - 1];
          cvSection.hint = `CV terbaca, tapi ${cvDropDetails.join(", ")} akan dilewati (kurang field wajib)`;
          cvSection.ok = false;
        }
      }
    }
  }

  // ---- Array sections --------------------------------------------
  for (const [key, label, requires] of [
    ["portfolio", "Portofolio", ["title", "description", "date"]],
    ["goals", "Goals", ["title", "description"]],
    ["applications", "Lamaran", ["company", "position"]],
    ["contacts", "Kontak", ["name"]],
  ] as const) {
    if (payload[key] === undefined) continue;
    const arr = payload[key];
    if (!Array.isArray(arr)) {
      sections.push({
        key,
        label,
        count: 0,
        ok: false,
        hint: "Bukan array",
      });
      continue;
    }
    const valid = arr.filter((it) => {
      if (!it || typeof it !== "object") return false;
      const r = it as Record<string, unknown>;
      return requires.every((f) => isStr(r[f]));
    }).length;
    const dropped = arr.length - valid;
    sections.push({
      key,
      label,
      count: valid,
      ok: dropped === 0 && valid > 0,
      dropped,
      hint:
        valid === 0
          ? `Semua ${arr.length} item ditolak (butuh ${requires.join("/")})`
          : dropped > 0
            ? `${dropped} dari ${arr.length} item akan dilewati (butuh ${requires.join("/")})`
            : undefined,
    });
  }

  if (sections.length === 0) {
    fatalErrors.push(
      "JSON tidak punya section yang dikenal. Cek: kunci harus 'profile' / 'cv' / 'portfolio' / 'goals' / 'applications' / 'contacts'.",
    );
  }

  return {
    sections,
    totalCount: sections.reduce((s, x) => s + x.count, 0),
    fatalErrors,
  };
}
