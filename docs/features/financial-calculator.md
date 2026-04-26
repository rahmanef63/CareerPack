# Financial Calculator

## Tujuan

Kalkulator kesiapan keuangan untuk pindah kerja / relokasi. Input: target salary, expense breakdown, optional relocation cost. Output: readiness score + gap analysis + chart.

## Route & Entry

- URL: `/dashboard/calculator`
- Slice: `frontend/src/slices/financial-calculator/`
- Komponen utama: `FinancialCalculator.tsx`

## Struktur Slice

```
financial-calculator/
├─ index.ts
├─ components/FinancialCalculator.tsx
└─ types/index.ts         FinancialData, CityCostOfLiving
```

## Data Flow

Convex: tabel `financialPlans` via `convex/financial/`.

| Operasi | Convex |
|---|---|
| Fetch plan aktif | `api.financial.queries.getUserFinancialPlan` |
| Upsert | `api.financial.mutations.createOrUpdateFinancialPlan` |

Schema:
- `type: "local" | "international"`
- `targetLocation?: string`
- `currentSalary?: number`, `targetSalary: number`
- `expenses: { housing, food, transportation, utilities, entertainment, others }`
- `relocationCosts?: { visa, flights, accommodation, shipping, emergency }`
- `timeline: number` (bulan)
- `readinessScore: number` (computed)

City lookup: `@/shared/data/indonesianData.ts` (province/city + indicative cost of living).

## State Lokal

- Form master (controlled inputs untuk setiap field expense)
- Derived chart data via `useMemo`: breakdown pie, saving timeline line chart

## Dependensi

- `recharts` — `PieChart`, `Pie`, `Cell`, `ResponsiveContainer` (recharts, bukan `@/shared/containers/ResponsiveContainer`)
- shadcn: `card`, `input`, `label`, `select`, `button`, `tabs`
- `@/shared/data/indonesianData`

## Catatan Desain

- Readiness score = fungsi linear dari `targetSalary - totalExpense + relocationBudget` terhadap `timeline`. Client-side murni — tidak call AI.
- Chart tooltip pakai theme tokens (`--chart-sky`, dll) supaya ikut light/dark.
- Satu plan per user (unique via `by_user` index, query `.first()`). Multi-scenario → future work.

## Extending

- Import bank transaction (CSV) untuk auto-populate expenses.
- What-if scenario: duplicate plan + edit — butuh schema multi-plan.
- Currency converter — tambah `currency` field + exchange rate API.

---

## Portabilitas

**Tier:** L — slice (large) + Convex modules (2) + schemas (2) + recharts + Indonesian locale heavy.

**Files:**

```
frontend/src/slices/financial-calculator/
frontend/src/shared/data/indonesianData.ts              # indonesianCityCostOfLiving, jobMarketData
convex/financial/
convex/financial/
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/financial-calculator" "$DST/frontend/src/slices/"
cp "$SRC/frontend/src/shared/data/indonesianData.ts"  "$DST/frontend/src/shared/data/"
cp "$SRC/convex/financial/"                         "$DST/convex/"
cp "$SRC/convex/financial/"                   "$DST/convex/"
```

**Schema:** add `financialPlans` + `budgetVariables` tables. Both by_user indexed; budgetVariables also `by_user_order`.

**Convex api.d.ts:** add `financial` + `budgetVariables`.

**npm deps:** `recharts`.

**Nav:** `calculator` slug.

**i18n & content:** `indonesianCityCostOfLiving` (15+ Indonesian cities), currency `Rp`, locale `id-ID`, job market salary bands. Full locale rewrite for target.

See `_porting-guide.md`.
