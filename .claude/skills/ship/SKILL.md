---
name: ship
description: Run full release gate (typecheck + lint + test + build) on CareerPack. If all pass, create a conventional commit of pending changes and push to origin/main. Use when user says "/ship", "ship it", "release", or asks to push changes to main after a coding session.
---

# /ship — CareerPack release gate

Ship pending changes to `origin/main` only if the full gate is green. Dokploy auto-deploys from main on push, so this is production-facing — do not skip steps.

## Pre-flight

1. `git status --porcelain` — must have at least one change. If clean, stop and tell the user there is nothing to ship.
2. `git rev-parse --abbrev-ref HEAD` — must be `main`. If on a branch, stop and tell the user.
3. `git fetch origin && git status -sb` — confirm no unpulled upstream commits. If behind, stop and ask the user to `git pull` first.

## Gate (run sequentially — stop on first failure)

Run in this exact order; it matches CI and gets cheapest signals first:

1. `pnpm typecheck` — frontend + convex tsconfig.
2. `pnpm lint` — ESLint `--max-warnings=0`.
3. `pnpm test` — Vitest, one-shot.
4. `pnpm build` — Next.js production build. Set `NEXT_PUBLIC_CONVEX_URL` to a real value from `frontend/.env.local`; never a dummy.

If any step fails: print the last ~30 lines of the failure, do **not** commit, ask the user how to proceed.

## Commit + push

Follow the repo commit style (see `git log` — conventional commits, short subject, Indonesian/English both fine, body optional).

1. Summarise the diff in one conventional-commit subject line, ≤72 chars. Use type prefix (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `ci:`, `perf:`, `test:`).
2. Stage files **by name** — never blanket `git add -A`. Skip anything that looks like a secret (`.env*` that is not `.example`, `*.pem`, `*admin-key*`, `convex.env` without `.example`).
3. Create the commit with HEREDOC:
   ```bash
   git commit -m "$(cat <<'EOF'
   <type>: <subject>

   <optional body — why, not what>

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```
4. `git push origin main`.
5. `gh run list --repo "$(gh repo view --json nameWithOwner -q .nameWithOwner)" -L 3` — show the CI + `Deploy Convex` workflows that just triggered so the user can watch them.

## Post-push

Tell the user: commit SHA, one-line summary, and links/commands to watch CI. Do not declare "deployed" — Dokploy webhook picks up asynchronously.

## Refusals

- Never force-push (`--force`, `--force-with-lease`) from this skill.
- Never `git commit --amend` an already-pushed commit.
- Never commit files matching `*.env` (except `*.env.example`), `*.pem`, or containing `CONVEX_SELF_HOSTED_ADMIN_KEY=` in the diff.
- Never skip the gate with `--no-verify`.
