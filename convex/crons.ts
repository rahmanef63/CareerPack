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

// Daily pruner — drop fetched job listings older than 60 days. Caps at
// 200 deletes per run; if the table ever has a huge backlog the cron
// just chips away day by day. Skips `user-paste` and `seed` rows.
crons.daily(
  "prune-old-jobs",
  { hourUTC: 18, minuteUTC: 0 }, // 01:00 WIB next day, after fetch settles
  internal.matcher.external.pruneOldJobs,
);

export default crons;
