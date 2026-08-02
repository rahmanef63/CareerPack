"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

interface TogglePublicPayload {
  enabled: boolean;
}
interface SetSlugPayload {
  slug: string;
}
interface SetThemePayload {
  theme: string;
}
interface SetAvailablePayload {
  availableForHire: boolean;
  availabilityNote?: string;
}

const VALID_THEMES = new Set([
  "linktree",
  "bento",
  "magazine",
  "template-v1",
  "template-v2",
  "template-v3",
]);

const SLUG_RE = /^[a-z][a-z0-9-]{2,39}$/;

/**
 * Personal-branding capability binder — wires status toggles + slug +
 * theme + availability skills. Query (`get-status`) is handled
 * server-side by skillHandlers. Block-level edits stay in slice UI.
 */
export function BrandingCapabilities() {
  const updatePublic = useMutation(api.profile.mutations.updateMyPublicProfile);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<TogglePublicPayload>("branding.toggle-public", async (a) => {
        const enabled = a.payload.enabled === true;
        try {
          await updatePublic({ enabled });
          notify.success(
            enabled ? "Halaman publik diaktifkan" : "Halaman publik dimatikan",
          );
        } catch (err) {
          notify.fromError(err, "Gagal toggle halaman publik");
        }
      }),
    );

    unsubs.push(
      subscribe<SetSlugPayload>("branding.set-slug", async (a) => {
        const slug = String(a.payload.slug ?? "").trim().toLowerCase();
        if (!SLUG_RE.test(slug)) {
          notify.validation(
            "Slug harus 3-40 karakter, huruf kecil/angka/dash, mulai huruf",
          );
          return;
        }
        try {
          await updatePublic({ slug });
          notify.success(`Slug diganti: ${slug}`);
        } catch (err) {
          notify.fromError(err, "Gagal ganti slug");
        }
      }),
    );

    unsubs.push(
      subscribe<SetThemePayload>("branding.set-theme", async (a) => {
        const theme = String(a.payload.theme ?? "").trim().toLowerCase();
        if (!VALID_THEMES.has(theme)) {
          notify.validation(
            "Theme tidak valid (linktree|bento|magazine|template-v1..v3)",
          );
          return;
        }
        try {
          await updatePublic({
            theme: theme as
              | "linktree"
              | "bento"
              | "magazine"
              | "template-v1"
              | "template-v2"
              | "template-v3",
          });
          notify.success(`Theme diganti: ${theme}`);
        } catch (err) {
          notify.fromError(err, "Gagal ganti theme");
        }
      }),
    );

    unsubs.push(
      subscribe<SetAvailablePayload>("branding.set-available", async (a) => {
        const availableForHire = a.payload.availableForHire === true;
        const availabilityNote =
          a.payload.availabilityNote !== undefined
            ? String(a.payload.availabilityNote).trim()
            : undefined;
        try {
          await updatePublic({
            availableForHire,
            ...(availabilityNote !== undefined ? { availabilityNote } : {}),
          });
          notify.success(
            availableForHire
              ? "Open for hire diaktifkan"
              : "Badge open for hire dimatikan",
          );
        } catch (err) {
          notify.fromError(err, "Gagal update status");
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [updatePublic]);

  return null;
}
