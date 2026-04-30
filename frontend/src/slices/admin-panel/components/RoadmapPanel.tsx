"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { notify } from "@/shared/lib/notify";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/shared/components/ui/card";
import {
  ResponsiveAlertDialog, ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel, ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription, ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader, ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import { DataTable } from "@/shared/components/data-table";
import { buildRoadmapColumns } from "./roadmap-panel/columns";
import { blankSkill, skillToForm } from "../lib/roadmap";
import { RoadmapSkillsSheet } from "./roadmap-panel/RoadmapSkillsSheet";
import { SkillFormDialog } from "./roadmap-panel/SkillFormDialog";
import type {
  RoadmapRow, SkillDraft, SkillShape,
} from "../types/roadmap";

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

  const columns = buildRoadmapColumns({
    onOpenSheet: openSheet,
    onDelete: setDeleteRoadmapConfirm,
  });

  return (
    <>
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

      <RoadmapSkillsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedRoadmap={selectedRoadmap}
        careerPathEditing={careerPathEditing}
        setCareerPathEditing={setCareerPathEditing}
        careerPathDraft={careerPathDraft}
        setCareerPathDraft={setCareerPathDraft}
        busy={busy}
        onSaveCareerPath={() => { void handleSaveCareerPath(); }}
        onAddSkill={openAddSkill}
        onEditSkill={openEditSkill}
        onDeleteSkill={setDeleteSkillConfirm}
      />

      <SkillFormDialog
        open={skillDialogOpen}
        onOpenChange={setSkillDialogOpen}
        skillDraft={skillDraft}
        setSkillDraft={setSkillDraft}
        busy={busy}
        onSave={() => { void handleSaveSkill(); }}
      />

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
