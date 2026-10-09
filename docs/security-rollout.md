# Security remediation — 9 October 2026

Repository: CareerPack. Scan revision: `23862f27d4f7eb6f8d9c8f366b32d448c79005fa`.

This change addresses the scan's 37 findings in code or with a documented existing control. It has not been deployed or rescanned. The password-sign-in throttle was already enforced by the installed authentication library; its policy is now explicit.

## Rollout prerequisites

1. Set and securely retain `AI_CRED_SECRET` on the active backend before release. Use the existing `admin/aiCreds:reencryptAICreds` dry-run, then apply migration on the explicit active target. Never replace an existing secret without a decrypt/re-encrypt plan.
2. Set `CONVEX_BACKEND_DIGEST` to a reviewed backend image's 64-character SHA-256 digest. Set `BACKUP_IMAGE` to a reviewed `alpine@sha256:…` image in the backup cron environment; the script intentionally refuses mutable tags. Keep the encryption passphrase in an operator-managed file and test a restore.
3. Workflow deployment needs `CONVEX_SELF_HOSTED_URL=https://api.careerpack.org` plus the matching admin key. Configure required reviewers/main-only rules for GitHub's `production` environment and protect `main`. Deploy backend before frontend, then verify both serve the same revision.
4. Configure `CONVEX_SITE_URL`, `APP_URL`, `FILE_URL_SECRET`, and `RESEND_API_KEY` on the backend. Custom AI gateways require exact `AI_ALLOWED_BASE_URLS` entries; nondefault attachment services require exact `MCP_FILE_ALLOWED_ORIGINS` entries. Approve only operator-controlled or trusted services. Server allowlists do not replace egress/network controls.
5. Existing admins need verified email. Google sign-in or successful mailbox password reset provides verification. Old ambiguous storage references are blocked; investigate ownership and re-upload where ownership cannot be established. Pending uploads from before this release have no ownership capability and must be retried.
6. Assess previously exposed build contexts, analytics/reset logs and credentials; rotate affected secrets through the normal operator path if exposure occurred. Current-file sanitization cannot erase historical Git revisions or external copies. Old durable storage URLs remain valid until the underlying blob is removed or replaced; handle this with an ownership review.

## Intentional behavior changes and limits

- Author-provided scripts/form submission are disabled in custom public HTML; application hydration, layout and styling remain supported.
- Community cohort statistics are paused. Self-reported outcomes are retained for the user but cannot override shared career probabilities. Resume only with provenance/Sybil controls and a valid privacy ledger.
- Google Analytics and automatic third-party translation no longer run globally. Translation can use the browser's own feature.
- Global quotas can temporarily reject legitimate bursts. Public roadmap listing caps at 200 entries and popularity samples at 5,000 roadmaps; add indexed pagination/counters if that scale is reached.
- Password reset removes sessions/refresh tokens. Already issued stateless access JWTs retain the authentication library's remaining token lifetime; immediate access-token invalidation requires an additional revocation control.
- No production credential rotation, data migration, deployment, historical Git rewrite, live penetration test or Security Cloud rescan was performed.

## Finding-to-change map

| # | Finding | Disposition |
|---|---|---|
| 1 | Cross-tenant storage IDs can be registered, read, and deleted | `convex/files/uploads.ts`, `ownership.ts`, browser/MCP registration: one-use owner capability, unique owner checks across reads/deletes. |
| 2 | OAuth denial follows a javascript: redirect URI | Consent rejects unsafe protocols, credentials and fragments before either allow or deny redirects. |
| 3 | Custom AI endpoints permit DNS and redirect based SSRF | Exact operator-approved AI base URLs; fetch rejects redirects. |
| 4 | Automatic Google Translate exposes authenticated DOM content | Global Google Translate scripts removed; browser translation remains available. |
| 5 | Global Google Analytics can disclose reset tokens and protected-route activity | Global Google Analytics scripts removed; local analytics excludes auth/reset routes. |
| 6 | Docker build context includes gitignored production credential files | Docker ignores nested env files, keys, debug dumps and local operator settings. |
| 7 | User-authored public HTML can phish and exfiltrate visitor input | Custom documents get a fresh nonce CSP: author scripts, forms and network calls blocked; popup escape removed. |
| 8 | Unverified password email can claim configured administrator identities | Email verification required for bootstrap and all administrator guards. |
| 9 | Abandoned and failed uploads leave unowned storage blobs | Pending uploads expire after one hour; failed uploads and account deletion clean up blobs. |
| 10 | Active backend target selection fails open | Push hook no longer deploys; main-only workflow verifies the active frontend/backend URL and requires its credentials. |
| 11 | User-reported outcomes can poison career calibration | Validated, deduplicated and rate-limited reports; shared planning uses curated priors until report provenance is trustworthy. |
| 12 | Quick Fill performs high-fan-out writes without an invocation quota | Quick Fill has per-user and global invocation ceilings before fan-out writes. |
| 13 | Upload validation trusts caller-provided MIME type and size | Server reads bounded bytes, sniffs MIME and records actual size/type; registration checks those values and storage metadata. |
| 14 | Mutable image tags receive production data authority | Backend and backup helper require reviewed immutable image digests. |
| 15 | Direct password signup permits mass account and email creation | Signup quota enforced inside Password authorize; unverified signup no longer schedules welcome email. |
| 16 | MCP portfolio file download remains vulnerable to DNS/private-address SSRF | MCP download and every redirect must use exact operator-trusted origins. |
| 17 | Admin-key rotation instructions emit production credentials | Rotation instructions keep generated keys in an operator-only temporary file and prohibit transcript output. |
| 18 | User job pastes can flood and poison the global catalog | User-pasted jobs stay out of shared lists, other users' matches, digests and salary statistics; app/MCP writes have shared quotas. |
| 19 | Production deployment accepts unreviewed ref or worktree bytes | Main-only, exact-commit workflow and production environment replace deployment of arbitrary push worktrees. |
| 20 | Anonymous feedback permits unbounded persistent inserts | Anonymous feedback has one global write ceiling; authenticated feedback also has a per-user limit. |
| 21 | Password sign-in lacks an authoritative attempt throttle | Installed @convex-dev/auth 0.0.90 already checks and persists failed-attempt limits; configuration now explicitly sets 10/hour. |
| 22 | Requested backup encryption can silently succeed with plaintext | Encryption prerequisites fail closed; tar streams directly to GPG with private permissions and atomic output. |
| 23 | Community roadmap publishing and reads are unbounded | Publishing has author/global ceilings and payload limits; public and author reads are bounded. |
| 24 | Community roadmap color metadata is interpreted as application CSS classes | New and existing publicly read color values pass a fixed class allowlist. |
| 25 | Legacy chat migration crosses accounts in a shared browser | Unscoped legacy localStorage migration removed; pending writes and visible sessions are cleared on account changes. |
| 26 | Public profile ISR allows unbounded negative-cache cardinality | Profile route renders dynamically instead of persisting arbitrary negative ISR entries. |
| 27 | Password reset does not revoke existing sessions | Successful reset verifies email and deletes all auth sessions and refresh tokens in the same transaction. |
| 28 | Role administrators can delete the super-administrator account | Shared admin role/delete guard protects the configured super-admin, including bulk operations. |
| 29 | Signed file wrapper upgrades to a durable storage bearer URL | Signed MCP read route streams bytes with no-store headers; it never reveals or redirects to a durable storage URL. |
| 30 | AI credentials are stored in plaintext when AI_CRED_SECRET is absent | New AI credential writes require encryption; existing plaintext has an explicit dry-run/apply migration. |
| 31 | Pageview limiter keys are selected by the caller | Pageview write budget uses one server-fixed key; changing caller ipHash cannot create buckets or avoid it. |
| 32 | Differential-privacy releases lack composition accounting and valid contribution sensitivity | Public cohort query returns a constant unreleased response until bounded contributions and a release ledger exist. |
| 33 | Tracked progress document exposes real identities and authentication state | Account census/identity/auth-state details removed from the current progress document. |
| 34 | Unsubscribe tokens use a public fallback HMAC key | Missing server secret rejects unsubscribe token signing; public fallback removed. |
| 35 | Suppressed cohort responses reveal exact presence bands | Same constant response for empty and populated cohorts; no presence bands or counts. |
| 36 | AI response bodies are read without a byte limit after the timeout is cleared | Fetch caps buffered bodies at 4 MiB under the original timeout, including stalled streams. |
| 37 | Uncaught reset-route errors can log the bearer token path | Reset-token paths are redacted in request, message and stack output; request queries are dropped. |

## Validation

Passed: frontend/backend type checks, zero-warning lint, 790 Vitest tests (one existing skipped test), coverage thresholds, production build, local anonymous Convex schema/function push, and backup failure/encryption checks. Coverage reported 35.57% statements, 33.94% branches, 33.22% functions and 36.42% lines, subject to the Windows limitation below.

Windows standalone build validation used a local junction/hardlink fallback because native symlink creation lacks permission; production configuration was unchanged. Vitest's existing Windows coverage transform warns that some unexecuted TSX files are excluded, so its passing coverage percentages do not represent full UI coverage. Browser and production smoke tests remain part of rollout.
