import { notFound } from "next/navigation";
import {
  DASHBOARD_VIEWS,
  resolveDashboardView,
} from "@/shared/lib/dashboardRoutes";
import { ErrorBoundary } from "@/shared/components/error/ErrorBoundary";

/**
 * Static-prerender every registered dashboard slug at build time.
 * Derived from `DASHBOARD_VIEWS` so adding a slice in dashboardRoutes.tsx
 * automatically extends prerendering — no duplicate manual list to
 * keep in sync.
 *
 * Excludes `admin-panel` from prerender (super-admin-only, no value
 * caching the shell for a route most users never hit).
 */
export function generateStaticParams() {
  return Object.keys(DASHBOARD_VIEWS)
    .filter((slug) => slug !== "admin-panel")
    .map((slug) => (slug === "" ? {} : { slug: [slug] }));
}

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function DashboardCatchAllPage({ params }: PageProps) {
  const { slug } = await params;
  const View = resolveDashboardView(slug);
  if (!View) notFound();
  return (
    <ErrorBoundary>
      <View />
    </ErrorBoundary>
  );
}
