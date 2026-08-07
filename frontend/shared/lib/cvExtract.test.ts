import { describe, it, expect } from "vitest";
import { assessExtraction, normalizeExtractedText } from "./cvExtract";

/** ~2500 chars of a real-shaped Indonesian resume, with an email and years. */
const REAL_RESUME = `
Budi Santoso
Backend Engineer — Jakarta, Indonesia
budi.santoso@example.com | +62 812 3456 7890 | linkedin.com/in/budisantoso

RINGKASAN
Backend engineer dengan 6 tahun pengalaman membangun layanan pembayaran dan
integrasi perbankan berskala nasional. Terbiasa memimpin tim kecil, menjaga
uptime di atas 99.9%, dan menurunkan biaya infrastruktur lewat konsolidasi
layanan. Fokus pada Go, Node.js, PostgreSQL, dan arsitektur event-driven.

PENGALAMAN KERJA
PT Tokopedia — Senior Backend Engineer
Maret 2020 - sekarang, Jakarta
- Memimpin migrasi layanan pembayaran dari monolit ke tujuh layanan terpisah,
  menurunkan waktu rilis dari dua minggu menjadi satu hari.
- Merancang sistem rekonsiliasi harian yang memproses 12 juta transaksi.
- Membimbing empat engineer junior lewat sesi review mingguan.

PT Gojek — Backend Engineer
Januari 2018 - Februari 2020, Jakarta
- Membangun layanan notifikasi yang melayani 40 juta pengguna aktif bulanan.
- Menurunkan latensi p99 endpoint pemesanan dari 800ms menjadi 210ms.
- Menulis ulang lapisan cache dan memangkas biaya Redis sebesar 35 persen.

PT Bukalapak — Junior Backend Engineer
Agustus 2016 - Desember 2017, Bandung
- Mengelola integrasi dengan enam bank untuk fitur transfer instan.
- Menambahkan pengujian otomatis hingga cakupan mencapai 70 persen.

PENDIDIKAN
Institut Teknologi Bandung — Sarjana Teknik Informatika, 2012 - 2016
IPK 3.62. Skripsi tentang penjadwalan tugas terdistribusi.

SERTIFIKASI
AWS Certified Solutions Architect - Associate, Amazon Web Services, 2021
Certified Kubernetes Administrator, CNCF, 2022

KEAHLIAN
Go, Node.js, TypeScript, PostgreSQL, Redis, Kafka, Docker, Kubernetes,
Terraform, gRPC, GitHub Actions, Grafana, Prometheus, OpenTelemetry

BAHASA
Indonesia (native), Inggris (profesional)
`.trim();

describe("assessExtraction", () => {
  it("calls a page of ligature residue garbage", () => {
    // What a scanned PDF with a broken embedded font actually yields: glyphs
    // that are not letters. Routing this to the parser burns quota for {}.
    expect(assessExtraction("▯▯ ▯ ●● 1 2 3").verdict).toBe("garbage");
  });

  it("passes a real resume excerpt", () => {
    const result = assessExtraction(REAL_RESUME);
    expect(result.verdict).toBe("good");
    expect(result.chars).toBeGreaterThan(1500);
    expect(result.alphaRatio).toBeGreaterThan(0.55);
  });

  it("calls long prose with no year and no email thin", () => {
    // Length alone must not pass: a scan's OCR-less text layer is sometimes
    // just the header/footer boilerplate repeated across pages.
    const lorem = "lorem ipsum dolor sit amet consectetur adipiscing elit ".repeat(90);
    expect(lorem.length).toBeGreaterThan(4500);
    expect(assessExtraction(lorem).verdict).toBe("thin");
  });

  it("calls an empty extraction thin, not garbage", () => {
    // A PDF with no text layer at all extracts to "". alphaRatio is 0, but
    // there is nothing to call junk — the caller offers OCR either way.
    expect(assessExtraction("").verdict).toBe("thin");
  });
});

describe("normalizeExtractedText", () => {
  it("keeps line structure while collapsing the glyph-run spaces", () => {
    const raw = "Senior   Backend  Engineer \n\n\n\n PT   Tokopedia \r\n Jakarta";
    expect(normalizeExtractedText(raw)).toBe(
      "Senior Backend Engineer\n\nPT Tokopedia\nJakarta",
    );
  });
});
