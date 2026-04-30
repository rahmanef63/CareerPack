import {
  EMPTY_MANIFEST, EMPTY_CONFIG,
  type ManifestDraft, type ConfigDraft,
  type ExportTemplate, type LoadedTemplate,
  type LinkIssue, type AuditableTemplate,
} from "../types/template";

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Heuristic URL checker — runs entirely client-side, no network calls.
 * Catches the common rot patterns the seed JSON accumulated:
 * placehold.co stubs, missing protocols, plain http, malformed URLs,
 * whitespace, in-node duplicates.
 */
export function auditLinks(templates: ReadonlyArray<AuditableTemplate>): LinkIssue[] {
  const issues: LinkIssue[] = [];
  for (const t of templates) {
    for (const node of t.nodes) {
      const seen = new Map<string, number>();
      for (const r of node.resources) {
        const url = r.url ?? "";
        const reasons: string[] = [];
        if (!url.trim()) {
          reasons.push("URL kosong");
        } else {
          if (url !== url.trim()) reasons.push("ada spasi di awal/akhir");
          const trimmed = url.trim();
          if (/placehold\.co|placehold\.it|placeholder\.com/i.test(trimmed)) {
            reasons.push("placeholder URL");
          }
          if (!/^https?:\/\//i.test(trimmed)) {
            reasons.push("tanpa protokol http/https");
          } else if (trimmed.startsWith("http://")) {
            reasons.push("insecure (http, bukan https)");
          }
          try {
            void new URL(trimmed);
          } catch {
            reasons.push("URL tidak valid");
          }
          const lower = trimmed.toLowerCase();
          const prev = seen.get(lower);
          seen.set(lower, (prev ?? 0) + 1);
          if (prev !== undefined) reasons.push("duplikat di node ini");
        }
        if (reasons.length > 0) {
          issues.push({
            templateId: t._id,
            templateSlug: t.slug,
            templateTitle: t.title,
            nodeId: node.id,
            nodeTitle: node.title,
            resourceTitle: r.title || "(tanpa judul)",
            url,
            reason: reasons.join("; "),
          });
        }
      }
    }
  }
  return issues;
}

export function issuesToCsv(issues: LinkIssue[]): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = ["template", "slug", "node", "resource", "url", "issue"].join(",");
  const lines = issues.map((i) =>
    [i.templateTitle, i.templateSlug, `${i.nodeId}: ${i.nodeTitle}`, i.resourceTitle, i.url, i.reason]
      .map(esc)
      .join(","),
  );
  return [header, ...lines].join("\n");
}

export function manifestFromDoc(raw: unknown): ManifestDraft {
  if (!raw || typeof raw !== "object") return { ...EMPTY_MANIFEST };
  const m = raw as Record<string, unknown>;
  const arr = (v: unknown): string =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean).join(", ") : "";
  return {
    version: typeof m.version === "string" ? m.version : "",
    license: typeof m.license === "string" ? m.license : "",
    language: typeof m.language === "string" ? m.language : "id",
    outcomes: arr(m.outcomes),
    prerequisites: arr(m.prerequisites),
    targetAudience: typeof m.targetAudience === "string" ? m.targetAudience : "",
  };
}

export function configFromDoc(raw: unknown): ConfigDraft {
  if (!raw || typeof raw !== "object") return { ...EMPTY_CONFIG };
  const c = raw as Record<string, unknown>;
  return {
    xpPerHour: typeof c.xpPerHour === "number" ? c.xpPerHour : "",
    theme: typeof c.theme === "string" ? c.theme : "",
    questFlavor: typeof c.questFlavor === "string" ? c.questFlavor : "",
  };
}

/**
 * Drop empty fields so saved doc stays clean — Convex `v.optional`
 * rejects `""` for numbers and we don't want to persist no-op manifests.
 */
export function manifestToPayload(d: ManifestDraft) {
  const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const out: Record<string, unknown> = {};
  if (d.version.trim()) out.version = d.version.trim();
  if (d.license.trim()) out.license = d.license.trim();
  if (d.language.trim()) out.language = d.language.trim();
  if (d.outcomes.trim()) out.outcomes = csv(d.outcomes);
  if (d.prerequisites.trim()) out.prerequisites = csv(d.prerequisites);
  if (d.targetAudience.trim()) out.targetAudience = d.targetAudience.trim();
  return Object.keys(out).length ? out : undefined;
}

export function configToPayload(d: ConfigDraft) {
  const out: Record<string, unknown> = {};
  if (typeof d.xpPerHour === "number" && Number.isFinite(d.xpPerHour)) out.xpPerHour = d.xpPerHour;
  if (d.theme.trim() && d.theme !== "__none__") out.theme = d.theme.trim();
  if (d.questFlavor.trim()) out.questFlavor = d.questFlavor.trim();
  return Object.keys(out).length ? out : undefined;
}

export function toExport(tpl: LoadedTemplate): ExportTemplate {
  return {
    title: tpl.title,
    slug: tpl.slug,
    domain: tpl.domain,
    icon: tpl.icon,
    color: tpl.color,
    description: tpl.description,
    tags: tpl.tags,
    nodes: tpl.nodes.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      difficulty: n.difficulty,
      estimatedHours: n.estimatedHours,
      prerequisites: n.prerequisites,
      ...(n.parentId !== undefined ? { parentId: n.parentId } : {}),
      ...(n.category !== undefined ? { category: n.category } : {}),
      ...(n.tags !== undefined ? { tags: n.tags } : {}),
      resources: n.resources.map((r) => ({ ...r })),
    })),
    isPublic: tpl.isPublic,
    isSystem: tpl.isSystem,
    order: tpl.order,
    ...(tpl.manifest ? { manifest: tpl.manifest } : {}),
    ...(tpl.config ? { config: tpl.config } : {}),
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Coerce parsed JSON into importable templates. Accepts envelope, raw
 * array, or single object. Throws Indonesian error when shape invalid.
 */
export function parseImportPayload(raw: unknown): ExportTemplate[] {
  let arr: unknown[];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.templates)) {
      arr = obj.templates;
    } else if (typeof obj.slug === "string" && Array.isArray(obj.nodes)) {
      arr = [obj];
    } else {
      throw new Error("Format JSON tidak dikenali (butuh array, envelope, atau objek tunggal).");
    }
  } else {
    throw new Error("File JSON kosong atau tidak valid.");
  }

  const out: ExportTemplate[] = [];
  arr.forEach((item, idx) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Entry #${idx + 1}: bukan objek.`);
    }
    const t = item as Record<string, unknown>;
    const must = (k: string, type: string) => {
      if (typeof t[k] !== type) throw new Error(`Entry #${idx + 1} (${String(t.slug ?? "?")}): "${k}" wajib ${type}.`);
    };
    must("title", "string");
    must("slug", "string");
    must("domain", "string");
    must("icon", "string");
    must("color", "string");
    must("description", "string");
    if (!Array.isArray(t.tags)) throw new Error(`Entry #${idx + 1}: "tags" harus array.`);
    if (!Array.isArray(t.nodes)) throw new Error(`Entry #${idx + 1}: "nodes" harus array.`);

    out.push({
      title: String(t.title),
      slug: String(t.slug),
      domain: String(t.domain),
      icon: String(t.icon),
      color: String(t.color),
      description: String(t.description),
      tags: (t.tags as unknown[]).map((x) => String(x)),
      nodes: (t.nodes as unknown[]).map((n, ni) => {
        if (!n || typeof n !== "object") throw new Error(`Entry #${idx + 1} node #${ni + 1}: bukan objek.`);
        const node = n as Record<string, unknown>;
        return {
          id: String(node.id ?? ""),
          title: String(node.title ?? ""),
          description: String(node.description ?? ""),
          difficulty: String(node.difficulty ?? "beginner"),
          estimatedHours: Number(node.estimatedHours ?? 0),
          prerequisites: Array.isArray(node.prerequisites)
            ? (node.prerequisites as unknown[]).map((x) => String(x))
            : [],
          ...(typeof node.parentId === "string" ? { parentId: node.parentId } : {}),
          ...(typeof node.category === "string" ? { category: node.category } : {}),
          ...(Array.isArray(node.tags)
            ? { tags: (node.tags as unknown[]).map((x) => String(x)) }
            : {}),
          resources: Array.isArray(node.resources)
            ? (node.resources as Array<Record<string, unknown>>).map((r) => ({
                id: String(r.id ?? ""),
                title: String(r.title ?? ""),
                type: String(r.type ?? "other"),
                url: String(r.url ?? ""),
                free: Boolean(r.free ?? true),
              }))
            : [],
        };
      }),
      isPublic: Boolean(t.isPublic ?? true),
      isSystem: Boolean(t.isSystem ?? false),
      order: Number(t.order ?? 0),
      ...(t.manifest && typeof t.manifest === "object"
        ? { manifest: t.manifest as Record<string, unknown> }
        : {}),
      ...(t.config && typeof t.config === "object"
        ? { config: t.config as Record<string, unknown> }
        : {}),
    });
  });

  return out;
}
