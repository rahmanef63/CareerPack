"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Database, ChevronDown, ChevronUp,
  GraduationCap, Code, Loader2,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
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

  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Id<"roadmapTemplates"> | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

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

        <CardContent>
          {templates === undefined ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada template. Klik &quot;Muat Default&quot; untuk memuat 42 template bawaan, atau buat template baru.
            </p>
          ) : (
            <div className="divide-y">
              {templates.map((tpl) => (
                <div key={tpl._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${tpl.color} flex items-center justify-center shrink-0`}>
                      <Code className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{tpl.title}</span>
                        <Badge variant="outline" className="text-[10px]">{tpl.domain}</Badge>
                        {tpl.isSystem && <Badge variant="secondary" className="text-[10px]">sistem</Badge>}
                        {!tpl.isPublic && <Badge variant="secondary" className="text-[10px] bg-muted">privat</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {tpl.slug} · {tpl.nodes.length} node
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePublic({ id: tpl._id, isPublic: !tpl.isPublic })}
                      className="p-1.5 rounded hover:bg-muted"
                      title={tpl.isPublic ? "Sembunyikan dari pengguna" : "Tampilkan ke pengguna"}
                    >
                      {tpl.isPublic
                        ? <Eye className="w-4 h-4 text-success" />
                        : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button
                      onClick={() => openEdit(tpl)}
                      className="p-1.5 rounded hover:bg-muted"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {!tpl.isSystem && (
                      <button
                        onClick={() => setDeleteTarget(tpl._id)}
                        className="p-1.5 rounded hover:bg-muted"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template editor sheet */}
      <Sheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>{draft?.id ? "Edit Template" : "Buat Template Baru"}</SheetTitle>
          </SheetHeader>

          {draft && (
            <ScrollArea className="flex-1">
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

          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDraft(null)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </div>
        </SheetContent>
      </Sheet>

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
