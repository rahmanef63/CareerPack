"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

interface StartFromTemplatePayload {
  slug: string;
}

interface UpdateProgressPayload {
  skillId: string;
  status: string;
}

interface ToggleResourcePayload {
  skillId: string;
  resourceTitle: string;
  completed: boolean;
}

const VALID_STATUS = new Set(["not-started", "in-progress", "completed"]);

/**
 * Skill-roadmap capability binder — wires manifest mutation/compose
 * skills to backend mutations. Query skills (`roadmap.list`,
 * `roadmap.list-templates`) are handled server-side by skillHandlers
 * and never reach this binder.
 */
export function RoadmapCapabilities() {
  const startFromTemplate = useMutation(
    api.roadmap.mutations.startFromTemplate,
  );
  const updateProgress = useMutation(api.roadmap.mutations.updateSkillProgress);
  const toggleResource = useMutation(api.roadmap.mutations.toggleResource);
  const resetRoadmap = useMutation(api.roadmap.mutations.resetRoadmap);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<StartFromTemplatePayload>(
        "roadmap.start-from-template",
        async (a) => {
          const slug = String(a.payload.slug ?? "").trim().toLowerCase();
          if (!slug) {
            notify.validation("Slug template wajib");
            return;
          }
          try {
            await startFromTemplate({ slug });
            notify.success(`Roadmap "${slug}" dimulai`);
          } catch (err) {
            notify.fromError(err, "Gagal memulai roadmap");
          }
        },
      ),
    );

    unsubs.push(
      subscribe<UpdateProgressPayload>("roadmap.update-progress", async (a) => {
        const skillId = String(a.payload.skillId ?? "").trim();
        const status = String(a.payload.status ?? "").trim().toLowerCase();
        if (!skillId) {
          notify.validation("Skill ID wajib");
          return;
        }
        if (!VALID_STATUS.has(status)) {
          notify.validation(
            `Status tidak valid: ${status} (harus not-started|in-progress|completed)`,
          );
          return;
        }
        try {
          await updateProgress({ skillId, status });
          notify.success(`Skill ${skillId} → ${status}`);
        } catch (err) {
          notify.fromError(err, "Gagal update progress");
        }
      }),
    );

    unsubs.push(
      subscribe<ToggleResourcePayload>("roadmap.toggle-resource", async (a) => {
        const skillId = String(a.payload.skillId ?? "").trim();
        const resourceTitle = String(a.payload.resourceTitle ?? "").trim();
        const completed = a.payload.completed === true;
        if (!skillId || !resourceTitle) {
          notify.validation("skillId + resourceTitle wajib");
          return;
        }
        try {
          await toggleResource({ skillId, resourceTitle, completed });
          notify.success(
            completed
              ? `"${resourceTitle}" ditandai selesai`
              : `"${resourceTitle}" dikembalikan ke belum selesai`,
          );
        } catch (err) {
          notify.fromError(err, "Gagal update resource");
        }
      }),
    );

    unsubs.push(
      subscribe<Record<string, never>>("roadmap.reset", async () => {
        try {
          await resetRoadmap({});
          notify.success("Roadmap direset");
        } catch (err) {
          notify.fromError(err, "Gagal reset roadmap");
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [startFromTemplate, updateProgress, toggleResource, resetRoadmap]);

  return null;
}
