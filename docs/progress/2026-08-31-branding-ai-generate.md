# Generate dengan AI — Personal Branding (2026-08-31)

## Ringkasan

Halaman Personal Branding (`/dashboard/personal-branding`) sekarang punya tombol
**"Generate dengan AI"** di kartu HTML kustom. Tombol ini memakai AI CareerPack
sendiri (yang dikonfigurasi user di Setelan → AI) untuk menulis dokumen HTML
halaman publik dari data profil, CV, dan portfolio user yang live — tanpa perlu
setup connector ChatGPT sama sekali.

Ini melengkapi (bukan menggantikan) jalur yang sudah ada: sambungkan CareerPack
ke ChatGPT lewat MCP connector, lalu minta ChatGPT menulis halamannya. Kedua
jalur menulis HTML dengan kontrak marker `data-cp-*` yang sama persis, jadi
hasilnya identik secara teknis — bedanya cuma satu klik di dalam app vs.
percakapan di ChatGPT.

## Kenapa halamannya tidak pernah jadi snapshot mati

AI (baik in-app maupun ChatGPT) tidak menulis nilai data langsung sebagai teks
(misal "Budi Santoso"). Ia menulis *marker* (`data-cp="name"`,
`data-cp-list="projects"`, dst). Saat halaman dirender di iframe, sebuah
hydrator mengisi marker itu dari data user yang live — jadi begitu user
mengubah CV atau menambah project baru, halaman publiknya ikut berubah
otomatis, tanpa perlu generate ulang.

## Alur pemakaian

1. User buka Personal Branding → kartu "HTML Kustom".
2. Pilih template dasar (opsional) dan tulis preferensi gaya singkat (opsional,
   maks 400 karakter) — misal "minimalis, warna biru, tonjolkan 3 project
   terakhir".
3. Klik **Generate**. AI membaca profil/CV/portfolio user, lalu menulis satu
   dokumen HTML lengkap mengikuti kontrak marker.
4. Hasilnya masuk ke kotak teks HTML — **belum tersimpan**. User bisa baca,
   edit manual, atau generate ulang.
5. Klik **Simpan HTML** untuk benar-benar memakainya di halaman publik. Kalau
   halaman sudah aktif (`publicEnabled`), perubahan ini langsung terlihat oleh
   pengunjung dalam waktu singkat — jadi baru disimpan kalau user memang
   sudah yakin.

Kalau ada draft yang belum disimpan di kotak HTML saat user klik Generate,
muncul dialog konfirmasi dulu ("Timpa draft yang belum disimpan?") supaya
tidak ada perubahan manual yang hilang tanpa sadar.

## Batasan yang disengaja

- Tombol ini **tidak** ada di chat AI umum CareerPack — chat agent tetap tidak
  bisa menulis ulang halaman lewat percakapan biasa. Ini action Convex
  tersendiri, satu tujuan, dipicu hanya dari satu tombol.
- Generate **tidak pernah** langsung menerbitkan apa pun. `publicEnabled`
  (nyala/matikan halaman publik) tetap murni keputusan manual user di
  dashboard.
- Kuota AI dipakai seperti fitur AI CareerPack lainnya (dicek dulu setelah
  validasi lokal selesai, dikembalikan otomatis kalau generate gagal).

## Perubahan teknis

- `convex/ai/branding.ts` — action baru `generateBrandingHtml`, mengikuti
  pipeline wajib `requireQuota → sanitizeAIInput → wrapUserInput → proxy`.
- `convex/profile/brandingMarkers.ts` — kontrak marker, daftar template, dan
  path template dipindah ke sini dari `convex/mcp/tools/branding.ts`, supaya
  jalur MCP (ChatGPT) dan jalur in-app ini selalu memakai kontrak yang sama
  persis (tidak mungkin drift).
- `frontend/slices/personal-branding/sections/CustomHtmlCard.tsx` — UI
  generator (pilihan template, kotak preferensi gaya, tombol Generate, dialog
  konfirmasi timpa draft).
- `docs/features/personal-branding.md` — didokumentasikan penuh.

## Status

Sudah di-merge ke `main` sebagai PR #34 (commit `328fa27`), lolos review
mandiri (satu temuan — batas ukuran data profil yang dikirim ke prompt AI —
sudah diperbaiki sebelum merge).
