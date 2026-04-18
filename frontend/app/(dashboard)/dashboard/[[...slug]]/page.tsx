import { notFound } from "next/navigation";
import { resolveDashboardView } from "@/shared/lib/dashboardRoutes";
import { ErrorBoundary } from "@/shared/components/error/ErrorBoundary";

// Prerender selayaknya static per slug — Next.js akan generate di build time.
export function generateStaticParams() {
  // `{}` = /dashboard (slug kosong), lainnya jadi /dashboard/<slug>
  return [
    {},
    { slug: ["cv"] },
    { slug: ["calendar"] },
    { slug: ["applications"] },
    { slug: ["roadmap"] },
    { slug: ["checklist"] },
    { slug: ["interview"] },
    { slug: ["calculator"] },
    { slug: ["settings"] },
    { slug: ["ai-settings"] },
    { slug: ["matcher"] },
    { slug: ["networking"] },
    { slug: ["portfolio"] },
    { slug: ["notifications"] },
    { slug: ["help"] },
  ];
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
