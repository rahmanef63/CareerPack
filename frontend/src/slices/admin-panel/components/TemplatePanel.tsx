"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Database, ChevronDown, ChevronUp,
  GraduationCap, Loader2, Download, Upload, Search, ArrowUpDown,
  ArrowDown, ArrowUp, X,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/shared/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { notify } from "@/shared/lib/notify";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

// ---- Types ----

interface TemplateNode {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number | "";
  prerequisites: string[];
  parentId?: string;
  category?: string;
  resources: Array<{
    id: string;
    title: string;
    type: string;
    url: string;
    free: boolean;
  }>;
}

interface TemplateDraft {
  id?: Id<"roadmapTemplates">;
  title: string;
  slug: string;
  domain: string;
  icon: string;
  color: string;
  description: string;
  tags: string;
  nodes: TemplateNode[];
  isPublic: boolean;
  isSystem: boolean;
  order: number | "";
}

const EMPTY_DRAFT: TemplateDraft = {
  title: "", slug: "", domain: "tech", icon: "BookOpen",
  color: "bg-blue-500", description: "", tags: "",
  nodes: [], isPublic: true, isSystem: false, order: "",
};

const DOMAIN_OPTIONS = [
  { value: "tech", label: "Teknologi" },
  { value: "business", label: "Bisnis" },
  { value: "creative", label: "Kreatif" },
  { value: "education", label: "Pendidikan" },
  { value: "health", label: "Kesehatan" },
  { value: "finance", label: "Keuangan" },
  { value: "hr", label: "SDM" },
  { value: "operations", label: "Operasional" },
  { value: "government", label: "Pemerintahan" },
  { value: "social", label: "Sosial" },
  { value: "hospitality", label: "Hospitality" },
];

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Lanjutan" },
];

const RESOURCE_TYPES = ["video", "article", "course", "book", "practice", "documentation", "other"];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

type SortKey = "title" | "domain" | "nodes" | "order" | "isPublic";

// ---- Export / import shape ----

const EXPORT_FORMAT = "careerpack-roadmap-templates";
const EXPORT_VERSION = 1;

interface ExportTemplate {
  title: string;
  slug: string;
  domain: string;
  icon: string;
  color: string;
  description: string;
  tags: string[];
  nodes: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    estimatedHours: number;
    prerequisites: string[];
    parentId?: string;
    category?: string;
    tags?: string[];
    resources: Array<{
      id: string;
      title: string;
      type: string;
      url: string;
      free: boolean;
    }>;
  }>;
  isPublic: boolean;
  isSystem: boolean;
  order: number;
  manifest?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

interface ExportEnvelope {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  templates: ExportTemplate[];
}

type LoadedTemplate = {
  _id: Id<"roadmapTemplates">;
  title: string;
  slug: string;
  domain: string;
  icon: string;
  color: string;
  description: string;
  tags: string[];
  nodes: ExportTemplate["nodes"];
  isPublic: boolean;
  isSystem: boolean;
  order: number;
  manifest?: ExportTemplate["manifest"];
  config?: ExportTemplate["config"];
};

function toExport(tpl: LoadedTemplate): ExportTemplate {
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

function downloadJson(filename: string, data: unknown) {
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
 * Coerce a parsed JSON payload into an array of importable templates.
 * Accepts: an export envelope, a raw array, or a single object.
 * Throws with an Indonesian message when shape is invalid.
 */
function parseImportPayload(raw: unknown): ExportTemplate[] {
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

// ---- Node editor sub-component ----

interface NodeEditorProps {
  node: TemplateNode;
  allNodes: TemplateNode[];
  onChange: (updated: TemplateNode) => void;
  onRemove: () => void;
}

function NodeEditor({ node, allNodes, onChange, onRemove }: NodeEditorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 bg-muted/50 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
          <span className="text-sm font-medium truncate">{node.title || "(tanpa judul)"}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {node.difficulty || "beginner"}
          </Badge>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-destructive hover:text-destructive/80 p-1 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="p-3 space-y-3 border-t">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">ID Node *</Label>
              <Input
                value={node.id}
                onChange={(e) => onChange({ ...node, id: e.target.value })}
                placeholder="fe-1"
                className="h-8 text-sm font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Judul *</Label>
              <Input
                value={node.title}
                onChange={(e) => onChange({ ...node, title: e.target.value })}
                placeholder="HTML & CSS Dasar"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Deskripsi</Label>
            <Input
              value={node.description}
              onChange={(e) => onChange({ ...node, description: e.target.value })}
              placeholder="Deskripsi singkat topik ini"
              className="h-8 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Level</Label>
              <Select value={node.difficulty} onValueChange={(v) => onChange({ ...node, difficulty: v })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estimasi Jam</Label>
              <Input
                type="number"
                min={0}
                value={node.estimatedHours}
                onChange={(e) => onChange({ ...node, estimatedHours: e.target.value === "" ? "" : Number(e.target.value) })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Parent ID</Label>
              <Select
                value={node.parentId ?? "__none__"}
                onValueChange={(v) => onChange({ ...node, parentId: v === "__none__" ? undefined : v })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Tidak ada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tidak ada</SelectItem>
                  {allNodes.filter((n) => n.id !== node.id).map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.id} — {n.title.slice(0, 20)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Prerequisites (ID dipisah koma)</Label>
            <Input
              value={node.prerequisites.join(", ")}
              onChange={(e) => onChange({
                ...node,
                prerequisites: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })}
              placeholder="fe-1, fe-2"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Resources ({node.resources.length})</Label>
              <button
                type="button"
                onClick={() => onChange({
                  ...node,
                  resources: [...node.resources, { id: genId(), title: "", type: "video", url: "", free: true }],
                })}
                className="text-xs text-brand flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>
            {node.resources.map((r, ri) => (
              <div key={r.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <Input
                  value={r.title}
                  onChange={(e) => {
                    const rs = [...node.resources];
                    rs[ri] = { ...r, title: e.target.value };
                    onChange({ ...node, resources: rs });
                  }}
                  placeholder="Judul resource"
                  className="h-7 text-xs"
                />
                <div className="flex gap-1">
                  <Select
                    value={r.type}
                    onValueChange={(v) => {
                      const rs = [...node.resources];
                      rs[ri] = { ...r, type: v };
                      onChange({ ...node, resources: rs });
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={r.url}
                    onChange={(e) => {
                      const rs = [...node.resources];
                      rs[ri] = { ...r, url: e.target.value };
                      onChange({ ...node, resources: rs });
                    }}
                    placeholder="URL"
                    className="h-7 text-xs w-36"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...node, resources: node.resources.filter((_, i) => i !== ri) })}
                  className="text-destructive hover:text-destructive/80 pb-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main panel ----

export function TemplatePanel() {
  const templates = useQuery(api.admin.queries.listAllTemplates);
  const upsert = useMutation(api.admin.mutations.adminUpsertTemplate);
  const del = useMutation(api.admin.mutations.adminDeleteTemplate);
  const togglePublic = useMutation(api.admin.mutations.adminToggleTemplatePublic);
  const seedDefaults = useMutation(api.admin.mutations.adminSeedDefaultTemplates);
  const bulkUpsert = useMutation(api.admin.mutations.adminBulkUpsertTemplates);

  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Id<"roadmapTemplates"> | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importDraft, setImportDraft] = useState<ExportTemplate[] | null>(null);
  const [importOverwrite, setImportOverwrite] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sheetImportRef = useRef<HTMLInputElement | null>(null);

  // Search / filter / sort / selection state
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<"all" | string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all");
  const [originFilter, setOriginFilter] = useState<"all" | "system" | "user">("all");
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<Id<"roadmapTemplates">>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkActing, setBulkActing] = useState(false);

  const filtered = useMemo(() => {
    if (!templates) return [];
    let rows: typeof templates = templates;
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (domainFilter !== "all") rows = rows.filter((t) => t.domain === domainFilter);
    if (visibilityFilter === "public") rows = rows.filter((t) => t.isPublic);
    else if (visibilityFilter === "private") rows = rows.filter((t) => !t.isPublic);
    if (originFilter === "system") rows = rows.filter((t) => t.isSystem);
    else if (originFilter === "user") rows = rows.filter((t) => !t.isSystem);

    const sorted = [...rows].sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      switch (sortKey) {
        case "title": av = a.title.toLowerCase(); bv = b.title.toLowerCase(); break;
        case "domain": av = a.domain; bv = b.domain; break;
        case "nodes": av = a.nodes.length; bv = b.nodes.length; break;
        case "order": av = a.order; bv = b.order; break;
        case "isPublic": av = a.isPublic ? 1 : 0; bv = b.isPublic ? 1 : 0; break;
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [templates, search, domainFilter, visibilityFilter, originFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleSelectOne(id: Id<"roadmapTemplates">) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelectedInView =
    filtered.length > 0 && filtered.every((t) => selectedIds.has(t._id));
  const someSelectedInView =
    !allSelectedInView && filtered.some((t) => selectedIds.has(t._id));

  function toggleSelectAllInView() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedInView) {
        for (const t of filtered) next.delete(t._id);
      } else {
        for (const t of filtered) next.add(t._id);
      }
      return next;
    });
  }

  function clearSelection() { setSelectedIds(new Set()); }
  function clearFilters() {
    setSearch("");
    setDomainFilter("all");
    setVisibilityFilter("all");
    setOriginFilter("all");
  }
  const hasActiveFilters =
    search !== "" ||
    domainFilter !== "all" ||
    visibilityFilter !== "all" ||
    originFilter !== "all";

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await upsert({
        id: draft.id,
        title: draft.title,
        slug: draft.slug,
        domain: draft.domain,
        icon: draft.icon,
        color: draft.color,
        description: draft.description,
        tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
        nodes: draft.nodes.map((n) => ({
          ...n,
          estimatedHours: typeof n.estimatedHours === "number" ? n.estimatedHours : 0,
          resources: n.resources.map((r) => ({ ...r })),
        })),
        isPublic: draft.isPublic,
        isSystem: draft.isSystem,
        order: typeof draft.order === "number" ? draft.order : 0,
      });
      notify.success(draft.id ? "Template diperbarui" : "Template dibuat");
      setDraft(null);
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await del({ id: deleteTarget });
      notify.success("Template dihapus");
    } catch (err) {
      notify.fromError(err, "Gagal menghapus template");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleSeedDefaults(overwrite = false) {
    setSeeding(true);
    try {
      const result = await seedDefaults({ overwrite });
      notify.success(`Selesai: ${result.inserted} dimuat, ${result.skipped} dilewati`);
    } catch (err) {
      notify.fromError(err, "Gagal memuat template default");
    } finally {
      setSeeding(false);
    }
  }

  function handleExportAll() {
    if (!templates || templates.length === 0) {
      notify.error("Tidak ada template untuk diekspor");
      return;
    }
    const envelope: ExportEnvelope = {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      templates: templates.map((t) => toExport(t as unknown as LoadedTemplate)),
    };
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(`careerpack-templates-${stamp}.json`, envelope);
    notify.success(`Diekspor ${templates.length} template`);
  }

  function handleExportOne(tpl: NonNullable<typeof templates>[number]) {
    const envelope: ExportEnvelope = {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      templates: [toExport(tpl as unknown as LoadedTemplate)],
    };
    downloadJson(`template-${tpl.slug}.json`, envelope);
    notify.success(`Diekspor: ${tpl.title}`);
  }

  function handleExportDraft() {
    if (!draft) return;
    const tpl: ExportTemplate = {
      title: draft.title,
      slug: draft.slug,
      domain: draft.domain,
      icon: draft.icon,
      color: draft.color,
      description: draft.description,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      nodes: draft.nodes.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        difficulty: n.difficulty,
        estimatedHours: typeof n.estimatedHours === "number" ? n.estimatedHours : 0,
        prerequisites: n.prerequisites,
        ...(n.parentId !== undefined ? { parentId: n.parentId } : {}),
        ...(n.category !== undefined ? { category: n.category } : {}),
        resources: n.resources.map((r) => ({ ...r })),
      })),
      isPublic: draft.isPublic,
      isSystem: draft.isSystem,
      order: typeof draft.order === "number" ? draft.order : 0,
    };
    const envelope: ExportEnvelope = {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      templates: [tpl],
    };
    downloadJson(`template-${draft.slug || "draft"}.json`, envelope);
    notify.success("Draft diekspor");
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = parseImportPayload(parsed);
      if (items.length === 0) {
        notify.error("File tidak berisi template");
        return;
      }
      setImportDraft(items);
      setImportOverwrite(true);
    } catch (err) {
      notify.fromError(err, "Gagal membaca file JSON");
    }
  }

  async function handleConfirmImport() {
    if (!importDraft) return;
    setImporting(true);
    try {
      const result = await bulkUpsert({
        templates: importDraft as Parameters<typeof bulkUpsert>[0]["templates"],
        overwrite: importOverwrite,
      });
      const parts = [
        `${result.inserted} ditambah`,
        `${result.updated} diperbarui`,
        `${result.skipped} dilewati`,
      ];
      if (result.failed > 0) parts.push(`${result.failed} gagal`);
      notify.success(`Impor selesai: ${parts.join(", ")}`);
      if (result.failed > 0 && result.errors.length > 0) {
        const sample = result.errors.slice(0, 3).map((e) => `${e.slug}: ${e.message}`).join("\n");
        notify.error("Beberapa template gagal diimpor", { description: sample });
      }
      setImportDraft(null);
    } catch (err) {
      notify.fromError(err, "Gagal mengimpor template");
    } finally {
      setImporting(false);
    }
  }

  /**
   * Sheet-scoped import: replaces the current draft's basic info + nodes
   * with the first template from a JSON file. Preserves `draft.id` so an
   * existing template still updates instead of creating a duplicate slug.
   */
  async function handleSheetImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !draft) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = parseImportPayload(parsed);
      if (items.length === 0) {
        notify.error("File tidak berisi template");
        return;
      }
      const t = items[0]!;
      setDraft({
        id: draft.id,
        title: t.title,
        slug: t.slug,
        domain: t.domain,
        icon: t.icon,
        color: t.color,
        description: t.description,
        tags: t.tags.join(", "),
        nodes: t.nodes.map((n) => ({
          ...n,
          parentId: n.parentId,
          category: n.category,
        })),
        isPublic: t.isPublic,
        isSystem: t.isSystem,
        order: t.order,
      });
      const extra = items.length > 1 ? ` (${items.length - 1} entri lain dilewati — sheet ini hanya 1 template)` : "";
      notify.success(`Diimpor ke draft: ${t.title}${extra}`);
    } catch (err) {
      notify.fromError(err, "Gagal membaca file JSON");
    }
  }

  function handleBulkExport() {
    if (!templates) return;
    const sel = templates.filter((t) => selectedIds.has(t._id));
    if (sel.length === 0) return;
    const env: ExportEnvelope = {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      templates: sel.map((t) => toExport(t as unknown as LoadedTemplate)),
    };
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(`careerpack-templates-${stamp}-${sel.length}.json`, env);
    notify.success(`Diekspor ${sel.length} template terpilih`);
  }

  async function handleBulkDelete() {
    if (!templates) return;
    const sel = templates.filter((t) => selectedIds.has(t._id) && !t.isSystem);
    if (sel.length === 0) {
      notify.error("Tidak ada template yang bisa dihapus (sistem dilindungi)");
      setBulkDeleteOpen(false);
      return;
    }
    setBulkActing(true);
    let ok = 0;
    let fail = 0;
    for (const t of sel) {
      try { await del({ id: t._id }); ok++; }
      catch { fail++; }
    }
    setBulkActing(false);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());
    notify.success(`${ok} dihapus${fail > 0 ? `, ${fail} gagal` : ""}`);
  }

  async function handleBulkVisibility(makePublic: boolean) {
    if (!templates) return;
    const sel = templates.filter(
      (t) => selectedIds.has(t._id) && t.isPublic !== makePublic,
    );
    if (sel.length === 0) {
      notify.error(
        makePublic
          ? "Semua yang dipilih sudah publik"
          : "Semua yang dipilih sudah privat",
      );
      return;
    }
    setBulkActing(true);
    let ok = 0;
    let fail = 0;
    for (const t of sel) {
      try { await togglePublic({ id: t._id, isPublic: makePublic }); ok++; }
      catch { fail++; }
    }
    setBulkActing(false);
    notify.success(
      `${ok} ${makePublic ? "ditampilkan" : "disembunyikan"}${fail > 0 ? `, ${fail} gagal` : ""}`,
    );
  }

  function openEdit(tpl: NonNullable<typeof templates>[number]) {
    setDraft({
      id: tpl._id,
      title: tpl.title,
      slug: tpl.slug,
      domain: tpl.domain,
      icon: tpl.icon,
      color: tpl.color,
      description: tpl.description,
      tags: tpl.tags.join(", "),
      nodes: tpl.nodes.map((n) => ({
        ...n,
        estimatedHours: n.estimatedHours,
        parentId: n.parentId,
        category: n.category,
      })),
      isPublic: tpl.isPublic,
      isSystem: tpl.isSystem,
      order: tpl.order,
    });
  }

  const domainCount = templates
    ? Object.entries(
        templates.reduce<Record<string, number>>((acc, t) => {
          acc[t.domain] = (acc[t.domain] ?? 0) + 1;
          return acc;
        }, {})
      )
    : [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand" />
                Template Roadmap
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola template roadmap yang tersedia untuk pengguna. Pengguna memilih template → progress disimpan per-akun.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSeedDefaults(false)}
                disabled={seeding}
              >
                {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                Muat Default
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSeedDefaults(true)}
                disabled={seeding}
                title="Timpa template yang sudah ada"
              >
                Muat + Timpa
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleExportAll}
                disabled={!templates || templates.length === 0}
                title="Ekspor semua template ke JSON"
                aria-label="Ekspor semua"
                className="h-9 w-9"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                title="Impor template dari file JSON"
                aria-label="Impor JSON"
                className="h-9 w-9"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                size="sm"
                onClick={() => setDraft({ ...EMPTY_DRAFT })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Template
              </Button>
            </div>
          </div>

          {/* Domain summary */}
          {domainCount.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {domainCount.map(([domain, count]) => (
                <Badge key={domain} variant="secondary" className="text-xs">
                  {domain}: {count}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Toolbar: search + filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul / slug / tag…"
                className="pl-8 h-9"
              />
            </div>
            <Select value={domainFilter} onValueChange={(v) => setDomainFilter(v)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Domain</SelectItem>
                {DOMAIN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={visibilityFilter}
              onValueChange={(v) => setVisibilityFilter(v as typeof visibilityFilter)}
            >
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Visibilitas</SelectItem>
                <SelectItem value="public">Publik</SelectItem>
                <SelectItem value="private">Privat</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={originFilter}
              onValueChange={(v) => setOriginFilter(v as typeof originFilter)}
            >
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Asal</SelectItem>
                <SelectItem value="system">Sistem</SelectItem>
                <SelectItem value="user">Pengguna</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters} className="h-9">
                <X className="w-4 h-4 mr-1" /> Reset
              </Button>
            )}
          </div>

          {/* Selection bar — only when 1+ rows selected */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg border border-brand/40 bg-brand-muted/30">
              <span className="text-sm font-medium">
                {selectedIds.size} dipilih
              </span>
              <div className="flex flex-wrap gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={handleBulkExport} disabled={bulkActing}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Ekspor
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkVisibility(true)} disabled={bulkActing}>
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Tampilkan
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkVisibility(false)} disabled={bulkActing}>
                  <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Sembunyikan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkDeleteOpen(true)}
                  disabled={bulkActing}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection} disabled={bulkActing}>
                  Bersihkan
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {templates === undefined ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada template. Klik &quot;Muat Default&quot; untuk memuat template bawaan, atau buat template baru.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Tidak ada template yang cocok dengan filter saat ini.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          allSelectedInView
                            ? true
                            : someSelectedInView
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={toggleSelectAllInView}
                        aria-label="Pilih semua di tampilan"
                      />
                    </TableHead>
                    <SortHeader
                      label="Template"
                      activeKey={sortKey}
                      thisKey="title"
                      dir={sortDir}
                      onClick={() => toggleSort("title")}
                    />
                    <SortHeader
                      label="Domain"
                      activeKey={sortKey}
                      thisKey="domain"
                      dir={sortDir}
                      onClick={() => toggleSort("domain")}
                      className="hidden md:table-cell w-[140px]"
                    />
                    <SortHeader
                      label="Node"
                      activeKey={sortKey}
                      thisKey="nodes"
                      dir={sortDir}
                      onClick={() => toggleSort("nodes")}
                      className="hidden sm:table-cell w-[80px] text-right"
                      align="right"
                    />
                    <SortHeader
                      label="Urutan"
                      activeKey={sortKey}
                      thisKey="order"
                      dir={sortDir}
                      onClick={() => toggleSort("order")}
                      className="hidden lg:table-cell w-[80px] text-right"
                      align="right"
                    />
                    <SortHeader
                      label="Publik"
                      activeKey={sortKey}
                      thisKey="isPublic"
                      dir={sortDir}
                      onClick={() => toggleSort("isPublic")}
                      className="hidden lg:table-cell w-[80px]"
                    />
                    <TableHead className="w-[140px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tpl) => {
                    const checked = selectedIds.has(tpl._id);
                    return (
                      <TableRow
                        key={tpl._id}
                        data-state={checked ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleSelectOne(tpl._id)}
                            aria-label={`Pilih ${tpl.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg ${tpl.color} flex items-center justify-center shrink-0`}>
                              <GraduationCap className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-sm truncate">{tpl.title}</span>
                                {tpl.isSystem && (
                                  <Badge variant="secondary" className="text-[9px] h-4 px-1 leading-none">sistem</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {tpl.slug} · {tpl.nodes.length} node
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-[10px] uppercase">{tpl.domain}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right tabular-nums text-xs text-muted-foreground">
                          {tpl.nodes.length}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right tabular-nums text-xs text-muted-foreground">
                          {tpl.order}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {tpl.isPublic ? (
                            <Eye className="w-4 h-4 text-success" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              onClick={() => togglePublic({ id: tpl._id, isPublic: !tpl.isPublic })}
                              className="p-1.5 rounded hover:bg-muted"
                              title={tpl.isPublic ? "Sembunyikan" : "Tampilkan"}
                            >
                              {tpl.isPublic
                                ? <Eye className="w-4 h-4 text-success" />
                                : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            <button
                              onClick={() => handleExportOne(tpl)}
                              className="p-1.5 rounded hover:bg-muted"
                              title="Ekspor JSON"
                            >
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => openEdit(tpl)}
                              className="p-1.5 rounded hover:bg-muted"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {!tpl.isSystem && (
                              <button
                                onClick={() => setDeleteTarget(tpl._id)}
                                className="p-1.5 rounded hover:bg-muted"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Result count */}
          {templates && templates.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Menampilkan <strong>{filtered.length}</strong> dari {templates.length} template
              {selectedIds.size > 0 && ` · ${selectedIds.size} dipilih`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Template editor sheet */}
      <Sheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle>{draft?.id ? "Edit Template" : "Buat Template Baru"}</SheetTitle>
              {draft && (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleExportDraft}
                    title="Ekspor draft ke JSON"
                    aria-label="Ekspor draft"
                    className="h-8 w-8"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => sheetImportRef.current?.click()}
                    title="Impor JSON ke draft (timpa isi sekarang)"
                    aria-label="Impor ke draft"
                    className="h-8 w-8"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <input
                    ref={sheetImportRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={handleSheetImport}
                  />
                </div>
              )}
            </div>
          </SheetHeader>

          {draft && (
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-4 space-y-5">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <Label>Judul *</Label>
                    <Input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="Frontend Developer"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Slug * (unik, huruf kecil)</Label>
                    <Input
                      value={draft.slug}
                      onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                      placeholder="frontend"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Domain</Label>
                    <Select value={draft.domain} onValueChange={(v) => setDraft({ ...draft, domain: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOMAIN_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Icon (lucide-react name)</Label>
                    <Input
                      value={draft.icon}
                      onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                      placeholder="BookOpen"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Warna (tailwind bg class)</Label>
                    <Input
                      value={draft.color}
                      onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                      placeholder="bg-blue-500"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Deskripsi</Label>
                    <Input
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      placeholder="Jalur karir pengembang frontend web"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Tags (pisah koma)</Label>
                    <Input
                      value={draft.tags}
                      onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                      placeholder="react, javascript, web"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Urutan tampil</Label>
                    <Input
                      type="number"
                      value={draft.order}
                      onChange={(e) => setDraft({ ...draft, order: e.target.value === "" ? "" : Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="tpl-public"
                      checked={draft.isPublic}
                      onCheckedChange={(v) => setDraft({ ...draft, isPublic: v })}
                    />
                    <Label htmlFor="tpl-public">Tampil ke pengguna</Label>
                  </div>
                </div>

                {/* Nodes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Node / Topik ({draft.nodes.length})</Label>
                    <button
                      type="button"
                      onClick={() => setDraft({
                        ...draft,
                        nodes: [...draft.nodes, {
                          id: genId(), title: "", description: "", difficulty: "beginner",
                          estimatedHours: 10, prerequisites: [], resources: [],
                        }],
                      })}
                      className="text-sm text-brand flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Tambah Node
                    </button>
                  </div>
                  <div className="space-y-2">
                    {draft.nodes.map((node, idx) => (
                      <NodeEditor
                        key={node.id || idx}
                        node={node}
                        allNodes={draft.nodes}
                        onChange={(updated) => {
                          const nodes = [...draft.nodes];
                          nodes[idx] = updated;
                          setDraft({ ...draft, nodes });
                        }}
                        onRemove={() => setDraft({
                          ...draft,
                          nodes: draft.nodes.filter((_, i) => i !== idx),
                        })}
                      />
                    ))}
                    {draft.nodes.length === 0 && (
                      <p className="text-sm text-muted-foreground">Belum ada node. Klik &quot;Tambah Node&quot;.</p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <div className="px-6 py-4 border-t flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={() => setDraft(null)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Import confirm */}
      <AlertDialog open={!!importDraft} onOpenChange={(o) => !o && !importing && setImportDraft(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Impor Template?</AlertDialogTitle>
            <AlertDialogDescription>
              {importDraft && (
                <>
                  File berisi <strong>{importDraft.length}</strong> template.
                  Slug yang sudah ada akan {importOverwrite ? "ditimpa" : "dilewati"}.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {importDraft && importDraft.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded border bg-muted/30 px-3 py-2 text-xs space-y-1">
              {importDraft.slice(0, 20).map((t) => (
                <div key={t.slug} className="flex items-center justify-between gap-2">
                  <span className="font-mono truncate">{t.slug}</span>
                  <span className="text-muted-foreground truncate">{t.title}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{t.nodes.length} node</Badge>
                </div>
              ))}
              {importDraft.length > 20 && (
                <p className="text-muted-foreground italic">…dan {importDraft.length - 20} lainnya</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Switch
              id="import-overwrite"
              checked={importOverwrite}
              onCheckedChange={setImportOverwrite}
              disabled={importing}
            />
            <Label htmlFor="import-overwrite" className="cursor-pointer">
              Timpa template yang sudah ada (cocok untuk perbaiki link rusak)
            </Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={importing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmImport();
              }}
              disabled={importing}
            >
              {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Impor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirm */}
      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(o) => !o && !bulkActing && setBulkDeleteOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} template?</AlertDialogTitle>
            <AlertDialogDescription>
              Template sistem akan dilewati otomatis. Roadmap pengguna yang
              sudah di-seed tidak terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkActing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleBulkDelete();
              }}
              disabled={bulkActing}
              className="bg-destructive text-destructive-foreground"
            >
              {bulkActing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Template akan dihapus permanen. Roadmap pengguna yang sudah di-seed tidak terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---- Sortable column header ----

interface SortHeaderProps {
  label: string;
  activeKey: SortKey;
  thisKey: SortKey;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
  align?: "left" | "right";
}

function SortHeader({ label, activeKey, thisKey, dir, onClick, className, align = "left" }: SortHeaderProps) {
  const active = activeKey === thisKey;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground transition-colors",
          align === "right" && "ml-auto",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon className="w-3 h-3 opacity-60" />
      </button>
    </TableHead>
  );
}
