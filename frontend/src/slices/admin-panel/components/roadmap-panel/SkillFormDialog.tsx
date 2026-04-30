"use client";

import type { Dispatch, SetStateAction } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import {
  LEVELS, LEVEL_LABEL, RESOURCE_TYPES, STATUSES, STATUS_LABEL,
} from "../../constants/roadmap";
import type { SkillDraft } from "../../types/roadmap";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skillDraft: SkillDraft;
  setSkillDraft: Dispatch<SetStateAction<SkillDraft>>;
  busy: boolean;
  onSave: () => void;
}

export function SkillFormDialog({
  open, onOpenChange, skillDraft, setSkillDraft, busy, onSave,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {skillDraft.name ? `Edit: ${skillDraft.name}` : "Tambah Skill"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* name + category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sk-name">
                Nama Skill <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sk-name"
                value={skillDraft.name}
                onChange={(e) => setSkillDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="cth. React, TypeScript"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sk-category">
                Kategori <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sk-category"
                value={skillDraft.category}
                onChange={(e) => setSkillDraft((d) => ({ ...d, category: e.target.value }))}
                placeholder="cth. Programming, Soft Skills"
              />
            </div>
          </div>

          {/* level + status + priority + hours */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select
                value={skillDraft.level}
                onValueChange={(v) => setSkillDraft((d) => ({ ...d, level: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{LEVEL_LABEL[l]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={skillDraft.status}
                onValueChange={(v) => setSkillDraft((d) => ({ ...d, status: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sk-priority">Prioritas</Label>
              <Input
                id="sk-priority"
                type="number"
                min={0}
                max={999}
                value={skillDraft.priority}
                onChange={(e) =>
                  setSkillDraft((d) => ({
                    ...d,
                    priority: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sk-hours">Estimasi Jam</Label>
              <Input
                id="sk-hours"
                type="number"
                min={0}
                value={skillDraft.estimatedHours}
                onChange={(e) =>
                  setSkillDraft((d) => ({
                    ...d,
                    estimatedHours: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {/* prerequisites */}
          <div className="space-y-1.5">
            <Label htmlFor="sk-prereqs">Prasyarat (ID skill, pisah koma)</Label>
            <Input
              id="sk-prereqs"
              value={skillDraft.prerequisites}
              onChange={(e) => setSkillDraft((d) => ({ ...d, prerequisites: e.target.value }))}
              placeholder="cth. html-css, javascript"
            />
          </div>

          <Separator />

          {/* resources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Resources ({skillDraft.resources.length}/20)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={skillDraft.resources.length >= 20}
                onClick={() =>
                  setSkillDraft((d) => ({
                    ...d,
                    resources: [
                      ...d.resources,
                      { type: "article", title: "", url: "", completed: false },
                    ],
                  }))
                }
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Resource
              </Button>
            </div>

            {skillDraft.resources.length === 0 && (
              <p className="text-xs text-muted-foreground">Belum ada resource.</p>
            )}

            {skillDraft.resources.map((res, idx) => (
              <div
                key={idx}
                className="grid gap-2 items-center"
                style={{ gridTemplateColumns: "110px 1fr 1fr auto auto" }}
              >
                <Select
                  value={res.type}
                  onValueChange={(v) =>
                    setSkillDraft((d) => {
                      const r = [...d.resources];
                      r[idx] = { ...r[idx], type: v };
                      return { ...d, resources: r };
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="h-8 text-xs"
                  placeholder="Judul"
                  value={res.title}
                  onChange={(e) =>
                    setSkillDraft((d) => {
                      const r = [...d.resources];
                      r[idx] = { ...r[idx], title: e.target.value };
                      return { ...d, resources: r };
                    })
                  }
                />
                <Input
                  className="h-8 text-xs"
                  placeholder="URL"
                  value={res.url}
                  onChange={(e) =>
                    setSkillDraft((d) => {
                      const r = [...d.resources];
                      r[idx] = { ...r[idx], url: e.target.value };
                      return { ...d, resources: r };
                    })
                  }
                />
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id={`res-done-${idx}`}
                    checked={res.completed}
                    onCheckedChange={(checked) =>
                      setSkillDraft((d) => {
                        const r = [...d.resources];
                        r[idx] = { ...r[idx], completed: Boolean(checked) };
                        return { ...d, resources: r };
                      })
                    }
                  />
                  <Label htmlFor={`res-done-${idx}`} className="text-xs cursor-pointer">
                    Selesai
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() =>
                    setSkillDraft((d) => ({
                      ...d,
                      resources: d.resources.filter((_, i) => i !== idx),
                    }))
                  }
                  aria-label="Hapus resource"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={onSave}
            disabled={busy || !skillDraft.name.trim() || !skillDraft.category.trim()}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
