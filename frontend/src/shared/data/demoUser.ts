/**
 * Demo (Tamu) persona data — replaces the deleted convex/_seeds/demoData.ts
 * fixtures. Stored as PURE constants so it lives in the bundle, not in
 * the Convex DB (no more anonymous-user duplicates polluting the admin
 * Pengguna table).
 *
 * On first open of the demo, hooks hydrate localStorage from these
 * constants. Subsequent edits are persisted to localStorage so the
 * visitor can play with the app — Convex sees nothing.
 *
 * Dates use relative offsets (`daysAgo`, `dateOffsetDays`) so the
 * persona stays "fresh" across days. Hooks resolve them to absolute
 * timestamps at render time.
 */

import type { Application } from "../types";

export const DEMO_PROFILE = {
  fullName: "Rizky Ahmad Wijaya",
  phone: "+6281234567890",
  location: "Jakarta, Indonesia",
  targetRole: "Frontend Engineer",
  experienceLevel: "junior" as const,
  bio: "Frontend engineer 1+ tahun pengalaman magang di Tokopedia. Fokus React + TypeScript, suka building component library + a11y. Mencari role full-time di startup berdampak.",
  skills: [
    "React",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "Jest + RTL",
    "Figma",
    "Git / GitHub",
    "Bahasa Inggris (IELTS 7.0)",
    "Komunikasi tim",
    "Kolaborasi lintas fungsi",
  ],
  interests: ["Web Development", "Product Design", "Open Source"],
};

// ---------------------------------------------------------------------
// CV
// ---------------------------------------------------------------------

export const DEMO_CV = {
  title: "CV - Frontend Developer",
  template: "modern",
  isDefault: true,
  personalInfo: {
    fullName: "Rizky Ahmad Wijaya",
    email: "rizky.demo@careerpack.id",
    phone: "081234567890",
    location: "Jakarta, Indonesia",
    summary:
      "Frontend engineer dengan 1+ tahun pengalaman internship di Tokopedia. Meluncurkan pustaka komponen bersama yang dipakai 4 tim internal dan menurunkan TTI dashboard 30%. Fokus pada accessibility (WCAG AA) dan developer experience.",
    linkedin: "https://linkedin.com/in/rizky-demo",
    portfolio: "https://rizky-demo.vercel.app",
    dateOfBirth: "2000-08-14",
  },
  experience: [
    {
      id: "exp-1",
      company: "Tokopedia",
      position: "Frontend Engineering Intern",
      startDate: "2024-01",
      endDate: "2024-06",
      current: false,
      description:
        "Bergabung dengan tim Seller Dashboard. Implementasi fitur, optimasi performa, dan review pull request rekan.",
      achievements: [
        "Menurunkan Time-to-Interactive dashboard penjual 30% via code-splitting + lazy loading",
        "Membangun component library bersama (12 komponen) dipakai 4 tim internal",
        "Mengintegrasikan a11y testing ke CI — menemukan + fix 23 issue WCAG sebelum production",
      ],
    },
    {
      id: "exp-2",
      company: "Gojek (Internal Hackathon)",
      position: "Frontend — Juara 2 kategori Inklusi Digital",
      startDate: "2023-08",
      endDate: "2023-08",
      current: false,
      description:
        "Hackathon 48 jam. Memimpin 3 orang frontend untuk build MVP aplikasi pengingat jadwal minum obat untuk lansia.",
      achievements: [
        "Juara 2 dari 28 tim",
        "MVP dipakai 12 lansia di pilot post-hackathon",
      ],
    },
    {
      id: "exp-3",
      company: "Freelance",
      position: "Web Developer",
      startDate: "2022-06",
      endDate: "2023-12",
      current: false,
      description:
        "Membangun 6 situs UMKM di Jakarta + Bandung. Full-stack Next.js 15 + Convex.",
      achievements: [
        "6 situs production-grade dengan Lighthouse > 95",
        "Mendampingi onboarding 6 owner UMKM ke admin panel sederhana",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "Universitas Indonesia",
      degree: "S1",
      field: "Ilmu Komputer",
      startDate: "2020-08",
      endDate: "2024-07",
      gpa: "3.78",
    },
    {
      id: "edu-2",
      institution: "Dicoding Academy",
      degree: "Bootcamp",
      field: "Frontend Web Developer Expert",
      startDate: "2023-02",
      endDate: "2023-08",
    },
  ],
  skills: [
    { id: "s-1", name: "React", category: "Frontend", proficiency: 90 },
    { id: "s-2", name: "TypeScript", category: "Frontend", proficiency: 85 },
    { id: "s-3", name: "Next.js", category: "Frontend", proficiency: 80 },
    { id: "s-4", name: "Tailwind CSS", category: "UI", proficiency: 85 },
    { id: "s-5", name: "Jest + RTL", category: "Testing", proficiency: 70 },
    { id: "s-6", name: "Figma", category: "Design", proficiency: 65 },
    { id: "s-7", name: "Git / GitHub", category: "Tools", proficiency: 85 },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Frontend Web Developer Expert",
      issuer: "Dicoding Academy",
      date: "2023-07",
    },
    {
      id: "cert-2",
      name: "Introduction to Web Accessibility",
      issuer: "W3C / edX",
      date: "2024-02",
    },
    {
      id: "cert-3",
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "2024-04",
    },
  ],
  languages: [
    { language: "Indonesia", proficiency: "Native" },
    { language: "English", proficiency: "Professional (IELTS 7.0)" },
  ],
  projects: [
    {
      id: "p-1",
      name: "CareerPack Clone",
      description:
        "Replika fitur pencari kerja — CV builder + roadmap + document checklist. Untuk belajar Next.js 15 + Convex.",
      technologies: ["Next.js", "Convex", "TypeScript", "Tailwind"],
      link: "https://github.com/rizky-demo/careerpack-clone",
    },
    {
      id: "p-2",
      name: "Kalender Minum Obat (PWA)",
      description:
        "Progressive Web App pengingat jadwal minum obat untuk lansia. Juara 2 Hackathon Gojek 2023.",
      technologies: ["React", "PWA", "IndexedDB"],
      link: "https://github.com/rizky-demo/med-reminder",
    },
    {
      id: "p-3",
      name: "UMKM Landing Page Starter",
      description:
        "Template landing page Next.js open-source untuk UMKM. 200+ stars di GitHub.",
      technologies: ["Next.js", "Tailwind"],
      link: "https://github.com/rizky-demo/umkm-starter",
    },
  ],
};

// ---------------------------------------------------------------------
// Applications (job tracker)
// ---------------------------------------------------------------------

export interface DemoApplicationSeed {
  id: string;
  company: string;
  position: string;
  status: Application["status"];
  daysAgo: number;
  notes?: string;
  salary?: string;
}

export const DEMO_APPLICATIONS: ReadonlyArray<DemoApplicationSeed> = [
  {
    id: "app-1",
    company: "Tokopedia",
    position: "Frontend Engineer",
    status: "interview",
    daysAgo: 7,
    salary: "12.000.000 - 16.000.000",
    notes: "Lolos screening + technical interview. Final round minggu depan.",
  },
  {
    id: "app-2",
    company: "Gojek",
    position: "Junior Software Engineer",
    status: "screening",
    daysAgo: 4,
    salary: "13.000.000 - 18.000.000",
    notes: "HR call dijadwalkan Selasa.",
  },
  {
    id: "app-3",
    company: "Shopee",
    position: "Frontend Developer",
    status: "applied",
    daysAgo: 2,
  },
  {
    id: "app-4",
    company: "Traveloka",
    position: "Frontend Engineer (Junior)",
    status: "applied",
    daysAgo: 1,
  },
  {
    id: "app-5",
    company: "DANA",
    position: "Web Engineer",
    status: "rejected",
    daysAgo: 21,
    notes: "Rejected post-coding test — lemah di algoritma graf. Plan: latihan LeetCode 30 hari.",
  },
  {
    id: "app-6",
    company: "Blibli",
    position: "Frontend Developer (Internship)",
    status: "offer",
    daysAgo: 14,
    salary: "8.000.000",
    notes: "Offer letter diterima. Pertimbangkan vs role lain.",
  },
  {
    id: "app-7",
    company: "Kitabisa",
    position: "Frontend Engineer",
    status: "screening",
    daysAgo: 5,
  },
  {
    id: "app-8",
    company: "Ruangguru",
    position: "Junior Frontend",
    status: "applied",
    daysAgo: 3,
  },
];

// ---------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------

export interface DemoPortfolioSeed {
  id: string;
  title: string;
  description: string;
  category: "project" | "certification" | "publication";
  link?: string;
  techStack: string[];
  /** Days from "now" — usually negative (in the past). */
  dateOffsetDays: number;
  featured: boolean;
  coverEmoji: string;
  coverGradient: string;
}

export const DEMO_PORTFOLIO: ReadonlyArray<DemoPortfolioSeed> = [
  {
    id: "pf-1",
    title: "CareerPack Clone",
    description:
      "Replika fitur pencari kerja — CV builder + roadmap + document checklist. 200+ commits, Lighthouse 95+.",
    category: "project",
    link: "https://github.com/rizky-demo/careerpack-clone",
    techStack: ["Next.js", "Convex", "TypeScript", "Tailwind"],
    dateOffsetDays: -45,
    featured: true,
    coverEmoji: "💼",
    coverGradient: "from-cyan-400 to-cyan-600",
  },
  {
    id: "pf-2",
    title: "Kalender Minum Obat",
    description:
      "Progressive Web App pengingat jadwal minum obat untuk lansia. Juara 2 Hackathon Gojek.",
    category: "project",
    link: "https://github.com/rizky-demo/med-reminder",
    techStack: ["React", "PWA", "IndexedDB"],
    dateOffsetDays: -180,
    featured: true,
    coverEmoji: "💊",
    coverGradient: "from-rose-400 to-pink-600",
  },
  {
    id: "pf-3",
    title: "UMKM Landing Page Starter",
    description:
      "Template Next.js open-source untuk UMKM. 200+ stars di GitHub.",
    category: "project",
    link: "https://github.com/rizky-demo/umkm-starter",
    techStack: ["Next.js", "Tailwind"],
    dateOffsetDays: -90,
    featured: false,
    coverEmoji: "🚀",
    coverGradient: "from-amber-400 to-orange-600",
  },
  {
    id: "pf-4",
    title: "Frontend Web Developer Expert",
    description: "Sertifikasi penguasaan React + state management + testing.",
    category: "certification",
    link: "https://www.dicoding.com/certificates/rizky-demo",
    techStack: [],
    dateOffsetDays: -290,
    featured: false,
    coverEmoji: "🏅",
    coverGradient: "from-emerald-400 to-teal-600",
  },
  {
    id: "pf-5",
    title: "Introduction to Web Accessibility",
    description: "Course W3C/edX — WCAG 2.1 AA fundamentals + screen reader testing.",
    category: "certification",
    link: "https://www.edx.org/cert/rizky-demo",
    techStack: [],
    dateOffsetDays: -84,
    featured: false,
    coverEmoji: "♿",
    coverGradient: "from-indigo-400 to-violet-600",
  },
];

// ---------------------------------------------------------------------
// Contacts (Networking)
// ---------------------------------------------------------------------

export interface DemoContactSeed {
  id: string;
  name: string;
  role: "recruiter" | "mentor" | "peer" | "other";
  company?: string;
  position?: string;
  email?: string;
  linkedinUrl?: string;
  notes?: string;
  avatarEmoji?: string;
  avatarHue?: string;
  /** Days ago since last interaction. */
  lastInteractionDays: number;
  favorite: boolean;
}

// ---------------------------------------------------------------------
// Calendar / Agenda
// ---------------------------------------------------------------------

export type DemoAgendaType = "interview" | "deadline" | "followup";

export interface DemoAgendaSeed {
  id: string;
  title: string;
  /** Days from "now" — usually positive (in the future). */
  dateOffsetDays: number;
  /** HH:mm */
  time: string;
  location: string;
  type: DemoAgendaType;
  notes?: string;
}

export const DEMO_AGENDA: ReadonlyArray<DemoAgendaSeed> = [
  {
    id: "ag-1",
    title: "Final Interview — Tokopedia",
    dateOffsetDays: 3,
    time: "10:00",
    location: "Google Meet",
    type: "interview",
    notes: "System design + behavioral. Siapkan STAR stories: a11y push & TTI optimization.",
  },
  {
    id: "ag-2",
    title: "Follow-up Recruiter — Gojek",
    dateOffsetDays: 1,
    time: "14:00",
    location: "WhatsApp",
    type: "followup",
    notes: "Tanya status setelah HR call Selasa lalu.",
  },
  {
    id: "ag-3",
    title: "Deadline Take-home — Kitabisa",
    dateOffsetDays: 5,
    time: "23:59",
    location: "GitHub PR",
    type: "deadline",
    notes: "Build mini donor dashboard React + Tailwind. README + tests wajib.",
  },
  {
    id: "ag-4",
    title: "Coffee chat — Budi (mentor)",
    dateOffsetDays: 7,
    time: "09:30",
    location: "Anomali Coffee Setiabudi",
    type: "followup",
    notes: "Review ulang roadmap + diskusi tawaran Blibli vs Tokopedia.",
  },
  {
    id: "ag-5",
    title: "Deadline Offer — Blibli",
    dateOffsetDays: 10,
    time: "17:00",
    location: "Email HR",
    type: "deadline",
    notes: "Konfirmasi accept/decline offer letter.",
  },
];

// ---------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------

export type DemoNotificationType =
  | "deadline"
  | "interview"
  | "application"
  | "system"
  | "tip";

export interface DemoNotificationSeed {
  id: string;
  type: DemoNotificationType;
  title: string;
  message: string;
  read: boolean;
  /** Hours ago when it was created. */
  hoursAgo: number;
  actionUrl?: string;
}

export const DEMO_NOTIFICATIONS: ReadonlyArray<DemoNotificationSeed> = [
  {
    id: "n-1",
    type: "interview",
    title: "Final interview Tokopedia 3 hari lagi",
    message: "Siapkan portfolio link + 2 STAR stories. Buka Calendar untuk detail.",
    read: false,
    hoursAgo: 2,
    actionUrl: "/dashboard/calendar",
  },
  {
    id: "n-2",
    type: "deadline",
    title: "Take-home Kitabisa due 5 hari",
    message: "Mulai sekarang agar tidak buru-buru. Lihat catatan di Calendar.",
    read: false,
    hoursAgo: 8,
    actionUrl: "/dashboard/calendar",
  },
  {
    id: "n-3",
    type: "application",
    title: "Status Shopee diperbarui",
    message: "HR membuka aplikasi Anda — biasanya screening dalam 3 hari kerja.",
    read: false,
    hoursAgo: 18,
  },
  {
    id: "n-4",
    type: "tip",
    title: "Tips: gunakan Personal Branding",
    message: "Aktifkan halaman publik agar recruiter bisa lihat ringkasan + portofolio Anda.",
    read: true,
    hoursAgo: 36,
    actionUrl: "/dashboard/personal-branding",
  },
  {
    id: "n-5",
    type: "system",
    title: "Selamat datang di mode Tamu!",
    message: "Semua data di sini lokal di browser Anda. Daftar untuk simpan permanen.",
    read: true,
    hoursAgo: 72,
  },
];

// ---------------------------------------------------------------------
// Document checklist progress (frontend template lives in
// shared/data/indonesianData.ts — we only persist completion + notes)
// ---------------------------------------------------------------------

export interface DemoChecklistEntry {
  /** Matches an item id from `indonesianDocumentChecklist`. */
  id: string;
  completed: boolean;
  notes?: string;
  /** YYYY-MM-DD if relevant. */
  expiryDate?: string;
}

export const DEMO_CHECKLIST_PROGRESS: ReadonlyArray<DemoChecklistEntry> = [
  { id: "ktp", completed: true },
  { id: "skck", completed: true, notes: "Diperbarui Maret. Berlaku 6 bulan.", expiryDate: "2026-09-01" },
  { id: "ijazah-s1", completed: true, notes: "Sudah scan + legalisir." },
  { id: "transkrip", completed: true },
  { id: "cv-bahasa-indo", completed: true, notes: "Versi terbaru di CV Generator." },
  { id: "cv-bahasa-inggris", completed: false, notes: "Translate dari draft Indonesia minggu ini." },
  { id: "portofolio", completed: true },
  { id: "npwp", completed: true },
  { id: "rekening-koran", completed: false, notes: "Tarik 3 bulan terakhir BCA." },
  { id: "passport", completed: false },
  { id: "ielts", completed: true, notes: "IELTS 7.0 — masih berlaku 1 tahun." },
];

// ---------------------------------------------------------------------
// Personal branding (public profile)
// ---------------------------------------------------------------------

export interface DemoPBSeed {
  enabled: boolean;
  slug: string;
  headline: string;
  bioShow: boolean;
  skillsShow: boolean;
  targetRoleShow: boolean;
  contactEmail: string;
  linkedinUrl: string;
  portfolioUrl: string;
  allowIndex: boolean;
  avatarShow: boolean;
  portfolioShow: boolean;
  mode: "auto" | "custom";
  theme: "template-v1" | "template-v2" | "template-v3";
  headerBg: { kind: "gradient" | "solid" | "image" | "none"; value: string } | null;
  autoToggles: {
    showExperience: boolean;
    showEducation: boolean;
    showCertifications: boolean;
    showProjects: boolean;
    showSocial: boolean;
  };
  htmlExport: boolean;
  embedExport: boolean;
  promptExport: boolean;
}

export const DEMO_PB: DemoPBSeed = {
  enabled: true,
  slug: "rizky-demo",
  headline: "Frontend Engineer · Jakarta · React + TypeScript",
  bioShow: true,
  skillsShow: true,
  targetRoleShow: true,
  contactEmail: "rizky.demo@careerpack.id",
  linkedinUrl: "https://linkedin.com/in/rizky-demo",
  portfolioUrl: "https://rizky-demo.vercel.app",
  allowIndex: true,
  avatarShow: true,
  portfolioShow: true,
  mode: "auto",
  theme: "template-v2",
  headerBg: { kind: "gradient", value: "from-cyan-400 to-violet-600" },
  autoToggles: {
    showExperience: true,
    showEducation: true,
    showCertifications: true,
    showProjects: true,
    showSocial: true,
  },
  htmlExport: true,
  embedExport: true,
  promptExport: true,
};

export const DEMO_CONTACTS: ReadonlyArray<DemoContactSeed> = [
  {
    id: "c-1",
    name: "Sarah Wibowo",
    role: "recruiter",
    company: "Tokopedia",
    position: "Senior Tech Recruiter",
    email: "sarah.w@tokopedia.com",
    linkedinUrl: "https://linkedin.com/in/sarah-w",
    notes: "Recruiter Tokopedia FE. Refer ke role Junior. Follow-up tiap 2 minggu.",
    avatarEmoji: "👩‍💼",
    avatarHue: "from-rose-400 to-rose-600",
    lastInteractionDays: 3,
    favorite: true,
  },
  {
    id: "c-2",
    name: "Budi Santoso",
    role: "mentor",
    company: "Gojek",
    position: "Senior Frontend Engineer",
    email: "budi.s@gojek.com",
    linkedinUrl: "https://linkedin.com/in/budi-santoso",
    notes: "Mentor career — diskusi roadmap setiap akhir bulan.",
    avatarEmoji: "🧑‍🏫",
    avatarHue: "from-sky-400 to-sky-600",
    lastInteractionDays: 14,
    favorite: true,
  },
  {
    id: "c-3",
    name: "Dewi Lestari",
    role: "peer",
    company: "Shopee",
    position: "Frontend Engineer",
    linkedinUrl: "https://linkedin.com/in/dewi-l",
    notes: "Peer dari Dicoding bootcamp. Recommend referal ke Shopee.",
    avatarEmoji: "👩‍💻",
    avatarHue: "from-violet-400 to-violet-600",
    lastInteractionDays: 7,
    favorite: false,
  },
  {
    id: "c-4",
    name: "Andi Pratama",
    role: "peer",
    company: "Freelance",
    position: "Full-stack Engineer",
    notes: "Project partner di proyek UMKM landing page. Skills overlap baik.",
    avatarEmoji: "👨‍💻",
    avatarHue: "from-emerald-400 to-emerald-600",
    lastInteractionDays: 30,
    favorite: false,
  },
  {
    id: "c-5",
    name: "Maya Rahmawati",
    role: "recruiter",
    company: "Traveloka",
    position: "Tech Recruiter",
    email: "maya.r@traveloka.com",
    notes: "Direct outreach via LinkedIn. Akan kabar lagi minggu depan.",
    avatarEmoji: "👩‍💼",
    avatarHue: "from-amber-400 to-amber-600",
    lastInteractionDays: 5,
    favorite: false,
  },
  {
    id: "c-6",
    name: "Hendra Wijaya",
    role: "mentor",
    company: "Bukalapak",
    position: "Engineering Manager",
    linkedinUrl: "https://linkedin.com/in/hendra-w",
    notes: "Senior mentor untuk soft-skill + interview prep.",
    avatarEmoji: "🧑‍🏫",
    avatarHue: "from-cyan-400 to-cyan-600",
    lastInteractionDays: 21,
    favorite: false,
  },
];
