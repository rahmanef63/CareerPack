"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { useAction } from "convex/react";
import { notify } from "@/shared/lib/notify";
import { makeIdempotencyKey } from "@/shared/lib/idempotencyKey";
import { api } from "../../../../convex/_generated/api";
import type {
  CVData, Certification, Education, Experience, Project, Skill,
} from "../types";
import type { CVFormat } from "../constants";

export function useCVHandlers(
  setCvData: Dispatch<SetStateAction<CVData>>,
  setFormat: Dispatch<SetStateAction<CVFormat>>,
  /** Current form state — the AI-suggestion chips need to know whether the
   *  field they target is already filled before claiming they applied one. */
  cvData: CVData,
) {
  const suggestCVText = useAction(api.cv.actions.suggestCVText);
  const [isSuggestingSummary, setIsSuggestingSummary] = useState(false);
  const [suggestingExperienceId, setSuggestingExperienceId] = useState<string | null>(null);
  const handlePhotoUploaded = (result: { storageId: string }) => {
    // Storage source supersedes any prior URL — clear avatarUrl so
    // the renderer's storage-precedence rule doesn't strand the URL.
    setCvData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        avatarStorageId: result.storageId,
        avatarUrl: undefined,
      },
    }));
    notify.success('Foto CV terunggah');
  };

  const handlePhotoFromLibrary = (file: { storageId: string }) => {
    setCvData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        avatarStorageId: file.storageId,
        avatarUrl: undefined,
      },
    }));
    notify.success('Foto dipilih dari Library');
  };

  const handlePhotoUrl = (url: string) => {
    setCvData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        avatarUrl: url,
        avatarStorageId: undefined,
      },
    }));
    notify.success('Foto via URL diterapkan');
  };

  const handlePhotoClear = () => {
    setCvData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        avatarStorageId: undefined,
        avatarUrl: undefined,
      },
    }));
  };

  // These used to insert the SAME hardcoded paragraph regardless of who
  // clicked it, and toasted "Saran AI diterapkan" — no AI was ever called.
  // Fixed 2026-08-31: both now call cv.actions.suggestCVText, grounded in
  // whatever the user has already typed elsewhere on the form.
  const aiSuggestSummary = async () => {
    if (cvData.profile.summary.trim()) {
      notify.info('Ringkasan sudah terisi — kosongkan dulu untuk memakai saran');
      return;
    }
    if (isSuggestingSummary) return;
    setIsSuggestingSummary(true);
    try {
      const context = {
        targetIndustry: cvData.profile.targetIndustry || undefined,
        position: cvData.experience[0]?.position || undefined,
        skills: cvData.skills.map(s => s.name).filter(Boolean),
      };
      const idempotencyKey = makeIdempotencyKey('cv-suggest-summary', [
        context.targetIndustry, context.position, ...context.skills,
      ]);
      const { text } = await suggestCVText({ field: 'summary', context, idempotencyKey });
      setCvData(prev => ({
        ...prev,
        profile: { ...prev.profile, summary: text },
      }));
      notify.success('Saran AI diterapkan ke ringkasan');
    } catch (err) {
      notify.fromError(err, 'Gagal membuat saran AI');
    } finally {
      setIsSuggestingSummary(false);
    }
  };

  const aiSuggestExperienceDesc = async (id: string) => {
    const exp = cvData.experience.find(e => e.id === id);
    if (exp?.description.trim()) {
      notify.info('Deskripsi sudah terisi — kosongkan dulu untuk memakai saran');
      return;
    }
    if (!exp?.position.trim()) {
      notify.info('Isi jabatan dulu supaya saran AI relevan');
      return;
    }
    if (suggestingExperienceId) return;
    setSuggestingExperienceId(id);
    try {
      const context = {
        position: exp.position,
        company: exp.company || undefined,
        targetIndustry: cvData.profile.targetIndustry || undefined,
        skills: cvData.skills.map(s => s.name).filter(Boolean),
      };
      const idempotencyKey = makeIdempotencyKey('cv-suggest-experience', [
        id, context.position, context.company,
      ]);
      const { text } = await suggestCVText({ field: 'experience', context, idempotencyKey });
      setCvData(prev => ({
        ...prev,
        experience: prev.experience.map(e =>
          e.id === id ? { ...e, description: text } : e,
        ),
      }));
      notify.success('Saran AI diterapkan');
    } catch (err) {
      notify.fromError(err, 'Gagal membuat saran AI');
    } finally {
      setSuggestingExperienceId(null);
    }
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
    const e: Education = { id: crypto.randomUUID(), institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' };
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
    const e: Experience = { id: crypto.randomUUID(), company: '', position: '', startDate: '', endDate: '', description: '', achievements: [] };
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
    const s: Skill = { id: crypto.randomUUID(), name: '', category: 'technical', proficiency: 3 };
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
    const c: Certification = { id: crypto.randomUUID(), name: '', issuer: '', date: '' };
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
    const p: Project = { id: crypto.randomUUID(), name: '', description: '', technologies: [] };
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
    handlePhotoUploaded, handlePhotoFromLibrary, handlePhotoUrl, handlePhotoClear,
    aiSuggestSummary, aiSuggestExperienceDesc,
    isSuggestingSummary, suggestingExperienceId,
    updateProfile, updatePref, setFormatWithDefaults,
    addEducation, updateEducation, removeEducation,
    addExperience, updateExperience, removeExperience,
    addSkill, updateSkill, removeSkill,
    addCertification, updateCertification, removeCertification,
    addProject, updateProject, removeProject,
  };
}
