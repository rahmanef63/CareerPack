/**
 * Client-side payload summariser — counts items per section + flags
 * shape problems before sending to the server. The server runs the
 * authoritative sanitiser; this just gives the user a fast preview
 * + early validation cues.
 */

export interface PreviewSection {
  key: string;
  label: string;
  count: number;
  ok: boolean;
  hint?: string;
}

export interface PreviewSummary {
  sections: PreviewSection[];
  totalCount: number;
  fatalErrors: string[];
}

export function buildPreview(payload: Record<string, unknown>): PreviewSummary {
  const sections: PreviewSection[] = [];
  const fatalErrors: string[] = [];

  // Profile
  if (payload.profile !== undefined) {
    const p = payload.profile as Record<string, unknown> | null;
    if (!p || typeof p !== "object") {
      sections.push({
        key: "profile",
        label: "Profil",
        count: 0,
        ok: false,
        hint: "Bukan objek",
      });
    } else {
      const ok = Boolean(p.fullName && p.location && p.targetRole);
      sections.push({
        key: "profile",
        label: "Profil",
        count: ok ? 1 : 0,
        ok,
        hint: ok ? undefined : "Butuh fullName + location + targetRole",
      });
    }
  }

  // CV
  if (payload.cv !== undefined) {
    const c = payload.cv as Record<string, unknown> | null;
    if (!c || typeof c !== "object") {
      sections.push({ key: "cv", label: "CV", count: 0, ok: false, hint: "Bukan objek" });
    } else {
      const pi = c.personalInfo as Record<string, unknown> | undefined;
      const ok = Boolean(pi?.fullName && pi?.email);
      sections.push({
        key: "cv",
        label: "CV",
        count: ok ? 1 : 0,
        ok,
        hint: ok ? undefined : "Butuh personalInfo.fullName + personalInfo.email",
      });
    }
  }

  // Array sections
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
      return requires.every((f) => typeof r[f] === "string" && (r[f] as string).trim());
    }).length;
    sections.push({
      key,
      label,
      count: valid,
      ok: valid === arr.length,
      hint:
        valid === arr.length
          ? undefined
          : `${arr.length - valid} item dilewati (kurang ${requires.join("/")})`,
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
