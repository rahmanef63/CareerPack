# Admin Panel

> **Portability tier:** L — slice + multiple Convex domains + recharts dep.

## Tujuan

Panel administratif lengkap — analytics, AI gateway config, skills/tools
seed catalog editor, audit log viewer, error log viewer, feedback
inbox, roadmap template editor, and bulk roadmap-skill curation. Single
point of operational control for super-admins / admins.

## Route & Entry

- URL: `/dashboard/admin-panel`
- Slice: `frontend/src/slices/admin-panel/`
- Main component: `AdminPanel.tsx`

## Struktur Slice

```
admin-panel/
├─ index.ts                                   export { AdminPanel }
├─ components/
│  ├─ AdminPanel.tsx                          Tab orchestrator
│  ├─ AIConfigPanel.tsx                       Global AI provider/key/model
│  ├─ AISkillsPanel.tsx                       aiSkills CRUD + Seed default
│  ├─ AIToolsPanel.tsx                        aiTools CRUD + Seed default
│  ├─ AuditLogPanel.tsx                       Recent admin/auth events
│  ├─ ErrorLogsPanel.tsx                      Server error stream
│  ├─ FeedbackPanel.tsx                       User feedback inbox
│  ├─ OpenRouterModelPicker.tsx               Live OpenRouter catalog
│  ├─ RoadmapPanel.tsx                        Roadmap library curator
│  ├─ TemplatePanel.tsx                       Roadmap template editor
│  ├─ UserModelOverrideSection.tsx            Per-user model override
│  ├─ UsersTable.tsx                          Top-200 users + profile join
│  ├─ roadmap-panel/{RoadmapSkillsSheet,SkillFormDialog,columns}
│  └─ template-panel/{ImportConfirmDialog,LinkAuditDialog,NodeEditor,TemplateEditorSheet,columns}
├─ constants/roadmap.ts                       Category metadata
├─ hooks/useTemplatePanel.ts                  Template editor state machine
├─ lib/{roadmap.ts, template.ts}              Validation + diff utilities
└─ types/{roadmap.ts, template.ts}            Internal shapes
```

## Data Flow

Backend domains: `convex/admin/`, `convex/ai/`, `convex/roadmap/`,
`convex/feedback/`, `convex/profile/`.

| Concern | Convex |
|---|---|
| Super-admin probe | `api.admin.queries.amISuperAdmin` |
| Overview cards | `api.admin.queries.getOverview` |
| Profile aggregates | `api.admin.queries.getProfileAggregates` |
| Feature adoption | `api.admin.queries.getFeatureAdoption` |
| Signup trend | `api.admin.queries.getSignupTrend` |
| Users table | `api.admin.queries.listUsersWithProfiles` |
| AI gateway config | `api.ai.queries.getGlobalAISettings` / `mutations.{setGlobalAISettings,clearGlobalAISettings}` |
| Per-user model override | `api.ai.queries.listAIOverrides` / `mutations.{setUserAIModelOverride,clearUserAIModelOverride}` |
| AI skills | `api.ai.queries.listAISkills` / `mutations.{seedAISkills,upsertAISkill,toggleAISkill,deleteAISkill}` |
| AI tools | `api.ai.queries.listAITools` / `mutations.{seedAITools,upsertAITool,toggleAITool,deleteAITool}` |
| OpenRouter catalog | `api.ai.actions.listOpenRouterModels` |
| Roadmap library | `api.roadmap.queries.*` / `mutations.*` |
| Roadmap templates | `api.roadmap.queries.listTemplates` / `mutations.upsertTemplate` |
| Audit log | `api.admin.queries.listAuditLog` |
| Error log | `api.admin.queries.listErrorLogs` |
| Feedback inbox | `api.feedback.queries.listFeedback` / `mutations.markFeedbackResolved` |

Three-layer access enforcement still in place:
1. Nav hiding via `useVisibleMoreApps()` (read `amISuperAdmin`).
2. Component redirect (`useEffect` on `false` → `/dashboard`).
3. Server enforcement — every gated query/mutation throws `"Tidak berwenang"`.

## State Lokal

- Active tab key (cards / ai-config / skills / tools / roadmap / templates / audit / errors / feedback / users).
- Per-panel form state (model picker, skill/tool form, template node graph).
- `pending` flags + optimistic toasts.

## Dependensi

- `@/shared/hooks/useVisibleMoreApps` — nav filter helper.
- `@/shared/components/data-table` — generic sortable/filterable table.
- `@/shared/components/ui/responsive-page-header`, `card`, `badge`, `progress`, `table`, `tabs`, `dialog`, `responsive-dialog`, `responsive-alert-dialog`, `select`, `responsive-select`, `sheet`, `switch`, `textarea`, `tooltip`.
- `recharts` — `LineChart` + `BarChart`.
- `lucide-react` icon set.

## Catatan Desain

- **Super-admin via env var.** `SUPER_ADMIN_EMAIL` (Convex env) gates analytics. Stricter than `requireAdmin` — role-admin accounts can edit AI config but only the super-admin email sees aggregates.
- **Idempotent seeds.** `seedAISkills` + `seedAITools` upsert by `key`/`type`; admin-edited rows (`isSeed: false`) never clobbered. Seed rows can't be deleted, only disabled — guards default catalog integrity.
- **Generic error.** Every gate throws `"Tidak berwenang"`; non-super-admin can't deduce gate type via 403 vs 404.
- **OpenRouter live fetch** — no caching yet; admin changes config rarely, refetch is cheap.
- **Roadmap templates** stored as adjacency list + zod-validated diff before persist; LinkAuditDialog flags broken refs.

## Extending

- CSV / JSON export on user table + audit log.
- Time-bucket drilldown on signup trend.
- Cohort retention.
- Admin webhook to outbound Slack on new feedback.

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice (full tree)
frontend/src/slices/admin-panel/

# Shared
frontend/src/shared/hooks/useVisibleMoreApps.ts
frontend/src/shared/components/data-table/                # generic table

# Backend
convex/admin/
convex/ai/                                                # if not already ported via ai-agent
convex/roadmap/
convex/feedback/
convex/_shared/auth.ts                                    # requireAdmin / requireSuperAdmin / SUPER_ADMIN_EMAIL
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

mkdir -p "$DST/frontend/src/slices" \
         "$DST/frontend/src/shared/hooks" \
         "$DST/frontend/src/shared/components/data-table" \
         "$DST/convex/admin" "$DST/convex/ai" \
         "$DST/convex/roadmap" "$DST/convex/feedback" \
         "$DST/convex/_shared"

cp -r "$SRC/frontend/src/slices/admin-panel"             "$DST/frontend/src/slices/"
cp "$SRC/frontend/src/shared/hooks/useVisibleMoreApps.ts" "$DST/frontend/src/shared/hooks/"
cp -r "$SRC/frontend/src/shared/components/data-table/."  "$DST/frontend/src/shared/components/data-table/"
cp -r "$SRC/convex/admin/."     "$DST/convex/admin/"
cp -r "$SRC/convex/ai/."        "$DST/convex/ai/"
cp -r "$SRC/convex/roadmap/."   "$DST/convex/roadmap/"
cp -r "$SRC/convex/feedback/."  "$DST/convex/feedback/"
cp "$SRC/convex/_shared/auth.ts" "$DST/convex/_shared/"
```

**Schema additions** — copy table fragments from
`convex/{admin,ai,roadmap,feedback}/schema.ts`. Notable tables:

- `auditLog` (admin domain).
- `errorLogs`.
- `aiSettings`, `globalAISettings`, `aiUserModelOverrides`, `aiSkills`, `aiTools`, `rateLimitEvents`, `chatConversations`.
- `roadmapNodes`, `roadmapTemplates`, `roadmapSkills`.
- `feedbackEntries`.

**Convex api.d.ts** — add `admin`, `ai`, `roadmap`, `feedback`.

**npm deps:**

```bash
pnpm -F frontend add recharts
```

**Env vars:**
- `SUPER_ADMIN_EMAIL` (Convex env) — gates analytics.
- `ADMIN_BOOTSTRAP_EMAILS` (optional) — auto-promote on first login.

**Nav registration:**

`navConfig.ts` — append tile with `superAdminOnly: true`:
```ts
{ id: "admin-panel", label: "Admin Panel", icon: ShieldAlert,
  href: "/dashboard/admin-panel", hue: "from-red-500 to-rose-700",
  superAdminOnly: true }
```
Both `app-sidebar.tsx` + `MoreDrawer.tsx` must consume
`useVisibleMoreApps()` instead of raw `MORE_APPS`.

**i18n:** Indonesian throughout. Keep tab labels for self-doc.

**Common breakage:**

- Adoption queries reference tables target lacks → trim
  `getFeatureAdoption` `Promise.all`.
- Recharts color tokens `oklch(var(--brand))` — adjust to `hsl(var(--brand))` if target uses HSL theme.
- `useVisibleMoreApps` shape mismatch when target uses `SLICE_REGISTRY` exclusively — read `NAV_MORE` instead.

**Testing the port:**

1. Sign in as `SUPER_ADMIN_EMAIL` → tile visible, all panels render.
2. Sign in as another admin → AI panels work, analytics throw `"Tidak berwenang"`.
3. Click Seed default in AI Skills → 5 rows insert, second click reports updated/skipped without dupes.
4. Edit a seed row's prompt → toggle off → re-seed → admin edit preserved.
5. Roadmap template editor save → reload → graph round-trips.

Run `_porting-guide.md` §9 checklist.
