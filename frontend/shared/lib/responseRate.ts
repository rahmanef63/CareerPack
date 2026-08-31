/**
 * Shared "Tingkat Respons" (response rate) calculation.
 *
 * Previously computed separately — and inconsistently — in
 * DashboardHome.tsx (gated behind a minimum sample size, >=50% = "good")
 * and CareerDashboard.tsx (ungated, >=30% = "good"). With few applications
 * the ungated version could show a misleading "100% - Bagus" off a single
 * data point. Unified per docs/qa/ui-sweep-prompt.md §1 ("Tingkat Respons
 * threshold logic ... needs one spec").
 */

export const RESPONSE_RATE_MIN_APPLICATIONS = 5;
const GOOD_THRESHOLD = 50;

export interface ResponseRateStat {
  /** Raw percentage, 0-100. Only meaningful when `reliable` is true. */
  rate: number;
  /** False when there aren't enough applications yet to trust the rate. */
  reliable: boolean;
  /** Ready-to-render value: "NN%" when reliable, "—" otherwise. */
  display: string;
  /** Ready-to-render hint line under the stat. */
  sub: string;
}

export function getResponseRateStat(
  applications: ReadonlyArray<{ status: string }>,
): ResponseRateStat {
  const total = applications.length;
  const rate =
    total === 0
      ? 0
      : Math.round(
          (applications.filter((a) => a.status !== "applied").length / total) *
            100,
        );
  const reliable = total >= RESPONSE_RATE_MIN_APPLICATIONS;

  return {
    rate,
    reliable,
    display: reliable ? `${rate}%` : "—",
    sub: reliable
      ? rate >= GOOD_THRESHOLD
        ? "Bagus"
        : "Tingkatkan kualitas CV"
      : `Butuh min. ${RESPONSE_RATE_MIN_APPLICATIONS} lamaran untuk statistik akurat`,
  };
}
