"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Edit3,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Sprout,
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

type Skill = Doc<"aiSkills">;

interface FormState {
  id?: Id<"aiSkills">;
  key: string;
  label: string;
  slashCommand: string;
  description: string;
  systemPrompt: string;
  enabled: boolean;
}

const EMPTY: FormState = {
  key: "",
  label: "",
  slashCommand: "",
  description: "",
  systemPrompt: "",
  enabled: true,
};

export function AISkillsPanel() {
  const skills = useQuery(api.ai.queries.listAISkills);
  const upsert = useMutation(api.ai.mutations.upsertAISkill);
  const toggle = useMutation(api.ai.mutations.toggleAISkill);
  const remove = useMutation(api.ai.mutations.deleteAISkill);
  const seed = useMutation(api.ai.mutations.seedAISkills);

  const [editing, setEditing] = useState<FormState | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const r = await seed({});
      notify.success(`Seed selesai — ${r.inserted} baru / ${r.total} total`);
    } catch (err) {
      notify.fromError(err, "Gagal seed default");
    } finally {
      setSeeding(false);
    }
  };

  const handleEdit = (s: Skill) => {
    setEditing({
      id: s._id,
      key: s.key,
      label: s.label,
      slashCommand: s.slashCommand ?? "",
      description: s.description,
      systemPrompt: s.systemPrompt,
      enabled: s.enabled,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await upsert({
        id: editing.id,
        key: editing.key,
        label: editing.label,
        slashCommand: editing.slashCommand.trim() || undefined,
        description: editing.description,
        systemPrompt: editing.systemPrompt,
        enabled: editing.enabled,
      });
      notify.success("Skill tersimpan");
      setEditing(null);
    } catch (err) {
      notify.fromError(err, "Gagal simpan skill");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Skill) => {
    if (!confirm(`Hapus skill "${s.label}"?`)) return;
    try {
      await remove({ id: s._id });
      notify.success("Skill dihapus");
    } catch (err) {
      notify.fromError(err, "Gagal hapus skill");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              AI Skills
            </CardTitle>
            <CardDescription>
              Template system-prompt yang dipicu oleh slash command. Misal{" "}
              <code className="text-[11px]">/cv</code> → mode CV writer. Edit
              prompt untuk mengubah perilaku AI tanpa redeploy.
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
          {skills === undefined ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : skills.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Belum ada skill. Klik <strong>Seed default</strong> untuk
              memuat 5 skill bawaan.
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {skills.map((s) => (
                <li
                  key={s._id}
                  className="flex flex-wrap items-start gap-3 px-3 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{s.label}</span>
                      {s.slashCommand && (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {s.slashCommand}
                        </Badge>
                      )}
                      {s.isSeed && (
                        <Badge variant="outline" className="text-[10px]">
                          default
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {s.description || s.systemPrompt.slice(0, 120)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={s.enabled}
                      onCheckedChange={(v) =>
                        void toggle({ id: s._id, enabled: v })
                      }
                      aria-label={`Aktifkan ${s.label}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(s)}
                      aria-label={`Edit ${s.label}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    {!s.isSeed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(s)}
                        aria-label={`Hapus ${s.label}`}
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
              {editing?.id ? "Edit skill" : "Tambah skill"}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Slash command memicu prompt ini. Contoh: <code>/cv</code> → mode
              CV writer.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {editing && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="sk-key">Key (unik)</Label>
                  <Input
                    id="sk-key"
                    value={editing.key}
                    onChange={(e) => setEditing({ ...editing, key: e.target.value })}
                    placeholder="cv-fill"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sk-label">Label</Label>
                  <Input
                    id="sk-label"
                    value={editing.label}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                    placeholder="Auto-isi CV"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sk-slash">Slash command (opsional)</Label>
                <Input
                  id="sk-slash"
                  value={editing.slashCommand}
                  onChange={(e) =>
                    setEditing({ ...editing, slashCommand: e.target.value })
                  }
                  placeholder="/cv"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sk-desc">Deskripsi</Label>
                <Input
                  id="sk-desc"
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  placeholder="Apa yang skill ini lakukan"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sk-prompt">System prompt</Label>
                <Textarea
                  id="sk-prompt"
                  value={editing.systemPrompt}
                  onChange={(e) =>
                    setEditing({ ...editing, systemPrompt: e.target.value })
                  }
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="sk-enabled"
                  checked={editing.enabled}
                  onCheckedChange={(v) => setEditing({ ...editing, enabled: v })}
                />
                <Label htmlFor="sk-enabled">Aktifkan</Label>
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
