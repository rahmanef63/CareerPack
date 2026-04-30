"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { notify } from "@/shared/lib/notify";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  EXPORT_FORMAT, EXPORT_VERSION,
  type AuditableTemplate, type ExportEnvelope, type ExportTemplate,
  type LinkIssue, type LoadedTemplate, type TemplateDraft,
} from "../types/template";
import {
  auditLinks, configFromDoc, configToPayload, downloadJson,
  issuesToCsv, manifestFromDoc, manifestToPayload,
  parseImportPayload, toExport,
} from "../lib/template";

export function useTemplatePanel() {
  const templates = useQuery(api.admin.queries.listAllTemplates);
  const upsert = useMutation(api.admin.mutations.adminUpsertTemplate);
  const del = useMutation(api.admin.mutations.adminDeleteTemplate);
  const togglePublic = useMutation(api.admin.mutations.adminToggleTemplatePublic);
  const seedDefaults = useMutation(api.admin.mutations.adminSeedDefaultTemplates);
  const bulkUpsert = useMutation(api.admin.mutations.adminBulkUpsertTemplates);

  type Tpl = NonNullable<typeof templates>[number];

  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Id<"roadmapTemplates"> | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importDraft, setImportDraft] = useState<ExportTemplate[] | null>(null);
  const [importOverwrite, setImportOverwrite] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkActing, setBulkActing] = useState(false);
  const [auditIssues, setAuditIssues] = useState<LinkIssue[] | null>(null);

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const manifest = manifestToPayload(draft.manifest);
      const config = configToPayload(draft.config);
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
        ...(manifest ? { manifest } : {}),
        ...(config ? { config } : {}),
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

  function handleExportOne(tpl: Tpl) {
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
    const manifest = manifestToPayload(draft.manifest);
    const config = configToPayload(draft.config);
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
      ...(manifest ? { manifest } : {}),
      ...(config ? { config } : {}),
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
   * Sheet-scoped import: replaces draft basic info + nodes with the first
   * template from a JSON file. Preserves `draft.id` so an existing
   * template still updates instead of creating a duplicate slug.
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
        manifest: manifestFromDoc(t.manifest),
        config: configFromDoc(t.config),
      });
      const extra = items.length > 1 ? ` (${items.length - 1} entri lain dilewati — sheet ini hanya 1 template)` : "";
      notify.success(`Diimpor ke draft: ${t.title}${extra}`);
    } catch (err) {
      notify.fromError(err, "Gagal membaca file JSON");
    }
  }

  function handleRunAudit() {
    if (!templates) return;
    const issues = auditLinks(templates as unknown as ReadonlyArray<AuditableTemplate>);
    setAuditIssues(issues);
    if (issues.length === 0) notify.success("Tidak ada masalah link terdeteksi");
    else notify.error(`${issues.length} masalah link ditemukan`);
  }

  function handleAuditCopy() {
    if (!auditIssues) return;
    const text = auditIssues
      .map((i) => `${i.templateSlug} > ${i.nodeId} > ${i.url} — ${i.reason}`)
      .join("\n");
    void navigator.clipboard.writeText(text)
      .then(() => notify.success("Disalin ke clipboard"))
      .catch((err) => notify.fromError(err, "Gagal menyalin"));
  }

  function handleAuditCsv() {
    if (!auditIssues || auditIssues.length === 0) return;
    const csv = issuesToCsv(auditIssues);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `link-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  function openEdit(tpl: Tpl) {
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
      manifest: manifestFromDoc(tpl.manifest),
      config: configFromDoc(tpl.config),
    });
  }

  /**
   * Slug gets a `-copy` suffix; isSystem flips false so the duplicate is
   * editable + deletable.
   */
  function openDuplicate(tpl: Tpl) {
    setDraft({
      title: `${tpl.title} (Salinan)`,
      slug: `${tpl.slug}-copy`,
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
        resources: n.resources.map((r) => ({ ...r })),
      })),
      isPublic: false,
      isSystem: false,
      order: tpl.order,
      manifest: manifestFromDoc(tpl.manifest),
      config: configFromDoc(tpl.config),
    });
  }

  return {
    templates,
    togglePublic,
    draft, setDraft,
    deleteTarget, setDeleteTarget,
    seeding, saving,
    importDraft, setImportDraft,
    importOverwrite, setImportOverwrite,
    importing,
    fileInputRef,
    selectedIds, setSelectedIds,
    bulkDeleteOpen, setBulkDeleteOpen,
    bulkActing,
    auditIssues, setAuditIssues,
    handleSave, handleDelete, handleSeedDefaults,
    handleExportAll, handleExportOne, handleExportDraft,
    handleImportFile, handleConfirmImport, handleSheetImport,
    handleRunAudit, handleAuditCopy, handleAuditCsv,
    handleBulkExport, handleBulkDelete, handleBulkVisibility,
    openEdit, openDuplicate,
  };
}
