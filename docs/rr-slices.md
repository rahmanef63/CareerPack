# Rahman Resources (rr) — slice usage di CareerPack

> Distribution guide kanonik: <https://github.com/rahmanef63/resource-site/blob/main/CLAUDE.md>.
> Operator skill global: `/rr` (`~/.agents/skills/rr/SKILL.md`).
>
> **Stack:** CareerPack = rr **consumer**. Adopt slice via `npx rahman-resources add <slug>`. Lift improvement balik ke rr via `/rr lift <slug>` (manual `cp -r`; BSDL teardown 2026-05-16).

## Struktur project (post-flatten 2026-05-17)

```
CareerPack/
├── frontend/
│   ├── app/                      ← Next.js App Router
│   ├── slices/                   ← 22 slice (FLAT, no extra src/)
│   │   ├── admin-panel/   ai-agent/    ai-settings/   auth/
│   │   ├── calendar/      career-dashboard/  cv-generator/
│   │   ├── dashboard-home/   database/   document-checklist/
│   │   ├── financial-calculator/  help/   hero/   library/
│   │   ├── matcher/   mock-interview/   networking/
│   │   ├── notifications/   personal-branding/   portfolio/
│   │   ├── settings/   skill-roadmap/
│   │   └── ...
│   └── shared/                   ← cross-slice (hooks, lib, components/ui, types, …)
├── backend/convex-self-hosted/    ← Docker Compose stack
└── convex/                       ← 17 domain folders (orchestrator pattern)
```

Path alias `@/*` resolves ke `frontend/*` per `frontend/tsconfig.json` post-flatten. shadcn primitives di `frontend/shared/components/ui/`; util di `frontend/shared/lib/utils.ts` (re-export dari `rahman-shared` package).

## Slice rr yang dipakai

| Slug | Adopted commit | Notes |
|---|---|---|
| `document-checklist` | `02a2127` (2026-05-15) | First adoption. Diff dari rr 0.1.0 untuk i18n + Convex `documentChecklists`/`documentTemplates` schema. |

Belum ada lain. Hari ini ship `convex-auth` 0.2.0 ke rr tapi CareerPack TIDAK adopt (`frontend/slices/auth/` lokal sendiri, divergent intentionally — PBKDF2 100k + heartbeat + seed integration).

## Lift candidates (CareerPack → rr)

Audit 2026-05-17 per generality:

**Tier A — High portability (low adapter work):**
- `notifications` — bell badge + dropdown + read-state + cron digest
- `calendar` — generic reminder/event + cron
- `ai-agent` — global FAB + console + **action-bus pattern** (novel, reusable)
- `ai-settings` — provider config + quota + sanitize toggles
- `help` — FAQ/help panel
- `hero` — landing hero, sudah props-driven

**Tier B — Medium portability (perlu props lift):**
- `settings`, `library`, `networking`, `dashboard-home`, `financial-calculator`, `portfolio`

**Tier C — Domain-locked, extract pattern instead of copy:**
- `cv-generator` → extract `structured-doc-generator` (live-preview + autosave + html2canvas-pro PDF + accent customize + template registry)
- `personal-branding` → extract `auto-page-from-data`
- `skill-roadmap` → extract `graph-roadmap` (tree/graph viz)
- `mock-interview` → extract `ai-eval-conversation`
- `database` → extract Convex schema browser

**Tier D — Skip:**
- `auth` — locked (PBKDF2 lock-in per CLAUDE.md). Ship via convex-auth 0.2.0 generalization instead.
- `admin-panel`, `matcher`, `career-dashboard`, `cv-generator` core — too domain-locked.

## Workflow

### Adopt rr slice
```bash
npx rahman-resources add <slug>
# Installs to frontend/slices/<slug>/ via CLI auto-detect (post-flatten).
```

### Update adopted slice ke versi rr terbaru
```bash
npx rahman-resources update <slug>
# Warns kalau ada local edit; operator pick keep-local atau overwrite.
```

### Lift CareerPack slice ke rr
Per `/rr lift` verb di `~/.agents/skills/rr/SKILL.md`:

Pre-flight (sebelum `cp -r`):
1. No Clerk imports
2. Files ≤500 LOC (rr CLAUDE) atau ≤200 LOC (audit-file-size hard cap)
3. No hardcoded consumer terms ("CareerPack", business strings)
4. Cross-slice imports via `@/components/ui/*`, `@/shared/*`, `@/features/<own-slug>/*` only
5. Convex tables prefixed `<slug>_*` + `by_workspace` index

Flow:
```bash
SRC=frontend/slices/<slug>
DST=~/projects/resources/frontend/slices/<slug>
cp -r "$SRC" "$DST"
cd ~/projects/resources
# Rewrite imports (replace consumer alias with rr standard)
# Add slice.json / slice.contract.ts / slice.manifest.json (cek slice tetangga as template)
# Update lib/content/slices.ts catalog entry
cd packages/cli && node scripts/gen-manifest.mjs && cd ..
npm run validate:all  # 6 gates: typecheck, slices:check, contracts:drift, audit-slice, audit-file-size, forbidden:terms
git add frontend/slices/<slug> lib/content/slices.ts packages/cli/lib/manifest.json
git commit -m "feat(<slug>): lift from CareerPack"
git push origin main
```

### Update existing rr slice (additive lift)
Hari ini pattern (`convex-auth` 0.1.0 → 0.2.0):
- Pakai backend yang udah ada di rr, lift cuma frontend gap
- Generalize stripped consumer-specific deps
- Bump version, expand `provides.components`/`hooks`/`helpers` di contract
- Regen `lib/shared/features/registry.generated.ts`
- Commit `feat(<slug>): X.Y.Z — lift Z from CareerPack`

Bukan replace, bukan greenfield — UPDATE.

## Hal yang sudah tidak relevan (BSDL teardown 2026-05-16)

- ❌ `.kitab.json` per slice — banned. Auto-clean kalau ketemu.
- ❌ `bidir` block di slice.contract.ts — vestigial; tetap di file karena DSL allow extra props.
- ❌ `npx rr scan-consumers` — removed.
- ❌ `docs/kitabsync.md` — deleted 2026-05-17 (was a BSDL artifact).
- ❌ Term "kitab" di doc/code baru — pakai "rr" atau "Rahman Resources".

## Hard rules (mirror dari rr CLAUDE.md)

1. **No Clerk** — `@convex-dev/auth` only.
2. **shadcn-only UI** — no raw `<button>`/`<dialog>`/`<input type=date|file>`. Wrap pakai `ResponsiveDialog`/`DateField`/`FileUpload`.
3. **Push direct main** — solo dev, Dokploy auto-build. No PR ceremony.
4. **Convex args validator wajib** — every public mutation/query `args: { ... }`.
5. **No bare `.collect()`** — pakai `.withIndex(...).take(N)` atau pagination.
6. **Server-side authz tiap mutation** — `requireUser` / `requireAdmin` dari `convex/_shared/auth.ts`.
7. **AI actions** — `requireQuota → sanitizeAIInput → wrapUserInput → proxy` pipeline.
