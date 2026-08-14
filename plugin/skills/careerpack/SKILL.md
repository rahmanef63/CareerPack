---
name: careerpack
description: Cara memakai tool CareerPack dengan benar — terutama alur unggah gambar dua langkah, batas format WebP, dan tautan baca yang kedaluwarsa. Baca ini sebelum memanggil tool `files_*` atau `portfolio_*` pertama kali.
---

# CareerPack

Tool ini menulis ke data karier seseorang yang sungguhan: CV yang mereka kirim
ke pemberi kerja, lamaran yang sedang berjalan, ceklis dokumen imigrasi. Tulis
seperti orangnya sedang melihat — karena memang begitu, di web app, secara
realtime.

Seluruh instruksi ini ada di sini dan bukan di `CLAUDE.md`: file itu tidak
dimuat sebagai konteks untuk plugin.

## Unggah gambar itu dua langkah, lalu satu lagi untuk memasangnya

Panggilan JSON-RPC tidak bisa membawa byte, jadi tidak ada tool "unggah gambar".
Rantainya:

```
files_upload_url   -> dapat target PUT sekali pakai
   PUT byte ke situ  (Content-Type sesuai berkasnya)
files_register     -> catat storage_id dari respons PUT jadi entri library
portfolio_set_media -> pasang ke portfolio item + jadikan thumbnail
```

Berhenti di langkah 2 berarti gambar duduk di Pustaka Konten tanpa ada yang
menunjuknya. Kalau maksud pengguna "pasang thumbnail di proyek X", langkah 3
wajib.

## Gambar harus WebP

`files_register` menolak PNG, JPEG, GIF, dan AVIF. Aplikasi ini mengonversi
setiap gambar ke WebP sebelum unggah, jadi pustakanya WebP-saja by design —
bukan kelalaian yang bisa ditawar. Dokumen harus `application/pdf`.

Konversi dulu sebelum PUT. Kalau tidak bisa, katakan terus terang ke pengguna
alih-alih mencoba dan melaporkan error mentah.

Batas: gambar 10 MB, dokumen 50 MB.

## Tautan baca kedaluwarsa satu jam

`files_read_url` mengembalikan tautan sementara supaya kamu bisa **melihat**
gambar. Tautan itu mati setelah satu jam.

Jangan simpan. Jangan tempel ke ringkasan yang akan dibaca lagi besok. Kalau
butuh lagi, minta yang baru. Dan mintalah hanya kalau memang perlu melihat
isinya — nama, tipe, dan catatan dari `files_list` sudah menjawab sebagian besar
pertanyaan.

## `portfolio_set_media` mengganti, bukan menambah

Daftar yang kamu kirim **menjadi** galeri item itu. Untuk menambah satu gambar
ke item yang sudah punya dua, kirim ketiga `file_id`-nya — ambil yang lama dari
`files_list` dulu. Kirim daftar kosong dan media beserta thumbnail-nya lepas.

Gambar pertama di daftar menjadi thumbnail kartu dan halaman publik.

## Yang tidak akan pernah kamu lihat

`storageId` tidak muncul di payload tool mana pun, dan itu disengaja: satu
string itu cukup untuk mengambil berkasnya dari mana saja, selamanya, dan semua
yang tool kembalikan tersalin ke transkrip ini. Alamati berkas lewat `file_id`
dari `files_list`.

## Bahasa

Antarmuka CareerPack berbahasa Indonesia dan pesan errornya juga. Kalau kamu
meneruskan error ke pengguna, terjemahkan maksudnya — jangan tempel mentah-mentah.

## Batas tulis

25 tulisan per menit, 400 per hari. Batasnya ada karena token ini hidup setahun
di infrastruktur pihak ketiga tanpa ada yang mengawasi. Kalau kena, berhenti dan
beri tahu pengguna — jangan coba lagi dalam loop.
