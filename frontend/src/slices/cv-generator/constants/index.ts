import type { CVData } from "../types";

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
};

export type CVFormat = "national" | "international";
