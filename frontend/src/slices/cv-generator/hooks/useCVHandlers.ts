"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { notify } from "@/shared/lib/notify";
import type {
  CVData, Certification, Education, Experience, Project, Skill,
} from "../types";
import type { CVFormat } from "../constants";

export function useCVHandlers(
  setCvData: Dispatch<SetStateAction<CVData>>,
  setFormat: Dispatch<SetStateAction<CVFormat>>,
) {
  const handlePhotoUploaded = (result: { storageId: string }) => {
    setCvData((prev) => ({
      ...prev,
      profile: { ...prev.profile, avatarStorageId: result.storageId },
    }));
    notify.success('Foto CV terunggah');
  };

  const handlePhotoClear = () => {
    setCvData((prev) => ({
      ...prev,
      profile: { ...prev.profile, avatarStorageId: undefined },
    }));
  };

  const aiSuggestSummary = () => {
    setCvData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        summary:
          prev.profile.summary ||
          'Profesional muda dengan etos kerja kuat, fokus pada problem solving dan kolaborasi tim. Berorientasi pada dampak terukur dan pengembangan diri berkelanjutan.',
      },
    }));
    notify.success('Saran AI diterapkan ke ringkasan');
  };

  const aiSuggestExperienceDesc = (id: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(e =>
        e.id === id
          ? {
              ...e,
              description:
                e.description ||
                'Memimpin inisiatif end-to-end yang menghasilkan peningkatan efisiensi 30%. Berkolaborasi lintas tim untuk mendelivery fitur tepat waktu dengan kualitas tinggi.',
            }
          : e,
      ),
    }));
    notify.success('Saran AI diterapkan');
  };

  const updateProfile = useCallback((field: string, value: string) => {
    setCvData(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  }, [setCvData]);

  const updatePref = useCallback(
    <K extends keyof CVData['displayPrefs']>(key: K, value: CVData['displayPrefs'][K]) => {
      setCvData((prev) => ({
        ...prev,
        displayPrefs: { ...prev.displayPrefs, [key]: value },
      }));
    },
    [setCvData],
  );

  // Switching format flips the photo/age/grad-year defaults to match
  // local convention. International = ATS-friendly, no photo/age. The
  // user can still override afterwards.
  const setFormatWithDefaults = useCallback((next: CVFormat) => {
    setFormat(next);
    if (next === 'international') {
      setCvData((prev) => ({
        ...prev,
        displayPrefs: {
          ...prev.displayPrefs,
          showPicture: false,
          showAge: false,
          showGraduationYear: false,
          templateId: prev.displayPrefs.templateId === 'classic' ? 'minimal' : prev.displayPrefs.templateId,
        },
      }));
    } else {
      setCvData((prev) => ({
        ...prev,
        displayPrefs: {
          ...prev.displayPrefs,
          showPicture: true,
          showAge: true,
          showGraduationYear: true,
          templateId: prev.displayPrefs.templateId === 'minimal' ? 'classic' : prev.displayPrefs.templateId,
        },
      }));
    }
  }, [setCvData, setFormat]);

  const addEducation = () => {
    const e: Education = { id: Date.now().toString(), institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' };
    setCvData(prev => ({ ...prev, education: [...prev.education, e] }));
  };
  const updateEducation = useCallback((id: string, field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu),
    }));
  }, [setCvData]);
  const removeEducation = (id: string) => {
    setCvData(prev => ({ ...prev, education: prev.education.filter(edu => edu.id !== id) }));
  };

  const addExperience = () => {
    const e: Experience = { id: Date.now().toString(), company: '', position: '', startDate: '', endDate: '', description: '', achievements: [] };
    setCvData(prev => ({ ...prev, experience: [...prev.experience, e] }));
  };
  const updateExperience = useCallback((id: string, field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp),
    }));
  }, [setCvData]);
  const removeExperience = (id: string) => {
    setCvData(prev => ({ ...prev, experience: prev.experience.filter(exp => exp.id !== id) }));
  };

  const addSkill = () => {
    const s: Skill = { id: Date.now().toString(), name: '', category: 'technical', proficiency: 3 };
    setCvData(prev => ({ ...prev, skills: [...prev.skills, s] }));
  };
  const updateSkill = useCallback((id: string, field: string, value: string | number) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.map(skill => skill.id === id ? { ...skill, [field]: value } : skill),
    }));
  }, [setCvData]);
  const removeSkill = (id: string) => {
    setCvData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill.id !== id) }));
  };

  const addCertification = () => {
    const c: Certification = { id: Date.now().toString(), name: '', issuer: '', date: '' };
    setCvData(prev => ({ ...prev, certifications: [...prev.certifications, c] }));
  };
  const updateCertification = useCallback((id: string, field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      certifications: prev.certifications.map(cert => cert.id === id ? { ...cert, [field]: value } : cert),
    }));
  }, [setCvData]);
  const removeCertification = (id: string) => {
    setCvData(prev => ({ ...prev, certifications: prev.certifications.filter(cert => cert.id !== id) }));
  };

  const addProject = () => {
    const p: Project = { id: Date.now().toString(), name: '', description: '', technologies: [] };
    setCvData(prev => ({ ...prev, projects: [...prev.projects, p] }));
  };
  const updateProject = useCallback((id: string, field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj),
    }));
  }, [setCvData]);
  const removeProject = (id: string) => {
    setCvData(prev => ({ ...prev, projects: prev.projects.filter(proj => proj.id !== id) }));
  };

  return {
    handlePhotoUploaded, handlePhotoClear,
    aiSuggestSummary, aiSuggestExperienceDesc,
    updateProfile, updatePref, setFormatWithDefaults,
    addEducation, updateEducation, removeEducation,
    addExperience, updateExperience, removeExperience,
    addSkill, updateSkill, removeSkill,
    addCertification, updateCertification, removeCertification,
    addProject, updateProject, removeProject,
  };
}
