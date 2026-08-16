# MCP Server

Satu endpoint HTTPS ber-JSON-RPC yang bisa dipanggil ChatGPT, Claude.ai, Claude
Code, Cursor, dan host AI lain — semuanya dengan protokol yang sama. Yang berbeda
antar host hanya **cara klien mendaftar**, tidak pernah apa yang dilakukan
server.

**Kode:** `convex/mcp/`
**Endpoint:** `https://proficient-dove-151.convex.site/mcp`
**Protokol:** dinegosiasikan — `2024-11-05`, `2025-03-26`, `2025-06-18`
(`MCP_PROTOCOL_VERSIONS` di `convex/mcp/types.ts`)

Server menjawab `initialize` dengan versi yang **diminta klien** kalau ada di
daftar itu, kalau tidak menawarkan yang terbaru yang diimplementasikan.
Rinciannya, termasuk kenapa berhenti di `2025-06-18`, ada di bagian
[Versi protokol](#versi-protokol--dinegosiasikan-bukan-dipatok) di bawah.

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

## Versi protokol — dinegosiasikan, bukan dipatok

Sampai 2026-08-14 server selalu menjawab `"2024-11-05"`, apa pun yang diminta
klien. Itu sah menurut aturan handshake, tapi artinya server mendeskripsikan
dirinya lebih tua daripada perilakunya, dan tidak pernah bisa memakai apa pun
yang ditambahkan revisi setelahnya.

Sekarang `MCP_PROTOCOL_VERSIONS` (`convex/mcp/types.ts`) berisi revisi yang
benar-benar diimplementasikan — `2024-11-05`, `2025-03-26`, `2025-06-18` — dan
`initialize` **mengembalikan versi yang diminta klien** kalau ada di daftar itu,
kalau tidak menawarkan yang terbaru.

Batas atas `2025-06-18` disengaja:

- revisi itu yang memperkenalkan `structuredContent`, yang sekarang dikirim;
- revisi itu **menghapus** batching JSON-RPC. Server tetap **menerima** batch
  (`convex/mcp/http.ts`) karena longgar di sisi input tidak merugikan;
- revisi itu mewajibkan klien mengirim header `MCP-Protocol-Version`. Server
  tidak menegakkannya — menolak permintaan karena header hilang hanya akan
  merusak klien yang sudah jalan.

**Yang belum:** `2025-11-25` dan `2026-07-28`. Yang terakhir adalah revisi
**terkini** dan merupakan penulisan ulang stateless — handshake `initialize`
dihapus, `Mcp-Session-Id` hilang, versi protokol pindah ke `_meta` per
permintaan, ada RPC `server/discover` wajib, plus header `Mcp-Method`/`Mcp-Name`.
Itu penulisan ulang transport, bukan naik versi, dan belum ada host yang kita
layani menegosiasikannya.

## `structuredContent` — data yang sama, dua encoding

`toolOk` mengirim `structuredContent` untuk setiap payload yang berupa objek
biasa, memakai **referensi objek yang sama** dengan blok teks — jadi keduanya
tidak mungkin berbeda isi. Blok teks tidak diubah sedikit pun; itu yang dibaca
semua klien sekarang.

Sembilan tool baca mengembalikan `null` kalau datanya tidak ada, dan untuk empat di
antaranya (`profile_get`, `roadmap_get`, `documents_list`, `financial_plan_get`)
`null` adalah kondisi hari pertama setiap akun baru. Panggilan itu tidak
membawa `structuredContent` sama sekali — sah, karena `null` bukan objek JSON.

**`outputSchema` sengaja tidak dideklarasikan untuk satu tool pun.** Bukan karena
malas: SDK TypeScript resmi **melempar error** kalau sebuah tool mendeklarasikan
`outputSchema` tapi hasil suksesnya tidak membawa `structuredContent`. Kalau
dideklarasikan, cabang `null` di atas — cabang yang paling sering kena — berubah
dari "model bilang datanya belum ada" jadi `McpError` di sisi klien. Ditambah
tidak ada konsumen yang membacanya, dan 42 tool sisanya punya bentuk keluaran
unik masing-masing.

## Golden prompt

`convex/mcp/goldenPrompts.test.ts` — 258 prompt (157 langsung, 74 tidak
langsung, 28 negatif) menutup **seluruh 74 tool**.

Yang dicek: strukturnya saja — setiap prompt menyebut tool yang benar-benar ada,
tidak ada tool yang tak punya prompt langsung, prompt negatif tidak
mengharapkan tool apa pun. Itu cukup untuk menangkap rename atau tool yang jadi
tidak terjangkau.

Yang **tidak** dicek di situ: apakah model betulan memilih tool itu. Untuk itu
ada runner terpisah.

### Runner eval — model sungguhan

`convex/mcp/goldenPrompts.eval.test.ts`. Mati kecuali diminta:

```bash
MCP_EVAL=1 MCP_EVAL_API_KEY=sk-... \
  pnpm exec vitest run convex/mcp/goldenPrompts.eval.test.ts \
  --reporter=verbose | tee mcp-eval-report.txt
```

`--reporter=verbose` **wajib** — reporter default menelan console output kalau
test-nya lulus, padahal laporan itu justru satu-satunya hasil yang dicari.

Knob: `MCP_EVAL_PROVIDER` (kunci dari `_shared/aiProviders.ts`, default
`openai`), `MCP_EVAL_BASE_URL`, `MCP_EVAL_MODEL`, `MCP_EVAL_KIND`,
`MCP_EVAL_TOOL`, `MCP_EVAL_LIMIT`, `MCP_EVAL_CONCURRENCY`,
`MCP_EVAL_MIN_ACCURACY`.

**Biaya.** Tiap permintaan membawa **seluruh 74 skema tool** — sekitar 27rb
token input sebelum promptnya sendiri, karena katalognya besar dan tidak bisa
dipotong (justru katalog utuh itu yang sedang diuji).

| Jalannya | Permintaan | Token input | Perkiraan (gpt-4o-mini, tanpa cache) |
|---|---|---|---|
| `MCP_EVAL_LIMIT=20` | 20 | ~0,5 jt | ~$0,08 |
| `MCP_EVAL_LIMIT=40` | 40 | ~1,1 jt | ~$0,16 |
| penuh | 258 | ~7,0 jt | ~$1,05 |

Jadi jutaan token, tapi bukan uang yang bikin kaget — dan provider yang
meng-cache prefix identik menekannya lagi. Tetap mulai dari `MCP_EVAL_LIMIT=20`,
atau `MCP_EVAL_TOOL` kalau cuma mau mengutak-atik deskripsi satu tool. Runner
mencetak pemakaian tokennya sendiri, jadi angka nyata menggantikan tebakan ini
setelah putaran pertama.

Laporannya mengelompokkan salah pilih **berdasarkan pasangan kebingungannya**,
bukan per prompt — sepuluh prompt yang sama-sama melenceng dari `cv_get` ke
`cv_list` itu satu bug penulisan deskripsi, bukan sepuluh:

```
kind        n    hit   accuracy
direct      16     2   12.5%
TOTAL       24     3   12.5%   (456,000 prompt tokens)

misses, grouped by confusion:
  cv_get -> cv_list  (3)
    - Ini cv_id-nya j57d2k9xq1. Tampilkan isi lengkapnya…
```

Kegagalan setup (kunci salah, kuota habis, 500) **tidak** dihitung sebagai
jawaban salah — run-nya langsung gagal dengan pesan HTTP-nya. Kalau tidak,
kunci yang lupa diset akan terbaca sebagai "akurasi 0%" dan orang malah
mengubah deskripsi tool untuk memperbaiki environment variable.

`MCP_EVAL_MIN_ACCURACY` itu **penjaga regresi, bukan nilai rapor**. Ambil
baseline dari satu putaran penuh, lalu set sedikit di bawahnya.

Mesinnya sendiri (`convex/mcp/evalRunner.ts`) diuji tanpa jaringan lewat
`fetchImpl` yang disuntik — retry 429, kegagalan keras, no-call, salah pilih,
urutan worker pool. Logika yang cuma jalan kalau ada API key adalah logika yang
tidak pernah diperiksa siapa pun.

## Snapshot kontrak

`convex/mcp/__snapshots__/contract.test.ts.snap` memaku payload `tools/list`
persis apa adanya. Snapshot dibangun dari `toolDescriptors()` — fungsi yang sama
yang dipakai dispatcher — supaya test tidak bisa lulus sambil format kawatnya
bergeser diam-diam.

Kalau gagal: baca diff-nya. Kalau perubahannya disengaja, `vitest -u`. Nilainya
ada di membaca diff itu; tim yang refleks regenerate tidak dapat apa-apa.

## Domain tool

`applications`, `goals`, `roadmap`, `calendar`, `documents`, `budget`,
`financial`, `notifications`, `profile`, `cv`, `contacts`, `mockInterview`,
`matcher`, `files`, `portfolio`, `branding`.

## Base prompt — `instructions` di `initialize`

`convex/mcp/instructions.ts` → `SERVER_INSTRUCTIONS`, dikembalikan di hasil
`initialize`. Host (ChatGPT, Claude, Cursor) menaruhnya di depan model sebelum
tool call pertama. Ini satu-satunya kanal yang bisa menjelaskan **server**-nya,
bukan satu tool: model kalau tidak ada ini cuma ketemu 74 nama tool datar dan
menebak — tidak tahu ada job matcher, tidak tahu semua tool terikat ke satu
orang, tidak tahu user-nya berbahasa Indonesia.

Isinya sengaja orientasi saja, satu baris per domain: apa gunanya + alur yang
tidak bisa ditebak dari nama tool (mis. upload file dua langkah, mock interview
start → answer → finish, halaman branding pakai marker bukan nilai literal).
Argumen, enum, dan default tetap milik deskripsi per tool — menyalinnya ke sini
cuma bikin dua salinan yang bakal geser.

`jsonrpc.test.ts` memaku dua hal: `instructions` ada, dan **setiap domain tool
disebut di dalamnya**. Menambah domain baru tanpa menyebutnya di brief =
domain yang tidak akan pernah kepikiran dipakai model, dan test-nya merah.

## Halaman branding publik

Lima tool untuk halaman publik di `careerpack.org/<slug>`
(`tools/branding.ts` + `data/branding.ts`): tiga baca, dua tulis — dan satu
operasi yang sengaja tidak ada.

| Tool | Fungsi | Scope |
|---|---|---|
| `branding_get` | status halaman: published, slug, URL, headline, indexable, template bawaan yang dipakai, ada-tidaknya HTML custom + ukurannya. `include_html: true` baru mengembalikan dokumennya | `mcp.read` |
| `branding_data` | payload `__cp_data` yang dihidrasi halaman, **plus kontrak marker** yang mengikatnya ke markup | `mcp.read` |
| `branding_templates` | daftar template bawaan, atau HTML utuh salah satunya sebagai titik awal | `mcp.read` |
| `branding_set_html` | ganti **seluruh** dokumen halaman (maks `PUBLIC_HTML_MAX` = 250.000 karakter) | `mcp.write` |
| `branding_delete_html` | hapus HTML custom — halaman jatuh balik ke template bawaan | `mcp.write` |

**Tidak ada tool publish, disengaja.** `publicEnabled`, `publicSlug`, dan
`publicAllowIndex` hanya bisa ditulis dari dashboard. Host AI boleh menyusun
halamannya; keputusan bahwa halaman itu tayang di internet atas nama seseorang
tetap di manusia. `branding_set_html` ke halaman yang belum aktif tetap
tersimpan, dan tetap privat.

### Kontrak marker — kenapa `branding_data` mengembalikan dua hal

HTML yang ditulis model **bukan snapshot**. Renderer menyuntikkan
`<script id="__cp_data">` + hydrator yang sama ke `publicHtml` seperti ke
template bawaan, jadi marker di dalamnya terus terisi dari CV / portofolio /
profil yang hidup:

| Atribut | Arti |
|---|---|
| `data-cp="KEY"` | isi teks elemen. `data-cp-mode="src" \| "href" \| "html"` mengisi atribut, bukan teks. **Nilai kosong menyembunyikan elemennya** — LinkedIn yang tidak diisi tidak meninggalkan tombol mati |
| `data-cp-list="NAME"` | container dengan **satu** anak ber-`data-cp-template`; anak itu dikloning per item, aslinya dibuang. Ada batas per list, override `data-cp-list-max="N"` |
| `data-cp-section="NAME"` | wrapper yang disembunyikan total kalau `has.NAME` false (section dimatikan user, atau datanya kosong) |
| `data-cp-empty="NAME"` | hanya muncul kalau list itu kosong |
| `data-cp-fluff` | dibuang begitu ada data sungguhan — untuk blok placeholder di preview template |

Model yang menempelkan judul proyek sebagai teks literal menghasilkan halaman
yang diam-diam basi; model yang menulis marker menghasilkan halaman yang tidak
pernah basi. Itu satu-satunya alasan kontraknya dikembalikan **sebagai data**
di samping payload-nya, bukan ditulis di `description` — `description` dibatasi
1024 karakter, dan model cuma butuh kontrak ini di detik ia menulis HTML.

`MARKER_CONTRACT` (`tools/branding.ts`) mencerminkan
`frontend/slices/personal-branding/themes/templateHydrator.ts`. Marker baru di
sana wajib ditambahkan di sini juga — tidak ada test yang memaksakannya.

### Template bawaan

| Id | Ukuran | Catatan |
|---|---|---|
| `starter` | ~18 KB | Yang dimaksudkan untuk disalin: memakai **semua** marker yang didukung hydrator |
| `template-v1` | ~81 KB | Purple Glass. Tanpa section education |
| `template-v2` | ~81 KB | Editorial Cream — default |
| `template-v3` | ~67 KB | Premium Dark. Tanpa section about |

`branding_templates` tanpa argumen cuma melist; dengan `template_id` ia
mengambil HTML-nya lewat HTTP dari origin `APP_URL`, jadi v1/v2/v3 akan
memakan sebagian besar context model. Itu sebabnya deskripsi tool mengarahkan
ke `starter` kecuali user menyebut yang lain.

### Kenapa tidak disanitasi

`convex/profile/publicHtml.ts` cuma menormalkan dan membatasi ukuran — tidak
ada penyaring tag. Dokumennya dirender di `srcdoc` iframe **yang sama** dengan
template bawaan: `allow-scripts` **tanpa** `allow-same-origin`, jadi ia hidup
di opaque origin tanpa akses ke DOM aplikasi, cookie, atau sesi Convex.
Menyaring tag hanya akan merusak template (yang butuh script inline-nya
sendiri) tanpa membeli apa pun yang belum diberikan sandbox. Aturannya satu
file supaya jalur dashboard (`updateMyPublicProfile`) dan jalur MCP tidak bisa
menegakkan batas yang berbeda.

Payload-nya pun satu implementasi: `convex/profile/loadBranding.ts` melayani
`getBySlug` (halaman publik) **dan** `branding_data`. Kalau keduanya berbeda,
model akan menulis marker untuk data yang tidak pernah dipancarkan halaman
hidup, dan salahnya baru kelihatan sebagai section kosong di layar orang lain.

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
| `portfolio_attach_media` | **lampirkan gambar langsung** — tanpa langkah unggah |

**`storageId` tidak pernah muncul di payload mana pun.** Satu string itu cukup
untuk mengambil blob dari mana saja, selamanya, dan semua yang dikembalikan tool
tersalin ke transkrip pihak ketiga. Berkas dialamatkan lewat id barisnya, yang
tidak berguna tanpa pemeriksaan kepemilikan.

### `portfolio_attach_media` — jalur satu panggilan

Unggah dua langkah di bawah ini **tidak pernah bisa dipakai model**: langkah
tengahnya adalah HTTP `PUT` byte ke signed URL, dan LLM tidak bisa melakukan
itu. Jalur itu hanya pernah bisa ditempuh manusia dengan terminal.

`portfolio_attach_media` memakai kontrak file resmi OpenAI
(`_meta["openai/fileParams"]`): ChatGPT mengirim `download_url` sementara plus
`file_id`, server yang mengunduh. Satu panggilan, tanpa storage id, tanpa
koreografi.

Implementasinya tipis di sini — protokolnya milik paket bersama
`@rahmanef/mcp-files` (`connectors/packages/mcp-files`, di-vendor ke
`convex/mcp/_vendor/mcpFiles.ts` dengan header checksum). Paket itu memegang
skema file, unduhan ber-guard SSRF, cek ukuran dan isi. Repo ini hanya memegang
adapter: di mana byte disimpan, apa arti "attach", dan teks Indonesia.

**WebP saja.** Paket bersama mengizinkan lima format; `files/allowlist.ts`
mengizinkan `image/webp` saja — dan adapter MENURUNKAN policy-nya dari
allowlist itu, bukan menuliskannya ulang, supaya keduanya tidak bisa berbeda.

Bedanya dengan `portfolio_set_media`: yang ini **menambah** dan tidak pernah
menghapus, jadi `destructiveHint: false`. `portfolio_set_media` mengganti
seluruh daftar dan tetap `destructiveHint: true`. Keduanya dipertahankan.

## Scope — ditegakkan per panggilan

Sampai 2026-08-14 `mcp.read` / `mcp.write` diumumkan di dokumen discovery dan
disimpan di tiap baris token, lalu **tidak pernah dibaca**. Dispatcher hanya
memeriksa ada-tidaknya `userId`, jadi token yang hanya diberi `mcp.read` tetap
bisa memanggil `portfolio_delete`.

Sekarang setiap panggilan tool diperiksa. Scope-nya **diturunkan** dari
`annotations.readOnlyHint` di `tools/index.ts`, bukan ditulis per tool, supaya
tidak mungkin berbeda dari anotasi yang sudah menyatakan fakta yang sama.

Gagal scope menjawab **403** dengan tantangan RFC 6750, bukan 200 yang isinya
berkata "tidak boleh":

```
WWW-Authenticate: Bearer realm="careerpack", error="insufficient_scope",
  scope="mcp.write", resource_metadata="…/.well-known/oauth-protected-resource"
```

Batch tetap 200 — satu status tidak bisa mewakili array campuran; tiap entri
membawa error JSON-RPC `-32003` sendiri.

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
| `OPENAI_APPS_CHALLENGE` | token verifikasi domain OpenAI; rute 404 selagi kosong |

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

### ChatGPT — server siap, pendaftaran menunggu akun

Tidak ada paket kedua untuk dibangun. ChatGPT memakai server yang sama di URL
yang sama; yang berbeda cuma cara ia berkenalan. Tiga hal yang kurang sudah
ditutup 2026-08-14.

**Registrasi klien dinamis (RFC 7591).** Ini yang paling menentukan.
`POST /oauth/register` di origin site, diiklankan sebagai
`registration_endpoint` di metadata AS. Alasannya satu asimetri: Claude Code,
Cursor, dan `mcp-remote` mengizinkan pengguna menempel header atau client id
apa pun ke file config. Form ChatGPT dan claude.ai **tidak punya kolom itu** —
dokumentasi OpenAI menyatakan ChatGPT "cannot present custom API keys". Klien
yang tidak bisa mendaftarkan dirinya sendiri tidak bisa terhubung sama sekali.

Endpoint-nya tanpa autentikasi, sesuai RFC 7591 §1.2. Yang membatasinya:

| Batas | Kenapa |
|---|---|
| Setiap `redirect_uri` lewat allowlist host yang sama dengan consent | Pendaftaran tidak boleh menciptakan tujuan baru |
| 20 pendaftaran per IP per jam, tabel bucket terpisah | Endpoint ini menulis baris; spam registrasi tidak boleh mengunci login |
| Tidak pernah menerbitkan client secret | Public client, PKCE yang membuktikan pertukaran — tidak ada kredensial di sini untuk bocor |
| Klien terdaftar dikunci ke daftar redirect-nya sendiri | Kalau tidak, mendaftar tidak membeli apa-apa dibanding tidak mendaftar |

Mendaftar tidak memberi akses apa pun. Klien terdaftar tetap harus mengirim
manusia ke halaman consent, dan tetap mendapat token milik satu orang itu saja.

**`securitySchemes` per tool.** `tools/list` kini menyertakan
`[{ "type": "oauth2", "scopes": ["mcp.read" | "mcp.write"] }]`, diturunkan dari
scope yang sudah diresolusi — jadi tidak bisa berbeda dari gerbang yang
dispatcher jalankan. ChatGPT membekukan array ini saat *Scan Tools* dan
memakainya untuk memutuskan kapan menawarkan UI penautan OAuth.

**Tantangan verifikasi domain.** `GET /.well-known/openai-apps-challenge`
menyajikan **hanya** nilai `OPENAI_APPS_CHALLENGE` — bukan JSON, bukan daftar,
tanpa newline. 404 selama env belum diset, bukan string kosong, karena string
kosong terbaca sebagai "terverifikasi tapi salah". Harus di host MCP atau
induknya; induk `*.convex.site` milik Convex, jadi satu-satunya tempat yang sah
adalah router ini.

Halaman consent ikut berubah: nama aplikasi diambil dari pendaftaran (client id
`cp_…` tidak terbaca manusia) dan **dilabeli sebagai laporan sendiri**, karena
tidak ada yang memverifikasinya. Baris izin sekarang mengikuti scope yang
diminta — klien yang minta `mcp.read` saja tidak lagi dijanjikan hak tulis.

Terverifikasi di deployment dev: `registration_endpoint` terbit di metadata,
callback `chatgpt.com` dapat `201` beserta `cp_…`, host di luar allowlist dapat
`400 invalid_redirect_uri`, dan tantangan domain `404` selagi env kosong.

**Yang tersisa bukan kode.** Developer mode ada di **Settings → Security and
login** (atau sisi admin: Workspace Settings → Permissions & Roles → Connected
Data), lalu `chatgpt.com/plugins` → tombol plus → tempel
`https://proficient-dove-151.convex.site/mcp` (path `/mcp` wajib) → Scan Tools.
Web saja, tidak ada di mobile.

Dan satu kenyataan tentang paket akun yang menentukan apakah ini berguna:

| Yang dipakai | Paket yang dibutuhkan |
|---|---|
| Tool baca/fetch | Pro ke atas (Plus disebut OpenAI tapi tidak di help centre — ambil bacaan yang lebih ketat) |
| Tool tulis — "full MCP" | **Business, Enterprise, Edu saja**, masih beta |

CareerPack mayoritas tool tulis. Di akun Plus/Pro, sebagian besar permukaan ini
tidak akan bisa dipanggil dari ChatGPT sama sekali. Itu batas OpenAI, bukan
sesuatu yang bisa diperbaiki di sini.

**Submission direktori** menambah gerbang yang tidak bisa dilewati kode:
identitas terverifikasi di Platform, `Apps Management = Write`, tepat lima test
case positif dan tiga negatif, kredensial demo yang jalan **tanpa** MFA/SMS,
rekaman demo, serta URL kebijakan privasi dan ketentuan layanan. Origin server
terkunci selamanya setelah publish — path boleh berubah, `scheme`/`host`/`port`
tidak pernah.

### Form setup — belum

Satu tab per host, endpoint dan token di balik tombol salin. Spesifikasinya di
`shared/setup-form.md`. Tanpa ini, menghubungkan server masih perlu dituntun
manual.
