# Convex self-hosted → Convex Cloud migration — 2026-07-10

Goal (user request): migrate CareerPack's DB + all data from self-hosted Convex
(api.careerpack.org on Dokploy) to **Convex Cloud**, without losing data, and set
up **Google OAuth** (template: `content-rahmanef-com`).

> **Architecture note:** this reverses the `CLAUDE.md` "Convex self-hosted on
> Dokploy is the only data store / Deploy: Dokploy" constraint. Done at the owner's
> explicit direction. `CLAUDE.md` + `docs/` must be updated once cutover is final.

## Data safety — DONE ✅

Full prod snapshot exported (read-only; source untouched):
- `~/backups/careerpack/careerpack-prod-20260710-074024.zip` (3.5 MB, **outside the
  git repo** — contains user PII, must NEVER be committed).
- Includes file storage (`--include-file-storage`).
- Verified: 50 tables, real data — 39 users, 39 authAccounts, 19 userProfiles,
  15 cvs, 17 portfolioItems, 10 jobApplications, 76 authSessions, 1275 jobListings,
  6 files + 7 `_storage` entries, etc.

The source stays LIVE as the source of truth until the cloud copy is verified and
the frontend is cut over. No data can be lost.

## Established facts

- convex CLI **v1.32.0**; Convex Cloud login present (`~/.convex/config.json`).
- A Convex Cloud project already exists: `CONVEX_DEPLOYMENT=dev:compassionate-vole-664`
  (team `template-projects`, project `careerpack`) — linked in `.env.local`.
- Source prod creds live in `.env.local.selfhost` (URL + admin key; key WORKS).
  Gotcha: the admin key contains `|` (don't shell-source it); and the CLI errors if
  `CONVEX_DEPLOYMENT` (from `.env.local`) is set alongside `CONVEX_SELF_HOSTED_*` —
  move `.env.local` aside (with a restore trap) or use `env -u CONVEX_DEPLOYMENT` +
  `--env-file .env.local.selfhost`.
- Prod backend env already has: `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`, `APP_URL`,
  **`AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` (Google OAuth already provisioned)**,
  `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `EMAIL_FROM`, `ADMIN_BOOTSTRAP_EMAILS`,
  `SUPER_ADMIN_EMAIL`. These carry over to the cloud deployment value-blind.

## Execution — DONE (reversible staging, verified) ✅

Target cloud deployment: **`dev:compassionate-vole-664`** (project `careerpack`,
team `template-projects`). It was an empty scaffold (schema deployed, 0 documents)
— confirmed before import, so `--replace-all` had nothing real to overwrite.

1. ✅ **Backup** — `~/backups/careerpack/careerpack-prod-20260710-074024.zip` (verified).
2. ✅ **Env copied prod→cloud, value-blind** — 11 vars set (JWT_PRIVATE_KEY, JWKS,
   SITE_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, APP_URL, RESEND_*, EMAIL_FROM,
   ADMIN_BOOTSTRAP_EMAILS, SUPER_ADMIN_EMAIL). `JWT_PRIVATE_KEY` + `JWKS` **byte-match
   prod** (sessions survive). Multi-line PEM needed the stdin pipe, not an arg.
   7 vars weren't set on prod either (AI proxy, PASSWORD_RESET_HMAC_SECRET, Sentry…)
   → parity kept. **Verify AI features** after cutover — if `CONVEX_OPENAI_*` is
   needed, it must be set on cloud (it wasn't on prod, so AI may rely on the
   `globalAISettings`/per-user `aiSettings` rows, which migrated).
3. ✅ **Code deployed** to cloud (`convex dev --once`).
4. ✅ **Data imported** — `convex import --replace-all` → **4,795 documents + 6
   stored files**. Preserves `_id`/`_creationTime`/`_storage` so all refs stay valid.
5. ✅ **Verified** — cloud counts match backup (39 users incl. Google accounts,
   15 cvs, 19 userProfiles, 17 portfolioItems). JWKS endpoint 200 with issuer
   `https://compassionate-vole-664.convex.site`.
6. ✅ **Google provider env-guarded** in `convex/auth.ts` (inert without creds) and
   redeployed to cloud — Google OAuth is live on the cloud deployment.

The self-hosted prod at api.careerpack.org is **untouched and still live**. Nothing
is cut over. The `.zip` is retained. Migration remains fully reversible.

## Remaining — needs YOU (I stopped at the outward-facing boundary)

- **A. Google Console** — add Authorized redirect URI
  `https://compassionate-vole-664.convex.site/api/auth/callback/google` to the
  existing OAuth client (keep the self-hosted URI for rollback). Same client
  (creds already copied) — no new client.
- **B. Prod cutover (Dokploy)** — set the frontend build env
  `NEXT_PUBLIC_CONVEX_URL=https://compassionate-vole-664.convex.cloud` (the
  `.convex.cloud` host, NOT `.convex.site`) and **rebuild** (NEXT_PUBLIC_* is
  build-time). This is the on/off switch. Rollback = flip it back to the
  self-hosted URL + rebuild.
- **C. Dev-vs-prod cloud** — this staged onto the **dev** deployment. For real prod
  I recommend provisioning a dedicated **prod** cloud deployment (`convex deploy` +
  `convex import --prod` + `convex env set --prod`) so a stray `convex dev` can't
  reset it. I can do that on request.
- **D. Account-linking callback** — port `content-rahmanef-com`'s
  `callbacks.createOrUpdateUser` before heavy Google use, so a Google sign-in whose
  email matches an existing Password user doesn't create a duplicate `users` row /
  orphan that user's CV/roadmap data.
- **E. Docs** — update `CLAUDE.md` (drop "self-hosted is the only data store") once
  cutover is final.

## Post-cutover verification checklist
- Password login + a fresh Google login both succeed.
- A migrated user sees their CVs/applications/portfolio.
- Avatar/CV images (the 6 `_storage` files) render.
- Password reset email + Resend webhook fire (RESEND_* copied).
