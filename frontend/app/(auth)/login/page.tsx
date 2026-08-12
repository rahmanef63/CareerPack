import type { Metadata } from "next";
import { RouteGuard } from "@/shared/components/auth/RouteGuard";
import { LoginPage } from "@/slices/auth";

/**
 * Canonical only. `robots: { index: false, follow: false }` lives on the
 * `(auth)` layout and MUST keep coming from there — Next merges metadata per
 * field down the segment chain, so declaring `alternates` here leaves the
 * layout's `robots` untouched. A canonical on a noindex page is still correct:
 * it de-duplicates the ?redirect= / ?utm_* variants people paste around.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/login" },
};

export default function LoginRoute() {
  return (
    <RouteGuard mode="guest">
      <LoginPage />
    </RouteGuard>
  );
}
