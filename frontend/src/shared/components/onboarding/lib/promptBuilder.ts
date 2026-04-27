/**
 * Prompt template generator for the Quick Fill flow.
 *
 * Each scope produces a prompt with the JSON schema embedded inline,
 * strict rules about output format, and a placeholder where the user
 * pastes their own info before sending to the AI. The AI's reply is
 * pasted back into the second step of the wizard.
 */

import type { QuickFillScope } from "../../../../../../convex/onboarding/types";

const SCHEMA_PROFILE = `"profile": {
    "fullName": "string (nama lengkap)",
    "phone": "string opsional, contoh +62812...",
    "location": "string, contoh 'Jakarta, Indonesia'",
    "targetRole": "string, contoh 'Frontend Engineer'",
    "experienceLevel": "salah satu dari: 'entry-level' | 'junior' | 'mid-level' | 'senior' | 'lead'",
    "bio": "string opsional, 1-3 kalimat",
    "skills": ["array string"],
    "interests": ["array string opsional"]
  }`;

const SCHEMA_CV = `"cv": {
    "title": "string opsional",
    "template": "string opsional: 'modern' | 'classic' | 'minimal'",
    "personalInfo": {
      "fullName": "string",
      "email": "string",
      "phone": "string",
      "location": "string",
      "summary": "string, 2-4 kalimat ringkasan profesional",
      "linkedin": "string URL opsional, https://...",
      "portfolio": "string URL opsional",
      "dateOfBirth": "string YYYY-MM-DD opsional"
    },
    "experience": [
      {
        "company": "string",
        "position": "string",
        "startDate": "YYYY-MM",
        "endDate": "YYYY-MM (kosongkan jika current=true)",
        "current": "boolean",
        "description": "string, deskripsi singkat",
        "achievements": ["array string, gunakan angka kuantitatif jika ada"]
      }
    ],
    "education": [
      { "institution": "string", "degree": "string", "field": "string", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "gpa": "string opsional" }
    ],
    "skills": [
      { "name": "string", "category": "string opsional", "proficiency": "number 0-100 opsional" }
    ],
    "certifications": [
      { "name": "string", "issuer": "string", "date": "YYYY-MM-DD", "expiryDate": "YYYY-MM-DD opsional" }
    ],
    "languages": [
      { "language": "string", "proficiency": "string, contoh 'Native' | 'Professional' | 'Intermediate'" }
    ],
    "projects": [
      { "name": "string", "description": "string", "technologies": ["array string"], "link": "string URL opsional" }
    ]
  }`;

const SCHEMA_PORTFOLIO = `"portfolio": [
    {
      "title": "string",
      "description": "string",
      "category": "salah satu: 'project' | 'certification' | 'publication'",
      "link": "string URL opsional",
      "techStack": ["array string opsional"],
      "date": "YYYY-MM-DD",
      "featured": "boolean opsional",
      "coverEmoji": "1 emoji opsional, contoh '🚀'"
    }
  ]`;

const SCHEMA_GOALS = `"goals": [
    {
      "title": "string",
      "description": "string",
      "category": "string, contoh 'career' | 'skill' | 'finansial'",
      "targetDate": "YYYY-MM-DD ATAU integer = jumlah hari dari sekarang",
      "milestones": [{ "title": "string", "completed": "boolean opsional" }]
    }
  ]`;

const SCHEMA_APPLICATIONS = `"applications": [
    {
      "company": "string",
      "position": "string",
      "location": "string",
      "status": "salah satu: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected'",
      "appliedDate": "YYYY-MM-DD ATAU integer = jumlah hari yang lalu",
      "source": "string, contoh 'LinkedIn'",
      "salary": "string opsional",
      "notes": "string opsional"
    }
  ]`;

const SCHEMA_CONTACTS = `"contacts": [
    {
      "name": "string",
      "role": "salah satu: 'recruiter' | 'mentor' | 'peer' | 'other'",
      "company": "string opsional",
      "position": "string opsional",
      "email": "string opsional",
      "phone": "string opsional",
      "linkedinUrl": "string URL opsional",
      "notes": "string opsional"
    }
  ]`;

interface ScopeSpec {
  intro: string;
  sections: string[];
}

const SCOPE_SPECS: Record<QuickFillScope, ScopeSpec> = {
  all: {
    intro:
      "Anda akan mengisi seluruh akun CareerPack — profil, CV, portofolio, goals, lamaran, dan kontak.",
    sections: [
      SCHEMA_PROFILE,
      SCHEMA_CV,
      SCHEMA_PORTFOLIO,
      SCHEMA_GOALS,
      SCHEMA_APPLICATIONS,
      SCHEMA_CONTACTS,
    ],
  },
  "profile-cv": {
    intro: "Anda akan mengisi profil + CV — esensial untuk akun baru.",
    sections: [SCHEMA_PROFILE, SCHEMA_CV],
  },
  profile: {
    intro: "Anda akan mengisi profil saja (info pribadi, target role, skills, bio).",
    sections: [SCHEMA_PROFILE],
  },
  cv: {
    intro: "Anda akan mengisi CV lengkap saja.",
    sections: [SCHEMA_CV],
  },
  portfolio: {
    intro: "Anda akan menambah daftar portofolio (project, sertifikasi, publikasi).",
    sections: [SCHEMA_PORTFOLIO],
  },
  goals: {
    intro: "Anda akan menambah goals karir dengan milestones.",
    sections: [SCHEMA_GOALS],
  },
  applications: {
    intro: "Anda akan mengimpor riwayat lamaran kerja.",
    sections: [SCHEMA_APPLICATIONS],
  },
  contacts: {
    intro: "Anda akan mengimpor daftar kontak networking.",
    sections: [SCHEMA_CONTACTS],
  },
};

/**
 * Build the full prompt for a given scope. The user copies this into
 * ChatGPT / Claude / Gemini, replaces the placeholder block with
 * their own info, and pastes the AI's JSON reply into Step 2.
 */
export function buildPrompt(scope: QuickFillScope): string {
  const spec = SCOPE_SPECS[scope];
  const schema = `{\n  ${spec.sections.join(",\n  ")}\n}`;
  const example = exampleForScope(scope);
  return `Anda asisten ekstraksi data terstruktur. Tugas: ubah info user di bawah jadi JSON yang dimakan oleh CareerPack (platform pencari kerja Indonesia).

${spec.intro}

ATURAN OUTPUT — WAJIB diikuti, kalau melanggar import GAGAL:

1. Output HANYA satu blok JSON valid. Tidak ada teks pembuka, tidak ada penutup, TIDAK ADA \`\`\`json fence.
2. Root JSON langsung mulai dengan { dan key section ('profile' / 'cv' / dst). JANGAN bungkus dalam 'data', 'response', 'result', 'output', atau key apapun lainnya.
3. Untuk CV: field 'fullName' dan 'email' WAJIB ada di dalam 'personalInfo' (nested object). Tidak boleh di root level cv. Jika info email user tidak ada, INFER alamat email yang masuk akal dari nama (contoh: "Budi Santoso" → "budi.santoso@email.com") — JANGAN biarkan kosong dan JANGAN skip section cv.
4. Untuk profile: 'fullName', 'location', 'targetRole' WAJIB string non-kosong. Jika info kurang, infer dari konteks user.
5. Field wajib per section (kalau salah, section dilewati DIAM-DIAM dan user tidak sadar):
   - profile: fullName + location + targetRole
   - cv: personalInfo.fullName + personalInfo.email (di dalam personalInfo, BUKAN di root cv)
   - cv.experience[*]: company + position + startDate (format YYYY-MM)
   - cv.education[*]: institution
   - cv.skills[*]: { name: "..." } — BUKAN string biasa, harus objek dengan field 'name'
   - portfolio[*]: title + description + date (YYYY-MM-DD)
   - goals[*]: title + description
   - applications[*]: company + position
   - contacts[*]: name
6. Format tanggal STRICT:
   - YYYY-MM-DD untuk: portfolio.date, applications.appliedDate, certifications.date
   - YYYY-MM untuk: experience.startDate, experience.endDate, education.startDate, education.endDate
   - String "Maret 2024" / "Mar 2024" / "03/2024" SEMUA tidak diterima — convert ke YYYY-MM dulu sebelum output.
7. Bahasa Indonesia untuk konten user-facing (summary, description, bio, achievements). Hanya nama / istilah teknis yang boleh tetap English.
8. Skip section yang user tidak sebut — jangan bikin objek kosong, jangan placeholder palsu seperti "Lorem ipsum".
9. Untuk array: minimum 1 item dengan data nyata user (BUKAN contoh dari prompt ini). Maksimal 30 item per array.
10. Kunci JSON case-sensitive — tulis persis seperti schema. "FullName" ≠ "fullName".

SCHEMA (kunci wajib persis seperti ini):
${schema}

CONTOH OUTPUT YANG BENAR untuk user fiktif "Budi Santoso, Frontend Engineer di Jakarta":
${example}

INFO USER (ganti baris di bawah ini dengan info CV / LinkedIn / portfolio / Anda sendiri):
---
[Tempelkan info Anda di sini — bisa CV text, LinkedIn export, atau cerita bebas dalam bahasa Indonesia / English. AI akan ekstrak ke JSON sesuai schema.]
---

Output sekarang JSON saja, mulai dengan { langsung tanpa preamble apapun.`;
}

/**
 * Concrete example per scope so the AI gets a copy-able template.
 * Schema text alone often confuses smaller models — they fill in
 * the SCHEMA strings ("string opsional, contoh ...") as actual values.
 * Showing a working example anchors the structure.
 */
function exampleForScope(scope: QuickFillScope): string {
  const profile = `  "profile": {
    "fullName": "Budi Santoso",
    "phone": "+62 812 3456 7890",
    "location": "Jakarta, Indonesia",
    "targetRole": "Frontend Engineer",
    "experienceLevel": "mid-level",
    "bio": "Frontend engineer fokus React + TypeScript dengan 4 tahun pengalaman membangun product-grade web app.",
    "skills": ["React", "TypeScript", "Next.js", "TailwindCSS"],
    "interests": ["Open source", "UI engineering"]
  }`;
  const cv = `  "cv": {
    "title": "CV Budi Santoso",
    "template": "modern",
    "personalInfo": {
      "fullName": "Budi Santoso",
      "email": "budi.santoso@email.com",
      "phone": "+62 812 3456 7890",
      "location": "Jakarta, Indonesia",
      "summary": "Frontend engineer 4 tahun, ekspert React + TypeScript. Pernah lead migrasi monorepo Next.js 12 ke 14 dan optimasi LCP <2s.",
      "linkedin": "https://linkedin.com/in/budisantoso",
      "portfolio": "https://budisantoso.dev"
    },
    "experience": [
      {
        "company": "PT Tokopedia",
        "position": "Senior Frontend Engineer",
        "startDate": "2022-08",
        "current": true,
        "description": "Memimpin tim 4 orang di Squad Checkout.",
        "achievements": [
          "Optimasi bundle size dari 480KB ke 220KB (54% reduction).",
          "Migrasi 12 modul Redux ke Zustand, menurunkan rerender 30%."
        ]
      },
      {
        "company": "PT Bukalapak",
        "position": "Frontend Engineer",
        "startDate": "2020-03",
        "endDate": "2022-07",
        "current": false,
        "description": "Membangun fitur seller dashboard.",
        "achievements": ["Mengirim 18 fitur baru dalam 2 tahun."]
      }
    ],
    "education": [
      { "institution": "Universitas Indonesia", "degree": "S1", "field": "Teknik Informatika", "startDate": "2016-08", "endDate": "2020-07", "gpa": "3.65" }
    ],
    "skills": [
      { "name": "React", "category": "technical", "proficiency": 90 },
      { "name": "TypeScript", "category": "technical", "proficiency": 85 },
      { "name": "Komunikasi", "category": "soft", "proficiency": 80 }
    ],
    "certifications": [
      { "name": "AWS Certified Cloud Practitioner", "issuer": "Amazon Web Services", "date": "2023-06-15" }
    ],
    "languages": [
      { "language": "Indonesia", "proficiency": "Native" },
      { "language": "English", "proficiency": "Professional" }
    ],
    "projects": [
      { "name": "Dashboard Analitik UMKM", "description": "Dashboard React + D3 untuk visualisasi data penjualan UMKM mitra.", "technologies": ["React", "D3", "Node.js"], "link": "https://github.com/budis/dashboard" }
    ]
  }`;
  const portfolio = `  "portfolio": [
    { "title": "Dashboard Analitik UMKM", "description": "Tools internal untuk visualisasi data penjualan UMKM.", "category": "project", "link": "https://github.com/budis/dashboard", "techStack": ["React","D3"], "date": "2023-11-20", "featured": true, "coverEmoji": "📊" },
    { "title": "AWS Cloud Practitioner", "description": "Sertifikasi AWS dasar.", "category": "certification", "date": "2023-06-15" }
  ]`;
  const goals = `  "goals": [
    { "title": "Lulus interview Senior FE", "description": "Lolos interview senior frontend di company top tier dalam 6 bulan.", "category": "career", "targetDate": 180, "milestones": [{ "title": "Selesai 50 problem leetcode" }, { "title": "Selesai 3 system design mock interview" }] }
  ]`;
  const applications = `  "applications": [
    { "company": "GoTo", "position": "Senior Frontend", "location": "Jakarta", "status": "interview", "appliedDate": 14, "source": "LinkedIn" },
    { "company": "Traveloka", "position": "Frontend Engineer", "location": "Jakarta", "status": "applied", "appliedDate": 7, "source": "JobStreet" }
  ]`;
  const contacts = `  "contacts": [
    { "name": "Andi Wijaya", "role": "recruiter", "company": "GoTo", "email": "andi@goto.com", "linkedinUrl": "https://linkedin.com/in/andiwijaya" }
  ]`;

  const map: Record<QuickFillScope, string[]> = {
    all: [profile, cv, portfolio, goals, applications, contacts],
    "profile-cv": [profile, cv],
    profile: [profile],
    cv: [cv],
    portfolio: [portfolio],
    goals: [goals],
    applications: [applications],
    contacts: [contacts],
  };
  return `{\n${map[scope].join(",\n")}\n}`;
}
