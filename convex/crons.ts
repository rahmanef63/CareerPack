/**
 * Convex cron schedule.
 *
 * Add jobs here as the app grows. Each entry is a single internal
 * mutation/action call on a schedule. Keep cron handlers idempotent —
 * Convex retries on transient failures and crons can fire late if the
 * backend was down at the scheduled minute.
 */
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily anonymous-user cleanup. Runs at 17:00 UTC (≈ 00:00 WIB) so
// the lower-traffic window absorbs the cascade-delete cost. Each run
// purges up to 50 stale demo accounts (no email, _creationTime older
// than 7 days). Keeps the admin user table tidy as demo traffic grows.
crons.daily(
  "cleanup-inactive-demo-users",
  { hourUTC: 17, minuteUTC: 0 },
  internal.admin.cleanup.cleanupInactiveDemoUsers,
);

// 15-minute calendar reminder sweep. Inserts a `notifications` row for
// each event whose reminder window has opened. Idempotent —
// `reminderSentAt` guards against double-firing if the cron retries.
// Hourly cadence used to give 15-minute reminders up to ~60 min slack;
// 15-min cadence tightens worst-case skew to ~15 min.
crons.cron(
  "calendar-reminder-sweep",
  "*/15 * * * *",
  internal.calendar.reminders.sweepReminders,
);

// Daily external job feed pull. WeWorkRemotely RSS (4 categories) +
// RemoteOK JSON. Dedup by `externalId` so re-fetch is idempotent.
// Soft-fails per source: one Cloudflare-blocked feed doesn't kill the
// whole sweep. Convex queries on jobListings are reactive — the matcher
// UI auto-rescores against fresh rows without page refresh.
crons.daily(
  "external-jobs-fetch",
  { hourUTC: 16, minuteUTC: 0 }, // 23:00 WIB
  internal.matcher.external.fetchJobFeeds,
);

// Daily pruner — drop fetched job listings older than 60 days. Caps at
// 200 deletes per run; if the table ever has a huge backlog the cron
// just chips away day by day. Skips `user-paste` and `seed` rows.
crons.daily(
  "prune-old-jobs",
  { hourUTC: 18, minuteUTC: 0 }, // 01:00 WIB next day, after fetch settles
  internal.matcher.external.pruneOldJobs,
);

// Weekly job digest — Monday 02:00 UTC = 09:00 WIB. Sends top job
// matches to opted-in users (digestEnabled=true on userProfiles).
// Idempotent: skips users emailed within last 6 days.
crons.weekly(
  "weekly-job-digest",
  { dayOfWeek: "monday", hourUTC: 2, minuteUTC: 0 },
  internal.notifications.digest.sendWeeklyDigest,
);

// Daily TTL prune for append-only tables (errorLogs, rateLimitEvents,
// passwordResetIpEvents, passwordResetTokens). Each capped at 1000
// deletes per run — backlog clears in days, not minutes. 19:00 UTC =
// 02:00 WIB, staggered after demo-user cleanup + job fetch + job prune.
crons.daily(
  "prune-append-only-tables",
  { hourUTC: 19, minuteUTC: 0 },
  internal.admin.cleanup.pruneAppendOnlyTables,
);

// Daily engine outcome calibrator — Bayesian posterior update of
// careerEdges from outcomeEvents reports (Phase 4.5). 20:00 UTC =
// 03:00 WIB. Idempotent: re-running upserts the same nodeOutcomeStats
// rows with fresh aggregates. Gated by MIN_COHORT_K = 5 so noisy
// micro-cohorts are skipped.
crons.daily(
  "engine-outcome-calibrator",
  { hourUTC: 20, minuteUTC: 0 },
  internal.engine.outcomes.calibrator.runCalibrator,
);

// Hourly admin-dashboard aggregator — replaces 5 unbounded `.collect()`
// calls that fired on every admin tick (users/cvs/jobApplications/
// rateLimitEvents/errorLogs). Reads from the denormalized `adminStats`
// singleton; staleness budget ≤ 1h, fine for an internal-ops dashboard.
crons.cron(
  "admin-stats-aggregator",
  "0 * * * *",
  internal.admin.aggregator.recomputeAdminStats,
);

export default crons;
