# Cloudflare deployment

The frontend runs as a Next.js 15 application on Cloudflare Workers through
OpenNext. Convex owns application data, authentication, and file storage; the
Cloudflare R2 bucket contains only the disposable Next.js incremental cache.

## Production target

- Worker: `careerpack-frontend`, account `8c0b86359883aaeeb6fd3ff73e54ec96`.
- Frontend origin: `https://careerpack.org`.
- Convex API: `https://savory-oyster-802.convex.cloud`.
- Convex HTTP actions: `https://savory-oyster-802.convex.site`.
- Cache bucket: `careerpack-next-cache`; SQLite Durable Object queue handles ISR.
- Next.js image optimization uses the Cloudflare Images binding.

On 2026-10-09, the Convex dashboard showed the custom API and HTTP domains as
disconnected, unavailable on the current plan. Their DNS returned error 1014.
The deployment's system URL overrides were restored to the healthy default
Convex URLs. Do not restore the custom URLs until Convex shows them connected.
Changing frontend public URLs requires a rebuild; runtime variables alone
cannot change values already compiled into the browser bundle.

## Release

1. Verify the production Convex deployment contains the latest security fixes
   from `docs/security-rollout.md`, and verify its data before switching traffic.
   Use an existing authorized deploy key through the Convex CLI. Composio's
   deployment-management API requires a compatible access token, not a project
   deploy key. Keep credentials in secret storage, never in this document.
2. Enable R2 in the account dashboard if required, then create the private
   `careerpack-next-cache` bucket. No public bucket access is needed. Review
   Workers/R2/Images usage limits in the account before production traffic.
3. Install with `pnpm install --frozen-lockfile`; run `pnpm typecheck`,
   `pnpm lint`, and `pnpm test:coverage`.
4. Check the Convex HTTP health endpoint, then run `pnpm build:cloudflare`.
   Use Node.js 22 on Linux for release builds. Build output contains no deploy
   credentials. `pnpm preview:cloudflare` exercises the Workers runtime locally.
5. Set `CLOUDFLARE_ACCOUNT_ID` and a scoped `CLOUDFLARE_API_TOKEN` in the release
   environment, then run
   `pnpm --filter careerpack-frontend exec opennextjs-cloudflare deploy`.
   This uploads the Worker, assets, and incremental cache together.
6. Test the Worker on `careerpack-frontend.careerpack-org.workers.dev` before
   routing `careerpack.org` and `www.careerpack.org` to it. Verify login, session
   renewal, password reset, uploads, public branding, WebSocket updates, and
   backend readiness. Keep the existing DNS values for rollback. Update
   `frontend/wrangler.jsonc` with the verified custom-domain routes after cutover.

The manual `cloudflare-deploy.yml` workflow runs from `main` and expects the
account ID and scoped API token in the GitHub `production` environment secrets.
It checks the backend before building to prevent publishing fallback catalog
pages produced while the backend is unavailable. Push and PR events do not
trigger paid builds.

## Cache and security

Cloudflare serves immutable `/_next/static/` assets directly. Branding HTML
templates pass through the Worker so their same-origin iframe CSP is preserved.
Service workers and the web manifest require revalidation. Private pages and
API responses bypass the zone cache; public SSG/ISR uses OpenNext's private R2
incremental cache and short-lived regional cache. Do not enable Cache Everything
on authenticated content or cache HTML solely by its URL.

The zone already uses strict TLS, HTTPS redirects, Brotli, HTTP/2, HTTP/3, and
TLS 1.3. On 2026-10-09, Early Hints, origin-controlled browser cache TTL, a
CareerPack cache bypass rule, and the Cloudflare Free Managed Ruleset were
enabled. Existing HR rules and mail DNS were preserved. Rocket Loader stays
off for compatibility with Next.js. Invocation logs are disabled to keep reset
tokens out of request logs; sampled application logs remain enabled.

Rollback uses the previous Worker version when available, or the recorded
previous frontend DNS origin. Do not switch Convex deployments or restore a
database snapshot as part of a frontend rollback.

References: [OpenNext setup](https://opennext.js.org/cloudflare/get-started),
[OpenNext cache](https://opennext.js.org/cloudflare/caching),
[Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
