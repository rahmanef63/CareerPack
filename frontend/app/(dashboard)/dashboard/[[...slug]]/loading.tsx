import { PageSkeleton } from "@/shared/components/feedback/PageSkeleton";

/**
 * Route-segment loading UI for /dashboard/*. Streams this skeleton
 * to the browser instantly while the slice's dynamic chunk + any
 * Convex queries resolve. Replaces Next's default whitescreen gap.
 *
 * Shape-matched to the typical slice (title + tabs + card grid) so
 * the final content hydrates without visible layout shift.
 */
export default function DashboardLoading() {
  return <PageSkeleton />;
}
