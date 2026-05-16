import type { CVData, CVDisplayPrefs, CVTemplateId } from "../types";

export const defaultDisplayPrefs: CVDisplayPrefs = {
  showPicture: true,
  showAge: true,
  showGraduationYear: true,
  templateId: "classic",
};

export const initialCVData: CVData = {
  profile: {
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
    summary: "",
    targetIndustry: "",
    experienceLevel: "fresh-graduate",
  },
  education: [],
  experience: [],
  skills: [],
  certifications: [],
  projects: [],
  displayPrefs: defaultDisplayPrefs,
};

export type CVFormat = "national" | "international";

export const CV_TEMPLATES: Array<{
  id: CVTemplateId;
  name: string;
  blurb: string;
}> = [
  {
    id: "classic",
    name: "Klasik Eksekutif",
    blurb: "Sidebar foto + serif headline. Ideal kontekstual Indonesia, BUMN, korporat tradisional.",
  },
  {
    id: "modern",
    name: "Modern Akzent",
    blurb: "Header brand + tipografi sans tegas. Cocok startup, perusahaan kreatif, peran produk.",
  },
  {
    id: "minimal",
    name: "Minimal ATS",
    blurb: "Satu kolom, font sans murni, tanpa warna. Lolos ATS, ideal lamaran luar negeri.",
  },
];
