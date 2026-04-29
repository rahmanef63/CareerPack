"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  BookOpen,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Progress } from "@/shared/components/ui/progress";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { DataTable } from "@/shared/components/data-table";
import type { ColumnDef } from "@/shared/components/data-table";
import { formatDate } from "@/shared/lib/formatDate";

// ---- Types ----

type RoadmapRow = NonNullable<
  ReturnType<typeof useQuery<typeof api.admin.queries.listAllRoadmaps>>
>[number];
type SkillShape = RoadmapRow["skills"][number];

type ResourceDraft = {
  type: string;
  title: string;
  url: string;
  completed: boolean;
};

type SkillDraft = {
  id: string;
  name: string;
  category: string;
  level: string;
  status: string;
  priority: number | "";
  estimatedHours: number | "";
  prerequisites: string;
  resources: ResourceDraft[];
};

// ---- Constants ----

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const STATUSES = ["not-started", "in-progress", "completed"] as const;
const RESOURCE_TYPES = [
  "course", "book", "article", "video", "practice", "documentation", "other",
] as const;

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Mahir",
};

const STATUS_LABEL: Record<string, string> = {
  "not-started": "Belum Mulai",
  "in-progress": "Berjalan",
  completed: "Selesai",
};

const STATUS_COLOR: Record<string, string> = {
  "not-started": "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  "in-progress": "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
};

const LEVEL_COLOR: Record<string, string> = {
  beginner: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  intermediate: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  advanced: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
};

// ---- Helpers ----

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function blankSkill(): SkillDraft {
  return {
    id: genId(),
    name: "",
    category: "",
    level: "beginner",
    status: "not-started",
    priority: 0,
    estimatedHours: 0,
    prerequisites: "",
    resources: [],
  };
}

function skillToForm(skill: SkillShape): SkillDraft {
  return {
    id: skill.id,
    name: skill.name,
    category: skill.category,
    level: skill.level,
    status: skill.status,
    priority: skill.priority,
    estimatedHours: skill.estimatedHours,
    prerequisites: skill.prerequisites.join(", "),
    resources: skill.resources.map((r) => ({ ...r })),
  };
}

// ---- Component ----

export function RoadmapPanel() {
  const roadmaps = useQuery(api.admin.queries.listAllRoadmaps);

  const [selectedRoadmapId, setSelectedRoadmapId] = useState<Id<"skillRoadmaps"> | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [careerPathEditing, setCareerPathEditing] = useState(false);
  const [careerPathDraft, setCareerPathDraft] = useState("");

  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [skillDraft, setSkillDraft] = useState<SkillDraft>(blankSkill);

  const [deleteRoadmapConfirm, setDeleteRoadmapConfirm] = useState<RoadmapRow | null>(null);
  const [deleteSkillConfirm, setDeleteSkillConfirm] = useState<{
    roadmapId: Id<"skillRoadmaps">;
    skillId: string;
    name: string;
  } | null>(null);

  const [busy, setBusy] = useState(false);

  const deleteRoadmap = useMutation(api.admin.mutations.adminDeleteRoadmap);
  const updateCareerPath = useMutation(api.admin.mutations.adminUpdateCareerPath);
  const upsertSkill = useMutation(api.admin.mutations.adminUpsertSkill);
  const removeSkill = useMutation(api.admin.mutations.adminRemoveSkill);

  const selectedRoadmap = roadmaps?.find((r) => r._id === selectedRoadmapId) ?? null;

  // Close sheet when roadmap is deleted from under it
  useEffect(() => {
    if (sheetOpen && selectedRoadmapId && roadmaps !== undefined && !selectedRoadmap) {
      setSheetOpen(false);
      setSelectedRoadmapId(null);
    }
  }, [sheetOpen, selectedRoadmapId, roadmaps, selectedRoadmap]);

  // ---- Handlers ----

  const openSheet = (row: RoadmapRow) => {
    setSelectedRoadmapId(row._id);
    setCareerPathEditing(false);
    setSkillDialogOpen(false);
    setSheetOpen(true);
  };

  const handleSaveCareerPath = async () => {
    if (!selectedRoadmapId) return;
    setBusy(true);
    try {
      await updateCareerPath({ roadmapId: selectedRoadmapId, careerPath: careerPathDraft });
      notify.success("Career path diperbarui");
      setCareerPathEditing(false);
    } catch (err) {
      notify.fromError(err, "Gagal memperbarui career path");
    } finally {
      setBusy(false);
    }
  };

  const openAddSkill = () => {
    setSkillDraft(blankSkill());
    setSkillDialogOpen(true);
  };

  const openEditSkill = (skill: SkillShape) => {
    setSkillDraft(skillToForm(skill));
    setSkillDialogOpen(true);
  };

  const handleSaveSkill = async () => {
    if (!selectedRoadmapId) return;
    setBusy(true);
    try {
      await upsertSkill({
        roadmapId: selectedRoadmapId,
        skill: {
          id: skillDraft.id,
          name: skillDraft.name,
          category: skillDraft.category,
          level: skillDraft.level,
          status: skillDraft.status,
          priority: typeof skillDraft.priority === "number" ? skillDraft.priority : 0,
          estimatedHours:
            typeof skillDraft.estimatedHours === "number" ? skillDraft.estimatedHours : 0,
          prerequisites: skillDraft.prerequisites
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          resources: skillDraft.resources,
        },
      });
      notify.success("Skill disimpan");
      setSkillDialogOpen(false);
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan skill");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!deleteSkillConfirm) return;
    setBusy(true);
    try {
      await removeSkill({
        roadmapId: deleteSkillConfirm.roadmapId,
        skillId: deleteSkillConfirm.skillId,
      });
      notify.success("Skill dihapus");
      setDeleteSkillConfirm(null);
    } catch (err) {
      notify.fromError(err, "Gagal menghapus skill");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRoadmap = async () => {
    if (!deleteRoadmapConfirm) return;
    setBusy(true);
    try {
      await deleteRoadmap({ roadmapId: deleteRoadmapConfirm._id });
      notify.success("Roadmap dihapus");
      setDeleteRoadmapConfirm(null);
    } catch (err) {
      notify.fromError(err, "Gagal menghapus roadmap");
    } finally {
      setBusy(false);
    }
  };

  // ---- Table columns ----

  const columns: ReadonlyArray<ColumnDef<RoadmapRow>> = [
    {
      id: "userEmail",
      header: "Pengguna",
      accessor: (r) => r.userEmail,
      cell: (r) =>
        r.userEmail ? (
          <span className="font-mono text-xs">{r.userEmail}</span>
        ) : (
          <span className="italic text-muted-foreground">(anonim)</span>
        ),
    },
    {
      id: "careerPath",
      header: "Career Path",
      accessor: (r) => r.careerPath,
      cell: (r) => <span className="font-medium">{r.careerPath}</span>,
    },
    {
      id: "skillsCount",
      header: "Skills",
      accessor: (r) => r.skillsCount,
      align: "right",
      hideOnMobile: true,
      cell: (r) => (
        <Badge variant="secondary" className="tabular-nums">
          {r.skillsCount}
        </Badge>
      ),
    },
    {
      id: "progress",
      header: "Progress",
      accessor: (r) => r.progress,
      hideOnMobile: true,
      cell: (r) => (
        <div className="flex items-center gap-2 min-w-[90px]">
          <Progress value={r.progress} className="h-1.5 flex-1" />
          <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
            {r.progress}%
          </span>
        </div>
      ),
    },
    {
      id: "createdAt",
      header: "Dibuat",
      accessor: (r) => r.createdAt,
      align: "right",
      hideOnMobile: true,
      cell: (r) => (
        <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      accessor: () => "",
      sortable: false,
      hideMobileLabel: true,
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
              aria-label="Aksi roadmap"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => openSheet(r)}>
              <BookOpen className="mr-2 h-4 w-4" />
              Kelola Skills
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteRoadmapConfirm(r)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Roadmap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      {/* ---- Main Card ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Roadmap Skill Pengguna</CardTitle>
          <CardDescription>
            Lihat dan kelola roadmap skill setiap pengguna. Klik &quot;Kelola Skills&quot; untuk tambah,
            edit, atau hapus skill.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<RoadmapRow>
            data={roadmaps ?? []}
            columns={columns}
            rowKey={(r) => r._id}
            searchAccessor={(r) => [r.userEmail, r.careerPath].filter(Boolean).join(" ")}
            searchPlaceholder="Cari email atau career path…"
            isLoading={roadmaps === undefined}
            emptyMessage="Belum ada roadmap."
          />
        </CardContent>
      </Card>

      {/* ---- Skills Sheet ---- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 gap-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {careerPathEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={careerPathDraft}
                      onChange={(e) => setCareerPathDraft(e.target.value)}
                      className="h-8 font-semibold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSaveCareerPath();
                        if (e.key === "Escape") setCareerPathEditing(false);
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => void handleSaveCareerPath()}
                      disabled={busy}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Simpan"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCareerPathEditing(false)}
                    >
                      Batal
                    </Button>
                  </div>
                ) : (
                  <SheetTitle className="flex items-center gap-2 text-base leading-snug">
                    <span className="truncate">{selectedRoadmap?.careerPath ?? "—"}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => {
                        setCareerPathDraft(selectedRoadmap?.careerPath ?? "");
                        setCareerPathEditing(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </SheetTitle>
                )}
                <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                  {selectedRoadmap?.userEmail || "(anonim)"}
                </p>
              </div>
            </div>

            {selectedRoadmap && (
              <div className="flex items-center gap-3 mt-2">
                <Progress value={selectedRoadmap.progress} className="h-1.5 flex-1" />
                <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                  {selectedRoadmap.progress}%
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {selectedRoadmap.skillsCount} skill
                </span>
              </div>
            )}
          </SheetHeader>

          <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
            <span className="text-sm font-medium">Skills</span>
            <Button size="sm" onClick={openAddSkill} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Tambah Skill
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 py-3 space-y-2">
              {!selectedRoadmap && (
                <p className="text-sm text-muted-foreground text-center py-8">Memuat…</p>
              )}
              {selectedRoadmap && selectedRoadmap.skills.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada skill. Klik &quot;Tambah Skill&quot; untuk mulai.
                </p>
              )}
              {selectedRoadmap &&
                [...selectedRoadmap.skills]
                  .sort((a, b) => a.priority - b.priority)
                  .map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                    >
                      <span className="text-xs tabular-nums text-muted-foreground w-6 shrink-0 text-center font-mono">
                        {skill.priority}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{skill.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {skill.category}
                          </span>
                          <Badge
                            className={cn(
                              "border-transparent text-[10px] px-1.5 py-0",
                              LEVEL_COLOR[skill.level] ?? "",
                            )}
                          >
                            {LEVEL_LABEL[skill.level] ?? skill.level}
                          </Badge>
                          <Badge
                            className={cn(
                              "border-transparent text-[10px] px-1.5 py-0",
                              STATUS_COLOR[skill.status] ?? "",
                            )}
                          >
                            {STATUS_LABEL[skill.status] ?? skill.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {skill.estimatedHours}j
                          </span>
                          {skill.resources.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {skill.resources.length} resource
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditSkill(skill)}
                          aria-label={`Edit ${skill.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteSkillConfirm({
                              roadmapId: selectedRoadmap._id,
                              skillId: skill.id,
                              name: skill.name,
                            })
                          }
                          aria-label={`Hapus ${skill.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ---- Skill Form Dialog ---- */}
      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {LEVEL_LABEL[l]}
                      </SelectItem>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
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
                onChange={(e) =>
                  setSkillDraft((d) => ({ ...d, prerequisites: e.target.value }))
                }
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
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
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
            <Button variant="outline" onClick={() => setSkillDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => void handleSaveSkill()}
              disabled={busy || !skillDraft.name.trim() || !skillDraft.category.trim()}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Roadmap Confirm ---- */}
      <ResponsiveAlertDialog
        open={!!deleteRoadmapConfirm}
        onOpenChange={(o) => !o && setDeleteRoadmapConfirm(null)}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Hapus roadmap ini?</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Roadmap &quot;{deleteRoadmapConfirm?.careerPath}&quot; milik{" "}
              {deleteRoadmapConfirm?.userEmail || "pengguna anonim"} akan dihapus permanen.
              Tidak bisa di-undo.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteRoadmap();
              }}
            >
              {busy ? "Menghapus…" : "Hapus permanen"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>

      {/* ---- Delete Skill Confirm ---- */}
      <ResponsiveAlertDialog
        open={!!deleteSkillConfirm}
        onOpenChange={(o) => !o && setDeleteSkillConfirm(null)}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Hapus skill ini?</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Skill &quot;{deleteSkillConfirm?.name}&quot; akan dihapus dari roadmap. Progress
              dihitung ulang otomatis.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteSkill();
              }}
            >
              {busy ? "Menghapus…" : "Hapus"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </>
  );
}
