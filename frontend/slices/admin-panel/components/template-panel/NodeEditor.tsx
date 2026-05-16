"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select";
import { genId } from "../../lib/template";
import { DIFFICULTY_OPTIONS, RESOURCE_TYPES, type TemplateNode } from "../../types/template";

interface NodeEditorProps {
  node: TemplateNode;
  allNodes: TemplateNode[];
  onChange: (updated: TemplateNode) => void;
  onRemove: () => void;
}

export function NodeEditor({ node, allNodes, onChange, onRemove }: NodeEditorProps) {
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
