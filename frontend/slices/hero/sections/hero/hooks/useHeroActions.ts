"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/shared/hooks/useAuth";
import { notify } from "@/shared/lib/notify";
import { ROUTES } from "@/shared/lib/routes";

/**
 * Client-side behavior for the hero CTAs — ported verbatim from the old
 * HeroSection.tsx so the "Lihat Demo" button keeps its exact demo-login
 * flow (loginAsDemo → toast → redirect to dashboard) after the visual rebuild.
 */
export function useHeroActions() {
  const router = useRouter();
  const { loginAsDemo } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemo = async () => {
    if (isDemoLoading) return;
    setIsDemoLoading(true);
    try {
      const result = await loginAsDemo();
      if (result.ok) {
        notify.success("Sesi demo dimulai 🎉", {
          description: "Data contoh sudah disiapkan. Selamat menjelajah.",
        });
        router.push(ROUTES.dashboard.home);
      } else {
        notify.error("Demo gagal dimulai", { description: result.error });
      }
    } catch (err) {
      notify.fromError(err, "Demo gagal dimulai");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return { isDemoLoading, handleDemo };
}
