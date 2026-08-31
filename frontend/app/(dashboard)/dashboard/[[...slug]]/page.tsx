import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  DASHBOARD_VIEWS,
  resolveDashboardView,
  labelForPath,
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

/**
 * Per-page browser-tab title for all 19 dashboard routes, derived from the
 * same `labelForPath` the sidebar/breadcrumb already use — one registry,
 * no separate slug→label map to keep in sync. Root layout's
 * `title.template: "%s · CareerPack"` appends the suffix automatically, so
 * this only needs to return the bare label (e.g. "CV" → "CV · CareerPack").
 * Slugs with no `nav` entry (e.g. the `ai-settings` legacy alias) fall back
 * to the root layout's default title.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pathname = slug?.length ? `/dashboard/${slug.join("/")}` : "/dashboard";
  const label = labelForPath(pathname);
  return label ? { title: label } : {};
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
