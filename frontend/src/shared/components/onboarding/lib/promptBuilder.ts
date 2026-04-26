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
  return `Anda asisten yang membantu user mengisi akun CareerPack (platform pencari kerja Indonesia).

${spec.intro}

ATURAN OUTPUT — patuhi keras:
1. Output HANYA JSON valid. Jangan ada markdown code-fence, jangan ada teks penjelasan.
2. Format tanggal: YYYY-MM-DD (atau YYYY-MM untuk pengalaman / pendidikan startDate / endDate).
3. Bahasa Indonesia untuk konten user-facing (summary, description, bio, achievements).
4. Skip section yang user tidak sebut — jangan bikin objek kosong, jangan placeholder palsu.
5. Untuk array yang dimasukkan: minimum 1 item dengan data nyata, JANGAN copy-paste contoh ini.
6. Kunci JSON harus persis sama dengan schema di bawah.

SCHEMA (JSON tanpa contoh):
${schema}

INFO USER (ganti baris di bawah ini dengan info CV / LinkedIn / portfolio / Anda sendiri):
---
[Tempelkan info Anda di sini — bisa CV text, LinkedIn export, atau cerita bebas dalam bahasa Indonesia / English. AI akan ekstrak ke JSON sesuai schema.]
---

Setelah itu, return JSON sesuai aturan di atas.`;
}
