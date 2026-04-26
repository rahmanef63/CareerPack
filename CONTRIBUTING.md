# Contributing to CareerPack

Terima kasih sudah tertarik berkontribusi! CareerPack adalah aplikasi karier
all-in-one (CV builder, AI agent, roadmap, kalender, dll) yang dirilis
dengan **lisensi nonkomersial** — silakan baca [`LICENSE`](./LICENSE)
sebelum mulai.

> **Penting:** Kode ini tidak boleh diperjualbelikan atau digunakan untuk
> tujuan komersial. Penggunaan pribadi, akademik, riset, dan organisasi
> nirlaba dipersilakan.

---

## Cara berkontribusi

### 1. Diskusi dulu untuk perubahan besar

Untuk bug kecil atau perbaikan dokumentasi, langsung buka PR. Untuk fitur
baru, refactor besar, atau perubahan arsitektur, **buka GitHub Issue dulu**
agar arah perubahan disepakati sebelum kerja.

### 2. Setup lokal

Prasyarat: **Node 20+**, **pnpm 10.24.0** (lihat `packageManager` di
`package.json`), Docker (opsional, untuk Convex self-hosted).

```bash
git clone https://github.com/<user>/CareerPack.git
cd CareerPack
pnpm install
cp frontend/.env.example frontend/.env.local        # isi sesuai kebutuhan
cp backend/convex-self-hosted/convex.env.example \
   backend/convex-self-hosted/convex.env             # untuk self-hosted
pnpm dev                                             # Convex sync + Next.js
```

Dua opsi backend:

- **Convex Cloud (paling cepat):** `npx convex dev` lalu paste URL ke
  `NEXT_PUBLIC_CONVEX_URL`.
- **Self-hosted (cocok produksi):** lihat
  [`docs/development.md`](./docs/development.md) untuk Docker Compose +
  admin key.

### 3. Branch + commit

- Buat branch dari `main`: `git checkout -b feat/nama-pendek` atau
  `fix/nama-pendek`.
- Ikuti **Conventional Commits** (lihat `git log` untuk contoh):
  `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `ci:`, `perf:`, `test:`.
- Subject ≤72 karakter, badan opsional. Bahasa Indonesia atau Inggris
  sama-sama OK.

### 4. Gate sebelum push

Pre-commit hook (`simple-git-hooks` + `lint-staged`) sudah jalan otomatis,
**jangan bypass dengan `--no-verify`**. Sebelum membuka PR, jalankan
gate lengkap:

```bash
pnpm typecheck   # frontend + convex tsconfig
pnpm lint        # ESLint --max-warnings=0
pnpm test        # Vitest one-shot
pnpm build       # Next.js production build
```

CI (`.github/workflows/ci.yml`) menjalankan gate yang sama. PR tidak akan
di-merge jika ada yang gagal.

### 5. Pull request

- Title: ringkas, conventional-commit style.
- Body: jelaskan **kenapa** (motivasi/konteks), bukan hanya **apa**.
- Sertakan screenshot/GIF untuk perubahan UI.
- Tag isu terkait (`Closes #123`).
- Satu PR = satu topik. PR multi-tujuan akan diminta dipecah.

---

## Standar kode

### Struktur

- **Slice pattern**: setiap fitur frontend hidup di
  `frontend/src/slices/<kebab-name>/` dengan `index.ts` barrel.
  Slice tidak boleh saling import — kode lintas-slice diangkat ke
  `@/shared/*`.
- **Convex backend**: per domain folder
  (`convex/<domain>/{schema,queries,mutations,actions}.ts`). Schema
  fragment diorkestrasi oleh `convex/schema.ts`.
- Detail lengkap: [`CLAUDE.md`](./CLAUDE.md),
  [`docs/architecture.md`](./docs/architecture.md),
  [`docs/backend.md`](./docs/backend.md).

### TypeScript / React

- **Strict TS**, alias `@/*` → `frontend/src/*`.
- Default **Server Component**. Tambah `"use client"` hanya jika butuh
  state/effect/browser API.
- Tailwind + shadcn/ui. Token desain di
  `frontend/src/shared/styles/index.css`.
- File naming: folder slice `kebab-case`, komponen React `PascalCase.tsx`,
  hook `camelCase.ts(x)`, primitif shadcn `kebab-case.tsx`.

### Convex

- **Setiap mutation** wajib `requireUser(ctx)`.
- **Setiap list query** pakai `optionalUser(ctx)` (return `null` saat
  unauth — supaya SSR/logout tidak crash).
- **Cek kepemilikan** pakai `requireOwnedDoc(ctx, id, "Label")`.
- AI action: `requireQuota` → `sanitizeAIInput` → `wrapUserInput` sebelum
  hit proxy.

### i18n

UI string berbahasa **Indonesia** (`<html lang="id">`). Pesan error dari
Convex juga Indonesia — samakan gaya dengan string yang sudah ada saat
menambah error baru.

### Testing

- Vitest untuk unit test. Letakkan `*.test.ts(x)` bersebelahan dengan
  source file.
- Run satu file: `pnpm exec vitest run <path>`.
- Tidak wajib 100% coverage, tapi logika non-trivial (parsing,
  rate-limit, sanitizer) harus ada test.

---

## Jangan commit ini

- File `.env*` apapun kecuali `*.example`.
- `*.pem`, `*admin-key*`, atau apapun yang berisi
  `CONVEX_SELF_HOSTED_ADMIN_KEY=`.
- Path absolut spesifik mesin (`/home/<user>/...`).
- Identitas pribadi yang tidak perlu (email, nama proyek lain di server
  yang sama).

Kalau ragu, jalankan:

```bash
git diff --cached | grep -iE "key|secret|token|password|/home/"
```

---

## Lisensi kontribusi

Dengan membuka PR, kamu setuju kontribusi-mu dirilis di bawah
[PolyForm Noncommercial License 1.0.0](./LICENSE) yang sama. Kamu tetap
memegang copyright atas kontribusi-mu, tetapi memberi maintainer hak
mendistribusikannya sebagai bagian dari proyek di bawah lisensi tersebut.

---

## Bantuan

- **Bug / fitur**: GitHub Issues.
- **Pertanyaan arsitektur**: baca dulu `docs/`, lalu buka Discussion atau
  Issue jika belum terjawab.

Selamat berkontribusi!
