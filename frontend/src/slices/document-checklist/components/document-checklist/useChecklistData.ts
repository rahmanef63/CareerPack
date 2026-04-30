"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { notify } from "@/shared/lib/notify";
import { indonesianDocumentChecklist } from "@/shared/data/indonesianData";
import { api } from "../../../../../../convex/_generated/api";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoChecklistOverlay } from "@/shared/hooks/useDemoOverlay";
import type { ChecklistItem } from "../../types";

export function useChecklistData() {
  const { state: authState } = useAuth();
  const isAuthenticated = authState.isAuthenticated;
  const isDemo = authState.isDemo;

  const checklist = useQuery(
    api.documents.queries.getUserDocumentChecklist,
    isAuthenticated && !isDemo ? {} : "skip",
  );
  const seedChecklist = useMutation(api.documents.mutations.seedDocumentChecklist);
  const updateDocumentStatus = useMutation(api.documents.mutations.updateDocumentStatus);

  const demoChecklist = useDemoChecklistOverlay();

  // Reset the guard if seed throws — otherwise a transient blip locks
  // the user out of seeding for the entire mount.
  const seedAttempted = useRef(false);
  useEffect(() => {
    if (isDemo) return;
    if (checklist === undefined) return;
    if (checklist !== null) return;
    if (seedAttempted.current) return;
    seedAttempted.current = true;
    seedChecklist({
      type: "combined",
      template: indonesianDocumentChecklist.map((d) => ({
        id: d.id,
        name: d.title,
        category: d.category,
        subcategory: d.subcategory,
        required: d.required,
      })),
    }).catch(() => {
      seedAttempted.current = false;
    });
  }, [checklist, seedChecklist, isDemo]);

  const items = useMemo<ChecklistItem[]>(() => {
    if (isDemo) {
      return indonesianDocumentChecklist.map((tpl) => {
        const sv = demoChecklist.progress[tpl.id];
        return sv
          ? {
              ...tpl,
              completed: !!sv.completed,
              notes: sv.notes || undefined,
              dueDate: sv.expiryDate,
            }
          : tpl;
      });
    }
    const serverById = new Map(
      (checklist?.documents ?? []).map((d) => [d.id, d]),
    );
    return indonesianDocumentChecklist.map((tpl) => {
      const sv = serverById.get(tpl.id);
      return sv
        ? {
            ...tpl,
            completed: sv.completed,
            notes: sv.notes || undefined,
            dueDate: sv.expiryDate,
          }
        : tpl;
    });
  }, [checklist, isDemo, demoChecklist.progress]);

  const toggleItem = (itemId: string) => {
    if (isDemo) {
      demoChecklist.toggle(itemId);
      return;
    }
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    updateDocumentStatus({
      documentId: itemId,
      completed: !item.completed,
    }).catch((err: unknown) => {
      notify.fromError(err, "Gagal menyimpan");
    });
  };

  const updateItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    if (isDemo) {
      demoChecklist.setEntry(itemId, {
        completed: updates.completed,
        notes: updates.notes,
        expiryDate: updates.dueDate,
      });
      return;
    }
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    updateDocumentStatus({
      documentId: itemId,
      completed: updates.completed ?? item.completed,
      notes: updates.notes ?? item.notes ?? "",
      expiryDate: updates.dueDate ?? item.dueDate ?? "",
    }).catch((err: unknown) => {
      notify.fromError(err, "Gagal menyimpan");
    });
  };

  const getFilteredItems = (
    category: "local" | "international",
    filterCategory: string | null,
  ) => {
    return items.filter((item) => {
      if (item.category !== category) return false;
      if (filterCategory && item.subcategory !== filterCategory) return false;
      return true;
    });
  };

  const getProgress = (category: "local" | "international") => {
    const categoryItems = items.filter((item) => item.category === category);
    const requiredItems = categoryItems.filter((item) => item.required);
    const completedRequired = requiredItems.filter((item) => item.completed);
    return {
      total: categoryItems.length,
      completed: categoryItems.filter((item) => item.completed).length,
      required: requiredItems.length,
      requiredCompleted: completedRequired.length,
      percentage:
        requiredItems.length > 0
          ? Math.round((completedRequired.length / requiredItems.length) * 100)
          : 0,
    };
  };

  const getSubcategories = (category: "local" | "international") => {
    const categoryItems = items.filter((item) => item.category === category);
    return [...new Set(categoryItems.map((item) => item.subcategory))];
  };

  return {
    items, toggleItem, updateItem,
    getFilteredItems, getProgress, getSubcategories,
  };
}

export type ChecklistProgress = ReturnType<
  ReturnType<typeof useChecklistData>["getProgress"]
>;
