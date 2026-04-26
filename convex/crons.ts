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

export default crons;
