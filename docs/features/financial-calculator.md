# Financial Calculator

> **Portability tier:** L — slice + 1 Convex domain (2 tables) + recharts + heavy Indonesian locale data

## Tujuan

Kalkulator kesiapan keuangan untuk pindah kerja / relokasi + budget tracker
dengan kategori custom + perbandingan biaya hidup antar kota Indonesia.
Output: readiness score, gap analysis, dan chart breakdown.

## Route & Entry

- URL: `/dashboard/calculator`
- Slice: `frontend/src/slices/financial-calculator/`
- Komponen utama: `FinancialCalculator.tsx`

## Struktur Slice

```
financial-calculator/
├─ index.ts
├─ components/
│  ├─ FinancialCalculator.tsx              Page shell — tabs + theme-aware chart colors
│  ├─ BudgetVariableForm.tsx               Modal create/edit budget item (icon + color picker)
│  └─ financial-calculator/
│     ├─ SalaryTab.tsx                    Target salary + readiness score
│     ├─ BudgetTab.tsx                    Budget breakdown + variable manager
│     └─ CityCompareTab.tsx               Biaya hidup antar kota
├─ hooks/
│  ├─ useFinancialPlan.ts                  Convex CRUD + budget variable list/upsert
│  └─ useChartColors.ts                    Pulls --chart-* CSS vars from current theme preset
├─ constants/budgetIcons.ts                Lucide icon name → component map
└─ types/index.ts                          FinancialData, CityCostOfLiving, BudgetVariable
```

## Data Flow

Backend domain: `convex/financial/`. Tabel: `financialPlans`, `budgetVariables`.

| Hook / method | Convex op | Purpose |
|---|---|---|
| `useFinancialPlan.plan` | `api.financial.queries.getUserFinancialPlan` | Fetch single active plan |
| `useFinancialPlan.savePlan` | `api.financial.mutations.createOrUpdateFinancialPlan` | Upsert (one-per-user) |
| `useFinancialPlan.budgetVars` | `api.financial.queries.listBudgetVariables` | Variabel budget custom (urut by `order`) |
| `useFinancialPlan.addVar` | `api.financial.mutations.createBudgetVariable` | Tambah row (label, value, iconName, color, kind) |
| `useFinancialPlan.updateVar` | `api.financial.mutations.updateBudgetVariable` | Patch row |
| `useFinancialPlan.removeVar` | `api.financial.mutations.removeBudgetVariable` | Hard delete |
| `useFinancialPlan.seedDefaults` | `api.financial.mutations.seedBudgetDefaults` | Idempotent seed kategori awal |

Schema (lihat `convex/financial/schema.ts`):

```ts
financialPlans: defineTable({
  userId: v.id("users"),
  type: v.string(),               // "local" | "international"
  targetLocation: v.optional(v.string()),
  currentSalary: v.optional(v.number()),
  targetSalary: v.number(),
  expenses: v.object({ housing, food, transportation, utilities, entertainment, others }),
  relocationCosts: v.optional(v.object({ visa, flights, accommodation, shipping, emergency })),
  timeline: v.number(),           // bulan
  readinessScore: v.number(),     // computed client-side
}).index("by_user", ["userId"]),

budgetVariables: defineTable({
  userId: v.id("users"),
  label: v.string(),
  value: v.number(),
  iconName: v.string(),           // lucide-react name
  color: v.string(),              // chart token, e.g. "--chart-sky"
  order: v.number(),
  kind: v.union(v.literal("expense"), v.literal("savings")),
})
  .index("by_user_order", ["userId", "order"])
  .index("by_user", ["userId"]),
```

## State Lokal

- Form master untuk plan (controlled inputs per expense field)
- Tab state (Salary / Budget / City Compare)
- Modal state untuk `BudgetVariableForm`
- Chart data via `useMemo` — pie breakdown + saving timeline line chart

## Dependensi

- shadcn: `badge`, `button`, `card`, `input`, `label`, `slider`, `tabs`
- `@/shared/components/ui/responsive-alert-dialog`
- `@/shared/components/ui/responsive-dialog`
- `@/shared/components/ui/responsive-select`
- `@/shared/components/ui/responsive-tooltip`
- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/layout/PageContainer`
- `@/shared/data/indonesianData` — `indonesianCityCostOfLiving`, `indonesianJobMarketData`
- `@/shared/lib/formatCurrency` — `formatIDR`, `formatShortIDR`
- `@/shared/lib/notify`, `@/shared/lib/utils` (`cn`)
- `@/shared/providers/ThemePresetProvider` — `useThemePreset`
- `recharts` — `PieChart`, `Pie`, `Cell`, `ResponsiveContainer` (recharts'-own, bukan shared container)
- `lucide-react` ikon (Wallet, PiggyBank, Plane, dll — di-resolve via `constants/budgetIcons.ts`)

## Catatan Desain

- Readiness score linear: `(targetSalary − totalExpense + relocationBudget) / timeline`. Client-only — tidak panggil AI.
- Chart tooltip pakai theme tokens (`--chart-sky`, dll) supaya ikut light/dark/preset. `useChartColors` membaca CSS var dari theme preset aktif.
- Satu plan per user (unique via `by_user` index, `.first()`).
- Budget variables custom user-defined; `seedBudgetDefaults` mengisi 6 kategori starter (Housing, Food, Transport, Utilities, Entertainment, Saving). Idempotent — re-run aman.
- Manifest belum ada — slice bukan subscriber AI bus.

## Extending

- Multi-scenario plan: schema sudah dukung multi-row, tinggal selector UI.
- Import bank statement (CSV) untuk auto-populate expenses.
- Currency converter — tambah `currency` field + exchange rate API call.
- Slice manifest + AI skill (`finance.update-target-salary`, dst.) — pattern mirip `settings`.

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice (self-contained, recharts dynamic-imported di FinancialCalculator)
frontend/src/slices/financial-calculator/

# Shared deps
frontend/src/shared/data/indonesianData.ts                              # cost of living + job market
frontend/src/shared/lib/formatCurrency.ts                               # formatIDR, formatShortIDR
frontend/src/shared/providers/ThemePresetProvider.tsx                   # chart token bridge (or stub useThemePreset → null)
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/responsive-dialog.tsx
frontend/src/shared/components/ui/responsive-alert-dialog.tsx
frontend/src/shared/components/ui/responsive-select.tsx
frontend/src/shared/components/ui/responsive-tooltip.tsx
frontend/src/shared/components/layout/PageContainer.tsx
frontend/src/shared/lib/notify.ts
frontend/src/shared/lib/utils.ts                                        # cn()

# Backend
convex/financial/                                                       # schema + queries + mutations
```

**cp commands** (from CareerPack root → target project root):

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/financial-calculator" "$DST/frontend/src/slices/"

# Shared deps
mkdir -p "$DST/frontend/src/shared/data"
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/providers"
mkdir -p "$DST/frontend/src/shared/components/ui"
mkdir -p "$DST/frontend/src/shared/components/layout"

cp "$SRC/frontend/src/shared/data/indonesianData.ts"                                "$DST/frontend/src/shared/data/"
cp "$SRC/frontend/src/shared/lib/formatCurrency.ts"                                 "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/notify.ts"                                         "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/providers/ThemePresetProvider.tsx"                     "$DST/frontend/src/shared/providers/"
cp "$SRC/frontend/src/shared/components/layout/PageContainer.tsx"                   "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx"              "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-dialog.tsx"                   "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-alert-dialog.tsx"             "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-select.tsx"                   "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-tooltip.tsx"                  "$DST/frontend/src/shared/components/ui/"

# Backend
cp -r "$SRC/convex/financial" "$DST/convex/"
```

**Schema additions** — append both tables to target's `convex/schema.ts` (or import the fragment):

```ts
import { financialTables } from "./financial/schema";

// inside defineSchema({...}):
...financialTables,
```

Or copy the literal table defs from `convex/financial/schema.ts` (snippet under "Data Flow" above) directly into `convex/schema.ts`.

**Convex api.d.ts** — add imports + typeof aliases (see `_porting-guide.md` §2):

```ts
import type * as financial_mutations from "../financial/mutations.js";
import type * as financial_queries from "../financial/queries.js";

declare const fullApi: ApiFromModules<{
  // ...
  "financial/mutations": typeof financial_mutations;
  "financial/queries": typeof financial_queries;
}>;
```

**npm deps:**

```bash
pnpm -F frontend add recharts
```

**Env vars** — none specific; Convex baseline only.

**Manifest + binder wiring** — N/A (slice tidak punya manifest).

**Nav registration** — `dashboardRoutes.tsx` + `navConfig.ts` (see `_porting-guide.md` §4). Slug `calculator` (label "Kalkulator Keuangan", icon `Wallet`, hue `from-amber-400 to-amber-600`).

**i18n** — Indonesian-heavy:
- Field labels: "Target Gaji", "Pengeluaran Bulanan", "Biaya Relokasi", "Skor Kesiapan"
- Currency `Rp` + locale `id-ID` (`Intl.NumberFormat("id-ID", …)`)
- `indonesianCityCostOfLiving` covers 15+ Indonesian cities — translate atau swap dataset untuk pasar lain
- `indonesianJobMarketData` salary bands = market reference, sangat lokal

**Common breakage after port:**

- **Chart tooltip blank / white-on-white** — `useChartColors` resolves `--chart-*` CSS vars from `ThemePresetProvider`. Kalau target tidak port theme-preset system, stub `useThemePreset()` agar return `null` dan fallback ke palet hardcoded di `useChartColors`.
- **`recharts` SSR error** — pastikan `FinancialCalculator.tsx` adalah Client Component (`"use client"` sudah di-set di slice; jangan dihapus).
- **Budget variable icons missing** — `constants/budgetIcons.ts` map ke `lucide-react`. Kalau target pakai versi lucide berbeda, beberapa nama bisa drift.
- **Empty city compare tab** — `indonesianCityCostOfLiving` tidak dicopy. Verify `frontend/src/shared/data/indonesianData.ts` ada di target.
- **`formatIDR` undefined** — pastikan `formatCurrency.ts` dicopy; tidak ada ekuivalen built-in.

**Testing the port:**

1. Navigate `/dashboard/calculator` → halaman render dengan 3 tabs
2. Tab Salary: input target salary → readiness score update real-time
3. Tab Budget: klik "Tambah Variabel" → modal buka, simpan → muncul di list + chart pie
4. Tab City Compare: pilih kota → tabel biaya hidup render
5. Reload → semua data persist (Convex round-trip OK)

Run `_porting-guide.md` §9 checklist.
