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

Convex: tabel `documentChecklists` via `convex/documents.ts`.

| Operasi | Convex |
|---|---|
| Fetch | `api.documents.getUserDocumentChecklist` |
| Inisiasi (pilih variant) | `api.documents.createDocumentChecklist` (populate dari `defaultDocuments[type]`) |
| Toggle completed / notes / expiry | `api.documents.updateDocumentStatus` |

Template default (`convex/documents.ts`):
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
