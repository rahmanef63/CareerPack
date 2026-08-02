# Architecture

CareerPack = Next.js 15 App Router + Convex. Slice-based frontend, catch-all dashboard routing, SSOT nav config.

## 1. Repo Layout

```
CareerPack/
├─ frontend/
│  ├─ app/                              Next.js App Router tree
│  │  ├─ layout.tsx                     Root — metadata, viewport, Providers
│  │  ├─ error.tsx                      Global error boundary
│  │  ├─ (marketing)/                   Route group — public (landing + login)
│  │  │  ├─ layout.tsx                  MarketingHeader + Footer
│  │  │  ├─ page.tsx                    `/` → HeroSection
│  │  │  └─ login/page.tsx              `/login` → LoginPage
│  │  ├─ (dashboard)/                   Route group — authenticated
│  │  │  ├─ layout.tsx                  Auth guard + ResponsiveContainer
│  │  │  └─ dashboard/[[...slug]]/
│  │  │     └─ page.tsx                 Catch-all — resolve slug → slice view
│  │  └─ admin/page.tsx                 `/admin` — role guard
│  ├─ shared/
│  │  ├─ components/                    App shell (Sidebar, BottomNav, Header, FAB, …)
│  │  │  └─ ui/                         shadcn primitives (46 file .tsx)
│  │  ├─ containers/                    ResponsiveContainer → Desktop/Mobile
│  │  ├─ hooks/                         useAuth, useAIConfig, useUIPrefs, useAgenda, useApplications, usePWAInstall, use-mobile
│  │  ├─ providers/                     ConvexClientProvider, Providers root
│  │  ├─ lib/                           env.ts, utils.ts, pwa.ts, aiActionBus.ts, dashboardRegistry.ts
│  │  ├─ styles/                        index.css (Tailwind + tokens), App.css (animations)
│  │  ├─ types/                         Cross-cutting types (auth, agent, api, chat, …)
│  │  └─ data/                          indonesianData.ts (province/city lookup)
│  ├─ slices/                           22 feature slices (lihat docs/features)
│  ├─ public/                           manifest.webmanifest, sw.js, icons, brand svgs
│  ├─ next.config.ts                    output: "standalone", outputFileTracingRoot ke root
│  ├─ tsconfig.json                     `@/*` → `./*` (= `frontend/*`)
│  ├─ tailwind.config.ts                career-{50..900} brand palette + shadcn tokens
│  └─ eslint.config.mjs                 Next ESLint flat config
├─ convex/
│  ├─ schema.ts                         orchestrator — 45 table + authTables
│  ├─ auth.ts                           convexAuth({ providers: [Password(PBKDF2), Anonymous, Google kalau env-nya di-set] })
│  ├─ _shared/                          requireUser, requireOwnedDoc, rateLimit, sanitize, env
│  ├─ _generated/                       Auto-generated API types (Convex CLI)
│  └─ <domain>/                         schema fragment + queries/mutations/actions per domain
├─ backend/convex-self-hosted/          Docker stack (legacy — prod backend = Convex Cloud)
├─ docs/                                Dokumentasi (file ini)
├─ docker-compose.yml                   Frontend Dockerfile stack
├─ Dockerfile                           Multi-stage Next.js standalone
├─ vitest.config.ts                     Unit test setup
└─ pnpm-workspace.yaml                  Workspace: frontend/
```

## 2. Routing

### Marketing (public)

| Path | File | Render |
|---|---|---|
| `/` | `app/(marketing)/page.tsx` | `HeroSection` (redirect `/dashboard` kalau sudah login) |
| `/login` | `app/(marketing)/login/page.tsx` | `LoginPage` |

### Dashboard (auth-guarded)

Semua via catch-all: `app/(dashboard)/dashboard/[[...slug]]/page.tsx`.

| Slug | View (lazy) |
|---|---|
| `""` (root `/dashboard`) | `dashboard-home` → `DashboardHome` |
| `cv` | `cv-generator` → `CVGenerator` |
| `calendar` | `calendar` → `CalendarView` |
| `applications` | `career-dashboard` → `CareerDashboard` |
| `roadmap` | `skill-roadmap` → `SkillRoadmap` |
| `checklist` | `document-checklist` → `DocumentChecklist` |
| `interview` | `mock-interview` → `MockInterview` |
| `calculator` | `financial-calculator` → `FinancialCalculator` |
| `settings` | `settings` → `SettingsView` |
| `ai-settings` | alias route-only → view `settings` (bookmark lama) |
| `matcher` / `networking` / `portfolio` / `notifications` / `help` / `library` / `personal-branding` / `database` / `admin-panel` | slice masing-masing — semua sudah live, bukan placeholder |

Registry: `frontend/shared/lib/dashboardRegistry.ts` (daftar lengkap 19 entry ada di sana). Tambah feature baru = **satu** entry di registry itu; `DASHBOARD_VIEWS`, `PRIMARY_NAV`, dan `MORE_APPS` semuanya derived. `dashboardRoutes.tsx` + `navConfig.ts` cuma re-export shim — jangan tambah data di situ.

### Role-guarded

| Path | Guard |
|---|---|
| `/admin` | `state.user?.role === "admin"` (redirect `/` kalau bukan) |

## 3. Navigation SSOT

File: `frontend/shared/lib/dashboardRegistry.ts` (di-re-export oleh `shared/components/layout/navConfig.ts`).

- `PRIMARY_NAV` — 3 tab utama di BottomNav mobile (home, cv, calendar) + sidebar desktop
- `MORE_APPS` — 15 tile di "Lainnya" (MoreDrawer mobile / sidebar desktop)
- `ALL_NAV_ITEMS` — gabungan keduanya
- `activeNavForPath(pathname)` — prefix-match untuk highlight aktif

**Kontrak**: `href` derived dari slug registry, jadi tidak bisa drift dari `DASHBOARD_VIEWS`.

## 4. Slice Pattern

Setiap slice self-contained di `slices/<kebab-name>/`:

```
<slice>/
├─ index.ts             Barrel — export komponen publik + types (wajib)
├─ components/          React components (wajib, prefix file = UpperCamelCase)
├─ hooks/               Slice-local hooks (opsional — lintas slice? pindah ke shared/)
├─ types/index.ts       Types scoped ke slice (opsional)
├─ constants/index.ts   Data statis (opsional)
├─ lib/                 Helpers murni (opsional)
└─ utils/               Utilities (opsional, mis. mockDataGenerator)
```

Semua sub-folder opsional. Folder kosong ber-`export {}` yang sudah ada adalah scaffolding kontrak fitur yang disengaja — jangan dihapus (lihat CLAUDE.md § Slice pattern).

**Aturan coupling:**
- Slice TIDAK boleh import dari slice lain (kecuali via `@/shared/*`).
- Cross-slice hook (mis. `useApplications` dipakai calendar + career-dashboard) → pindah ke `@/shared/hooks/`, slice re-export untuk kompat lokal.
- Cross-slice type (mis. `Application`, `AgentAction`) → taruh di `@/shared/types/`.

## 5. Providers Tree

`app/layout.tsx` → `Providers`:

```
ThemeProvider (next-themes, class strategy)
└─ ThemePresetProvider (OKLCH preset pipeline)
   └─ ConvexClientProvider (@convex-dev/auth/react ConvexAuthNextjsProvider)
      └─ AuthProvider (shared/hooks/useAuth)
         └─ AIConfigProvider (temperature/model/maxTokens pref, localStorage)
            └─ UIPrefsProvider (font scale, density, prefer-reduced-motion)
               └─ LocaleProvider
                  └─ TooltipProvider
                     └─ {children}
                        + 14 *Capabilities binder slice (aiActionBus)
                        + RegisterSW / SWUpdatePrompt / UpdateChecker / ThemeColorSync
                        + CommandPalette, OfflineBanner, Toaster (sonner)
```

## 6. Responsive Container

`frontend/shared/containers/ResponsiveContainer.tsx` pilih:
- `< lg` → `MobileContainer` (BottomNav 5-slot + AI FAB + MoreDrawer)
- `≥ lg` → `DesktopContainer` (AppSidebar + SiteHeader)

Breakpoint pakai `useIsMobile()` dari `@/shared/hooks/use-mobile`.

## 7. AI Agent

Side-panel global: `<AIAgentConsole>` (slice `ai-agent`). Slash commands terdaftar di `slices/ai-agent/lib/slashCommands.ts`. Aksi cross-slice dipublish via `aiActionBus` (`shared/lib/aiActionBus.ts`) — slice listen via `subscribe()` untuk eksekusi lokal (mis. edit CV bullet).

## 8. Env Flow

- `NEXT_PUBLIC_CONVEX_URL` — dibaca di `shared/lib/env.ts` (lazy getter + URL-validation)
- Convex env (API key OpenAI, JWT, site url) — set di Convex dashboard / self-hosted `.env`

Lihat [development.md](./development.md) untuk full env matrix.

## 9. Testing

- Framework: Vitest (root config `vitest.config.ts`)
- 44 file test co-located di `convex/**` + `frontend/{shared,slices}/**` (mis. `shared/lib/env.test.ts`, `convex/_shared/rateLimit.test.ts`)
- Gate otomatis = pre-push hook lokal (`pnpm typecheck` + `lint` + `test:coverage` + `build`), BUKAN GitHub Actions — lihat [development.md](./development.md) §9

## 10. PWA

- `public/manifest.webmanifest` — icons + theme color
- `public/sw.js` — service worker minimal (cache strategy simple)
- `usePWAInstall` hook — deferred `beforeinstallprompt` + trigger via `InstallSidebarButton` di sidebar desktop
