"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Edit3,
  Loader2,
  Plus,
  Sprout,
  Trash2,
  Wrench,
} from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { notify } from "@/shared/lib/notify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { Badge } from "@/shared/components/ui/badge";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";

type Tool = Doc<"aiTools">;

interface FormState {
  id?: Id<"aiTools">;
  type: string;
  label: string;
  description: string;
  payloadSchema: string;
  enabled: boolean;
}

const EMPTY: FormState = {
  type: "",
  label: "",
  description: "",
  payloadSchema: "",
  enabled: true,
};

export function AIToolsPanel() {
  const tools = useQuery(api.ai.queries.listAITools);
  const upsert = useMutation(api.ai.mutations.upsertAITool);
  const toggle = useMutation(api.ai.mutations.toggleAITool);
  const remove = useMutation(api.ai.mutations.deleteAITool);
  const seed = useMutation(api.ai.mutations.seedAITools);

  const [editing, setEditing] = useState<FormState | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const r = await seed({});
      notify.success(
        `Seed selesai — ${r.inserted} baru, ${r.updated} diperbarui, ${r.skipped} dilewati / ${r.total} total`,
      );
    } catch (err) {
      notify.fromError(err, "Gagal seed default");
    } finally {
      setSeeding(false);
    }
  };

  const handleEdit = (t: Tool) => {
    setEditing({
      id: t._id,
      type: t.type,
      label: t.label,
      description: t.description,
      payloadSchema: t.payloadSchema ?? "",
      enabled: t.enabled,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await upsert({
        id: editing.id,
        type: editing.type,
        label: editing.label,
        description: editing.description,
        payloadSchema: editing.payloadSchema.trim() || undefined,
        enabled: editing.enabled,
      });
      notify.success("Tool tersimpan");
      setEditing(null);
    } catch (err) {
      notify.fromError(err, "Gagal simpan tool");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: Tool) => {
    if (!confirm(`Hapus tool "${t.label}"?`)) return;
    try {
      await remove({ id: t._id });
      notify.success("Tool dihapus");
    } catch (err) {
      notify.fromError(err, "Gagal hapus tool");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-4 h-4 text-brand" />
              AI Tools
            </CardTitle>
            <CardDescription>
              Action terstruktur yang AI bisa kembalikan untuk user setujui.
              Type harus match whitelist di backend (
              <code className="text-[11px]">cv.fillExperience</code>,{" "}
              <code className="text-[11px]">nav.go</code>, dll.). Disable
              tool yang belum diimplementasi di client.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sprout className="w-4 h-4" />
              )}
              <span className="ml-2">Seed default</span>
            </Button>
            <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>
              <Plus className="w-4 h-4 mr-1" />
              Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tools === undefined ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : tools.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Belum ada tool. Klik <strong>Seed default</strong> untuk
              memuat 8 tool bawaan.
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {tools.map((t) => (
                <li key={t._id} className="flex flex-wrap items-start gap-3 px-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{t.label}</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {t.type}
                      </Badge>
                      {t.isSeed && (
                        <Badge variant="outline" className="text-[10px]">
                          default
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {t.description}
                    </p>
                    {t.payloadSchema && (
                      <code className="line-clamp-1 block text-[10px] text-muted-foreground">
                        {t.payloadSchema}
                      </code>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={t.enabled}
                      onCheckedChange={(v) =>
                        void toggle({ id: t._id, enabled: v })
                      }
                      aria-label={`Aktifkan ${t.label}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(t)}
                      aria-label={`Edit ${t.label}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    {!t.isSeed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(t)}
                        aria-label={`Hapus ${t.label}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <ResponsiveDialogContent size="lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {editing?.id ? "Edit tool" : "Tambah tool"}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Type harus cocok dengan whitelist server. Tool baru tidak akan
              dieksekusi sebelum frontend handler-nya ditambahkan.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {editing && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="tl-type">Type (unik)</Label>
                  <Input
                    id="tl-type"
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                    placeholder="cv.fillExperience"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tl-label">Label</Label>
                  <Input
                    id="tl-label"
                    value={editing.label}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                    placeholder="Tambah pengalaman ke CV"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="tl-desc">Deskripsi</Label>
                <Textarea
                  id="tl-desc"
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tl-schema">Payload schema (JSON, opsional)</Label>
                <Textarea
                  id="tl-schema"
                  value={editing.payloadSchema}
                  onChange={(e) =>
                    setEditing({ ...editing, payloadSchema: e.target.value })
                  }
                  rows={4}
                  className="font-mono text-xs"
                  placeholder='{ "company": "string", "position": "string" }'
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="tl-enabled"
                  checked={editing.enabled}
                  onCheckedChange={(v) => setEditing({ ...editing, enabled: v })}
                />
                <Label htmlFor="tl-enabled">Aktifkan</Label>
              </div>
            </div>
          )}

          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
