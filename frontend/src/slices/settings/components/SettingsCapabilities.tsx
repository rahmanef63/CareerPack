"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

/**
 * Settings capability binder — subscribes to skill actions declared in
 * `settings/manifest.ts` and routes them to the matching Convex mutation.
 *
 * Renders nothing. Mounted globally in `Providers.tsx` so AI-triggered
 * actions land here regardless of which page the user is on.
 *
 * If the slice is removed, this component goes with it and the central
 * registry import in `sliceRegistry.ts` breaks at compile time —
 * exactly the modular boundary we want.
 */
export function SettingsCapabilities() {
  const patchProfile = useMutation(api.profile.mutations.patchProfile);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    const phoneUnsub = subscribe<{ phone: string }>(
      "settings.update-phone",
      async (a) => {
        try {
          await patchProfile({ phone: a.payload.phone });
          notify.success(`Nomor telepon disimpan: ${a.payload.phone}`);
        } catch (err) {
          notify.fromError(err, "Gagal update nomor telepon");
        }
      },
    );
    unsubs.push(phoneUnsub);

    const targetUnsub = subscribe<{ targetRole: string }>(
      "settings.update-target-role",
      async (a) => {
        try {
          await patchProfile({ targetRole: a.payload.targetRole });
          notify.success(`Target role disimpan: ${a.payload.targetRole}`);
        } catch (err) {
          notify.fromError(err, "Gagal update target role");
        }
      },
    );
    unsubs.push(targetUnsub);

    const locationUnsub = subscribe<{ location: string }>(
      "settings.update-location",
      async (a) => {
        try {
          await patchProfile({ location: a.payload.location });
          notify.success(`Lokasi disimpan: ${a.payload.location}`);
        } catch (err) {
          notify.fromError(err, "Gagal update lokasi");
        }
      },
    );
    unsubs.push(locationUnsub);

    const bioUnsub = subscribe<{ bio: string }>(
      "settings.update-bio",
      async (a) => {
        try {
          await patchProfile({ bio: a.payload.bio });
          notify.success("Bio disimpan");
        } catch (err) {
          notify.fromError(err, "Gagal update bio");
        }
      },
    );
    unsubs.push(bioUnsub);

    return () => {
      for (const u of unsubs) u();
    };
  }, [patchProfile]);

  return null;
}
