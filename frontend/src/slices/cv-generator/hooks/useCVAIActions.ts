"use client";

import { useEffect } from "react";
import { subscribe } from "@/shared/lib/aiActionBus";
import type { CVData, Experience, Skill } from "../types";
import type { CVFormat } from "../constants";

interface Handlers {
  setCVData: React.Dispatch<React.SetStateAction<CVData>>;
  setActiveSection: (section: string | null) => void;
  setFormat: (format: CVFormat) => void;
}

/**
 * Wiring antara AI agent bus dan state CV generator.
 * Di-extract dari CVGenerator supaya komponen utama tak tahu detail bus.
 */
export function useCVAIActions({ setCVData, setActiveSection, setFormat }: Handlers) {
  useEffect(() => {
    const unsubFill = subscribe("cv.fillExperience", (action) => {
      if (action.type !== "cv.fillExperience") return;
      const newExp: Experience = {
        id: Date.now().toString(),
        company: action.payload.company,
        position: action.payload.position,
        startDate: action.payload.startDate ?? "",
        endDate: action.payload.endDate ?? "",
        description: action.payload.description,
        achievements: [],
      };
      setCVData((prev) => ({ ...prev, experience: [newExp, ...prev.experience] }));
      setActiveSection("experience");
    });

    const unsubSummary = subscribe("cv.improveSummary", (action) => {
      if (action.type !== "cv.improveSummary") return;
      setCVData((prev) => ({
        ...prev,
        profile: { ...prev.profile, summary: action.payload.summary },
      }));
    });

    const unsubSkills = subscribe("cv.addSkills", (action) => {
      if (action.type !== "cv.addSkills") return;
      const additions: Skill[] = action.payload.skills.map((s, i) => ({
        id: `${Date.now()}-${i}`,
        name: s.name,
        category: s.category,
        proficiency: 3,
      }));
      setCVData((prev) => ({ ...prev, skills: [...prev.skills, ...additions] }));
    });

    const unsubFormat = subscribe("cv.setFormat", (action) => {
      if (action.type !== "cv.setFormat") return;
      setFormat(action.payload.format);
    });

    return () => {
      unsubFill();
      unsubSummary();
      unsubSkills();
      unsubFormat();
    };
  }, [setCVData, setActiveSection, setFormat]);
}
