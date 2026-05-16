"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

interface CreatePayload {
  title: string;
  description: string;
  category: string;
  date: string;
  link?: string;
}

interface ItemIdPayload {
  itemId: string;
}

const VALID_CATEGORIES = new Set([
  "project",
  "certification",
  "publication",
  "design",
  "writing",
  "speaking",
  "award",
  "openSource",
  "volunteer",
  "music",
  "photography",
  "teaching",
  "research",
  "video",
  "other",
]);

/**
 * Portfolio capability binder — wires create + delete + toggle-featured.
 * Query skill (`portfolio.list`) handled server-side by skillHandlers.
 * Update flow stays in the slice UI for now (payload surface too wide
 * for chat; media + multi-link forms need file pickers).
 */
export function PortfolioCapabilities() {
  const createItem = useMutation(api.portfolio.mutations.createPortfolioItem);
  const deleteItem = useMutation(api.portfolio.mutations.deletePortfolioItem);
  const toggleFeatured = useMutation(api.portfolio.mutations.togglePortfolioFeatured);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<CreatePayload>("portfolio.create", async (a) => {
        const p = a.payload;
        const title = String(p.title ?? "").trim();
        const description = String(p.description ?? "").trim();
        const category = String(p.category ?? "").trim();
        const date = String(p.date ?? "").trim();
        if (!title || !description || !date) {
          notify.validation("Title, description, date wajib");
          return;
        }
        if (!VALID_CATEGORIES.has(category)) {
          notify.validation(`Kategori tidak valid: ${category}`);
          return;
        }
        try {
          await createItem({
            title,
            description,
            category,
            date,
            link: p.link ? String(p.link).trim() : undefined,
          });
          notify.success(`Portfolio "${title}" dibuat`);
        } catch (err) {
          notify.fromError(err, "Gagal buat item portfolio");
        }
      }),
    );

    unsubs.push(
      subscribe<ItemIdPayload>("portfolio.delete", async (a) => {
        const itemId = String(a.payload.itemId ?? "").trim();
        if (!itemId) {
          notify.validation("ID item wajib");
          return;
        }
        try {
          await deleteItem({ itemId: itemId as Id<"portfolioItems"> });
          notify.success("Item portfolio dihapus");
        } catch (err) {
          notify.fromError(err, "Gagal hapus item");
        }
      }),
    );

    unsubs.push(
      subscribe<ItemIdPayload>("portfolio.toggle-featured", async (a) => {
        const itemId = String(a.payload.itemId ?? "").trim();
        if (!itemId) {
          notify.validation("ID item wajib");
          return;
        }
        try {
          await toggleFeatured({ itemId: itemId as Id<"portfolioItems"> });
          notify.success("Featured di-toggle");
        } catch (err) {
          notify.fromError(err, "Gagal toggle featured");
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [createItem, deleteItem, toggleFeatured]);

  return null;
}
