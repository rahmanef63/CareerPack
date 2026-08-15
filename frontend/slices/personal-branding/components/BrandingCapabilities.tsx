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

/** The ids the picker can actually display. The legacy trio
 *  (linktree/bento/magazine) is still accepted by the Convex validator for
 *  read-compat, but setting one now would leave the user on a theme that
 *  renders as template-v2 and cannot be re-selected in the UI. */
const VALID_THEMES = new Set([
  "starter",
  "template-v1",
  "template-v2",
  "template-v3",
]);

/** Mirrors convex/profile/slug.ts: 3-30 chars, not 3-40. */
const SLUG_RE = /^[a-z][a-z0-9-]{1,28}[a-z0-9]$/;

/**
 * Personal-branding capability binder — wires status toggles + slug +
 * theme + availability skills. Query (`get-status`) is handled server-side by
 * skillHandlers. Page HTML is not here: an AI host edits that over MCP
 * (branding_set_html), and the dashboard edits it in CustomHtmlCard.
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
            "Slug harus 3-30 karakter, huruf kecil/angka/dash, mulai huruf",
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
            "Template tidak valid (starter|template-v1|template-v2|template-v3)",
          );
          return;
        }
        try {
          await updatePublic({
            theme: theme as
              | "starter"
              | "template-v1"
              | "template-v2"
              | "template-v3",
          });
          notify.success(`Template diganti: ${theme}`);
        } catch (err) {
          notify.fromError(err, "Gagal ganti template");
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
