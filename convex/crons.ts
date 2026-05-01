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

// Hourly calendar reminder sweep. Inserts a `notifications` row for each
// event whose reminder window has opened. Idempotent — `reminderSentAt`
// guards against double-firing if the cron retries.
crons.hourly(
  "calendar-reminder-sweep",
  { minuteUTC: 5 },
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

export default crons;
