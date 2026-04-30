"use client";

import { useRef } from "react";
import { Download, Loader2, Plus, Upload } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/shared/components/ui/sheet";
import { Switch } from "@/shared/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import { NodeEditor } from "./NodeEditor";
import { genId } from "./lib";
import {
  DOMAIN_OPTIONS, THEME_OPTIONS,
  type TemplateDraft,
} from "./types";

interface TemplateEditorSheetProps {
  draft: TemplateDraft | null;
  setDraft: (d: TemplateDraft | null) => void;
  saving: boolean;
  onSave: () => void;
  onExport: () => void;
  onSheetImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TemplateEditorSheet({
  draft, setDraft, saving, onSave, onExport, onSheetImport,
}: TemplateEditorSheetProps) {
  const sheetImportRef = useRef<HTMLInputElement | null>(null);

  return (
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
                  onClick={onExport}
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
                  onChange={onSheetImport}
                />
              </div>
            )}
          </div>
        </SheetHeader>

        {draft && (
          <Tabs defaultValue="info" className="flex-1 min-h-0 flex flex-col">
            <div className="px-6 pt-3 pb-2 border-b shrink-0">
              <TabsList variant="equal" cols={4}>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="nodes">
                  Node{draft.nodes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">
                      {draft.nodes.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="manifest">Manifest</TabsTrigger>
                <TabsTrigger value="config">Konfigurasi</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <TabsContent value="info" className="px-6 py-4 mt-0">
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

                <div className="flex items-center gap-6 mt-5">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="tpl-public"
                      checked={draft.isPublic}
                      onCheckedChange={(v) => setDraft({ ...draft, isPublic: v })}
                    />
                    <Label htmlFor="tpl-public">Tampil ke pengguna</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nodes" className="px-6 py-4 mt-0">
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
              </TabsContent>

              <TabsContent value="manifest" className="px-6 py-4 mt-0">
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Manifest = metadata deklaratif tentang roadmap. Tools eksternal (export, share, embed) dapat membaca info ini. Semua opsional — kosongkan untuk default.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Versi</Label>
                      <Input
                        value={draft.manifest.version}
                        onChange={(e) => setDraft({ ...draft, manifest: { ...draft.manifest, version: e.target.value } })}
                        placeholder="1.0.0"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Lisensi</Label>
                      <Input
                        value={draft.manifest.license}
                        onChange={(e) => setDraft({ ...draft, manifest: { ...draft.manifest, license: e.target.value } })}
                        placeholder="CC-BY-SA-4.0"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Bahasa</Label>
                      <Input
                        value={draft.manifest.language}
                        onChange={(e) => setDraft({ ...draft, manifest: { ...draft.manifest, language: e.target.value } })}
                        placeholder="id"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Audiens Sasaran</Label>
                      <Input
                        value={draft.manifest.targetAudience}
                        onChange={(e) => setDraft({ ...draft, manifest: { ...draft.manifest, targetAudience: e.target.value } })}
                        placeholder="Pemula tech, fresh graduate"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Outcomes (pisah koma)</Label>
                    <Textarea
                      rows={2}
                      value={draft.manifest.outcomes}
                      onChange={(e) => setDraft({ ...draft, manifest: { ...draft.manifest, outcomes: e.target.value } })}
                      placeholder="Membuat web responsif, Deploy aplikasi, Memahami state management"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Prasyarat (pisah koma)</Label>
                    <Textarea
                      rows={2}
                      value={draft.manifest.prerequisites}
                      onChange={(e) => setDraft({ ...draft, manifest: { ...draft.manifest, prerequisites: e.target.value } })}
                      placeholder="Logika dasar, akses internet"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="config" className="px-6 py-4 mt-0">
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Konfigurasi mengontrol perilaku gamifikasi: tema kelas, XP per jam belajar, narasi quest. Semua opsional — biarkan kosong untuk pakai default.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>XP per Jam</Label>
                      <Input
                        type="number"
                        min={0}
                        value={draft.config.xpPerHour}
                        onChange={(e) => setDraft({ ...draft, config: { ...draft.config, xpPerHour: e.target.value === "" ? "" : Number(e.target.value) } })}
                        placeholder="10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Tema Kelas</Label>
                      <Select
                        value={draft.config.theme || "__none__"}
                        onValueChange={(v) => setDraft({ ...draft, config: { ...draft.config, theme: v === "__none__" ? "" : v } })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THEME_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Quest Flavor (narasi gaya RPG)</Label>
                    <Textarea
                      rows={3}
                      value={draft.config.questFlavor}
                      onChange={(e) => setDraft({ ...draft, config: { ...draft.config, questFlavor: e.target.value } })}
                      placeholder="Selamat datang, petualang. Selesaikan setiap quest untuk menjadi master frontend…"
                    />
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}

        <div className="px-6 py-4 border-t flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={() => setDraft(null)}>Batal</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Simpan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
