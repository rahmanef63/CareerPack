# Document Checklist

## Tujuan

Ceklis dokumen persiapan kerja — varian `local` (Indonesia) dan `international`. Track mana yang ready, notes per item, expiry date.

## Route & Entry

- URL: `/dashboard/checklist`
- Slice: `frontend/src/slices/document-checklist/`
- Komponen utama: `DocumentChecklist.tsx`

## Struktur Slice

```
document-checklist/
├─ index.ts
├─ components/DocumentChecklist.tsx
└─ types/index.ts       ChecklistItem, DocumentCategory, DocumentSubcategory
```

Inline variant ringkas: `cv-generator/components/DocChecklistInline.tsx` — embed ringkas di CV editor.

## Data Flow

Convex: tabel `documentChecklists` via `convex/documents/`.

| Operasi | Convex |
|---|---|
| Fetch | `api.documents.queries.getUserDocumentChecklist` |
| Inisiasi (pilih variant) | `api.documents.createDocumentChecklist` (populate dari `defaultDocuments[type]`) |
| Toggle completed / notes / expiry | `api.documents.mutations.updateDocumentStatus` |

Template default (`convex/documents/`):
- `local`: resume, cover-letter, portfolio, references, certifications, transcripts
- `international`: passport, visa, degree-evaluation, language-test (TOEFL/IELTS), police-clearance, medical-exam

Progress persentase: completed / required × 100.

## State Lokal

- `typeFilter` / `categoryFilter`
- `expandedItemId` untuk edit notes / expiry

## Dependensi

- shadcn: `card`, `checkbox`, `input`, `date-picker`, `select`, `badge`, `alert-dialog` (delete), `progress`
- `date-fns` untuk hitung sisa hari sampai expiry

## Catatan Desain

- Category-based grouping bikin scan cepat (Application / Credentials / Identity / Legal / Education / Health / Skills).
- Expiry date bukan wajib — field `expiryDate?: string`. Null = tidak tracked (mis. CV tidak punya expiry).

## Extending

- Upload dokumen (file storage) → pakai Convex storage + link ke `storageId`.
- Reminder ekspirasi → notification 30/7/1 hari sebelum expiry (scheduled function).
- Sharing checklist ke coach / mentor — butuh role-based access.

---

## Portabilitas

**Tier:** L — slice + Convex module + schema + big hardcoded Indonesian checklist template.

**Files:**

```
frontend/src/slices/document-checklist/
frontend/src/shared/data/indonesianData.ts                  # contains indonesianDocumentChecklist template
convex/documents/
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/document-checklist"    "$DST/frontend/src/slices/"
cp "$SRC/frontend/src/shared/data/indonesianData.ts"   "$DST/frontend/src/shared/data/"
cp "$SRC/convex/documents/"                          "$DST/convex/"
```

**Schema:** add `documentChecklists` table with `documents[]` (id/name/category/subcategory/required/completed/notes/expiryDate) + `by_user` index.

**Convex api.d.ts:** add `documents: typeof documents`.

**npm deps:** none.

**Nav:** `checklist` slug in MORE_APPS.

**i18n & content:** `indonesianDocumentChecklist` = ~200 items Indonesia-specific (KTP, NPWP, visa reqs). Full rewrite for target market.

**Pattern:** frontend owns template (title/description), server stores per-item completion state. See guides.md G13 pattern A.

See `_porting-guide.md`.
