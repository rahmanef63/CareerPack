"use client";

import { useCallback } from "react";
import { notify } from "@/shared/lib/notify";
import { useLocalStorageState } from "../useLocalStorageState";
import { DEMO_CV } from "@/shared/data/demoUser";
import type { CVData } from "@/slices/cv-generator/types";

const CV_KEY = "careerpack:demo:cv";

interface CVHook {
  cvData: CVData | null;
  saveCV: (data: CVData) => Promise<boolean>;
  isLoading: boolean;
}

function defaultCVData(): CVData {
  return {
    profile: {
      name: DEMO_CV.personalInfo.fullName,
      email: DEMO_CV.personalInfo.email,
      phone: DEMO_CV.personalInfo.phone,
      location: DEMO_CV.personalInfo.location,
      linkedin: DEMO_CV.personalInfo.linkedin,
      portfolio: DEMO_CV.personalInfo.portfolio,
      summary: DEMO_CV.personalInfo.summary,
      dateOfBirth: DEMO_CV.personalInfo.dateOfBirth,
      targetIndustry: "",
      experienceLevel: "fresh-graduate",
    },
    education: DEMO_CV.education.map((e) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.field,
      startDate: e.startDate,
      endDate: e.endDate,
      gpa: e.gpa,
    })),
    experience: DEMO_CV.experience.map((e) => ({
      id: e.id,
      company: e.company,
      position: e.position,
      startDate: e.startDate,
      endDate: e.endDate ?? "",
      description: e.description,
      achievements: e.achievements,
    })),
    skills: DEMO_CV.skills.map((s) => ({
      id: s.id,
      name: s.name,
      category: "technical",
      proficiency: Math.max(1, Math.min(5, Math.round(s.proficiency / 20))) as
        | 1 | 2 | 3 | 4 | 5,
    })),
    certifications: DEMO_CV.certifications,
    projects: DEMO_CV.projects,
    displayPrefs: {
      showPicture: false,
      showAge: false,
      showGraduationYear: true,
      templateId: "modern",
    },
  };
}

export function useDemoCVOverlay(): CVHook {
  const [cv, setCV] = useLocalStorageState<CVData>(CV_KEY, defaultCVData());

  const saveCV: CVHook["saveCV"] = useCallback(
    async (data) => {
      setCV(data);
      notify.success("Tersimpan di mode demo (lokal)");
      return true;
    },
    [setCV],
  );

  return { cvData: cv, saveCV, isLoading: false };
}
