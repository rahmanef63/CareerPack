# MCP Server

Satu endpoint HTTPS ber-JSON-RPC yang bisa dipanggil ChatGPT, Claude.ai, Claude
Code, Cursor, dan host AI lain — semuanya dengan protokol yang sama. Yang berbeda
antar host hanya **cara klien mendaftar**, tidak pernah apa yang dilakukan
server.

**Kode:** `convex/mcp/`
**Endpoint:** `https://proficient-dove-151.convex.site/mcp`
**Protokol:** `2024-11-05` (dipin di `convex/mcp/types.ts`)

Versi protokol sengaja dipin di `2024-11-05` meski ada revisi lebih baru
(2025-06-18 menghapus batching, 2025-11-25 menambah tipe `Icon`). Angka itu
masih diterima semua klien yang beredar, dan menaikkannya bukan perubahan
kosmetik — revisi berikutnya mengubah bentuk error dan content.

## Peta modul

```
convex/mcp/
  http.ts        dispatcher JSON-RPC + auth bearer
  jsonrpc.ts     framing, negosiasi, bentuk error
  oauth.ts       authorization code + PKCE, daftar/cabut token
  wellKnown.ts   /.well-known/oauth-authorization-server & -protected-resource
  auth.ts        resolusi access token -> userId
  fileRead.ts    penebusan tautan file bertanda tangan
  types.ts       tipe wire, MCP_PROTOCOL_VERSION, MCP_SCOPES
  tools/         definisi tool per domain (yang dilihat model)
  data/          internalQuery/internalMutation (yang menyentuh DB)
```

Pemisahan `tools/` dan `data/` itu kontrak: **`userId` datang dari access token,
tidak pernah dari `args`**, dan setiap fungsi di `data/` memeriksa ulang
kepemilikan. Sebuah tool tidak pernah menerima id pemilik sebagai parameter.

## Tiga fase

| Fase | Isi | Status |
|---|---|---|
| 1 | Endpoint bearer | ✓ |
| 2 | OAuth 2.1 + PKCE (S256), consent, well-known | ✓ |
| 3 | UI cetak & cabut token | ✓ `frontend/slices/settings/components/McpConnectorCard.tsx` |

Fase 2 penting bukan karena kerapian: form konektor ChatGPT dan claude.ai
**tidak punya kolom API key**. Server yang berhenti di fase 1 bisa dipanggil
Claude Code dan Cursor hari ini, tapi tidak akan diterima kedua form itu.

`plain` PKCE ditolak — challenge sama dengan verifier berarti siapa pun yang
melihat URL authorize bisa menyelesaikan pertukaran, yaitu persis serangan yang
PKCE ada untuk mencegahnya.

### redirect_uri

Loopback (`localhost`, `127.0.0.1`, `[::1]`) diizinkan pada http dan port apa
pun — itu cara jembatan stdio (mcp-remote, Claude Desktop, Cursor) menangkap
redirect. Selain loopback wajib HTTPS dan host harus ada di allowlist.

## Rate limit

Mutasi milik aplikasi sendiri tidak dibatasi: sesi browser mati bersama tab dan
ada manusia yang menyetirnya. Access token MCP kebalikannya — hidup setahun,
duduk di infrastruktur pihak ketiga, dan menyetir tulisan tanpa ada yang
mengawasi.

| Bucket | Batas |
|---|---|
| `mcp:write` | 25 / menit |
| `mcp:write:day` | 400 / hari |

Yang harian bukan duplikat: 25/menit menahan burst, tapi skrip yang menahan
diri di 20/menit lolos selamanya.

## Domain tool

`applications`, `goals`, `roadmap`, `calendar`, `documents`, `budget`,
`financial`, `notifications`, `profile`, `cv`, `contacts`, `mockInterview`,
`matcher`, `files`, `portfolio`.

## File & gambar

Empat operasi, dan dua di antaranya sengaja dibatasi.

| Tool | Fungsi |
|---|---|
| `files_list` | daftar berkas — nama, tipe, ukuran, tag, catatan |
| `files_set_metadata` | ubah tag & catatan |
| `files_delete` | hapus baris + byte-nya |
| `files_upload_url` | langkah 1 unggah — target PUT sekali pakai |
| `files_register` | langkah 2 unggah — catat jadi entri library |
| `files_read_url` | tautan baca, kedaluwarsa **1 jam** |
| `portfolio_set_media` | pasang berkas library ke portfolio item + set thumbnail |

**`storageId` tidak pernah muncul di payload mana pun.** Satu string itu cukup
untuk mengambil blob dari mana saja, selamanya, dan semua yang dikembalikan tool
tersalin ke transkrip pihak ketiga. Berkas dialamatkan lewat id barisnya, yang
tidak berguna tanpa pemeriksaan kepemilikan.

### Kenapa unggah dua langkah

Panggilan JSON-RPC tidak bisa membawa byte. `files_upload_url` mencetak target
PUT sekali pakai milik Convex; `files_register` mencatat barisnya. `registerFile`
memverifikasi blob-nya benar-benar ada (`db.system.get`) supaya pemanggil tidak
bisa mencetak baris library untuk storage id yang ditebak, dan menolak storageId
yang sudah dimiliki orang lain dengan "tidak ditemukan" yang sama seperti untuk
yang tidak ada.

### Kenapa tautan baca ditandatangani

`ctx.storage.getUrl()` mengembalikan URL yang **tidak pernah kedaluwarsa** —
kredensial bearer permanen. `files_read_url` tidak mengembalikannya.

Yang dikembalikan adalah tautan ke `/files/read?t=…` berisi token
`payload.HMAC-SHA256` dengan file id, pemilik, dan expiry. Konsekuensinya
konkret: transkrip yang bocor basi sendiri dalam sejam, dan payload-nya tidak
bisa disunting untuk menunjuk file lain tanpa merusak tanda tangan.

Rutenya tanpa auth — token itulah kredensialnya, karena host AI yang mengambil
gambar tidak punya sesi. Kepemilikan **dicek ulang saat ditebus**, sebab token
hidup lebih lama dari baris yang ditunjuknya. Semua kegagalan menjawab 404 yang
sama dengan `Cache-Control: no-store`, jadi probing tidak mengajari apa pun.

Implementasi: `convex/_shared/signedFileUrl.ts` (+ 8 test yang menguji dua
properti tumpuannya: kedaluwarsa, dan tidak bisa dialihkan sasaran).

### Memasang gambar ke portfolio

Mengunggah saja tidak cukup — tanpa ini host AI bisa menaruh gambar di Pustaka
Konten lalu mentok, yang persis dilaporkan pengguna. `portfolio_set_media`
menutup rantainya: `files_upload_url` → `files_register` → `portfolio_set_media`.

Menerima **`file_id`**, bukan `storageId` — konsisten dengan seluruh permukaan
MCP lain. Gambar pertama menjadi thumbnail dan juga ditulis ke
`coverStorageId` legacy, supaya renderer kartu lama tetap menampilkan gambar.

**Mengganti, bukan menambah.** Model yang tidak bisa melihat state saat ini akan
menggandakan gambar pada tiap retry, dan "set jadi tiga ini" adalah instruksi
yang benar-benar diberikan orang. Daftar kosong melepas media dan thumbnail-nya.

### Allowlist

Satu tempat: `convex/files/allowlist.ts`, diimpor jalur aplikasi **dan** jalur
MCP. Gambar **hanya `image/webp`** (aplikasi mengonversi setiap gambar ke WebP
sebelum unggah); dokumen `application/pdf`. Batas 10 MB / 50 MB.

Ini diekstrak karena hampir melenceng: rancangan pertama jalur MCP memasang
png/jpeg/gif/avif — terlihat masuk akal, dan akan mengisi library dengan format
yang bagian lain produk anggap tidak ada.

## Env

| Var | Untuk |
|---|---|
| `FILE_URL_SECRET` | menandatangani tautan baca file |
| `CONVEX_SITE_URL` | origin yang dipakai menyusun tautan itu |

`FILE_URL_SECRET` sengaja terpisah dari `AI_CRED_SECRET` dan kunci auth — kunci
tanda tangan sebaiknya mengotorisasi satu hal, supaya rotasinya merusak satu
hal. Kalau hilang, `verifyFileToken` menolak semuanya alih-alih jatuh ke jalur
tanpa tanda tangan.

## Menguji end-to-end

Halaman consent **menolak sesi demo** (`"Sesi demo tidak bisa dihubungkan"`),
jadi tes butuh akun password sungguhan — jalankan terhadap deployment **dev**,
bukan produksi.

Alurnya: OAuth 2.1 + PKCE → `tools/list` → `files_upload_url` → PUT byte →
`files_register` → `files_read_url` → ambil byte → coba sunting token → hapus.
Terakhir dijalankan 2026-08-14, 17 asersi lolos.

## Distribusi

### Plugin Claude — sudah ada

```
.claude-plugin/marketplace.json     katalog, di root repo
plugin/
  .claude-plugin/plugin.json        satu-satunya file di sini
  .mcp.json                         registrasi server, di ROOT plugin
  skills/careerpack/SKILL.md        instruksi untuk model
```

Pasang:

```bash
/plugin marketplace add rahmanef63/CareerPack
/plugin install careerpack@careerpack
```

Empat hal yang mudah salah dan sudah dikunci:

- **`type` wajib** di entri server. Tanpa itu entri ber-`url` dibaca sebagai
  stdio, dilewati, dan dilaporkan `has a "url" but no "type"`.
- **Host `.convex.site`, bukan `.convex.cloud`.** Router HTTP dipasang di origin
  site; `.convex.cloud` adalah origin fungsi.
- **`plugin.json` satu-satunya isi `.claude-plugin/`.** Menaruh `skills/` di
  dalamnya membuat plugin termuat tanpa isi.
- **`version` hanya di `plugin.json`.** Kalau diset juga di entri marketplace,
  `plugin.json` menang diam-diam.

Kita memakai **OAuth**, bukan header bearer, jadi `.mcp.json` membawa objek
`oauth` dan bukan `headers` — inilah yang membuat server ini juga bisa masuk
form konektor ChatGPT dan claude.ai, yang tidak punya kolom API key.
`oauth.scopes` sengaja tidak diset: sejak v2.1.196 nilai kosong berarti Claude
Code meminta apa yang diiklankan metadata, dan menyetelnya manual dulu sering
memicu `invalid_scope`.

Terverifikasi: `claude plugin validate --strict` lolos, `--plugin-dir` memuat 1
skill, dan server terdaftar sebagai `plugin:careerpack:careerpack` berstatus
*needs auth* — benar untuk OAuth di sesi non-interaktif.

### ChatGPT — belum

Pendaftaran developer mode dan submission direktori. Panduannya di
`cn-gpt-plugin/` pada `github.com/rahmanef63/connectors`.

### Form setup — belum

Satu tab per host, endpoint dan token di balik tombol salin. Spesifikasinya di
`shared/setup-form.md`. Tanpa ini, menghubungkan server masih perlu dituntun
manual.
