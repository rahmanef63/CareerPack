import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from "convex/react";
import { type CVData, type SkillCategory, type ProficiencyLevel } from '../types';
import { useAuth } from '@/shared/hooks/useAuth';
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

const ALLOWED_SKILL_CATEGORIES: SkillCategory[] = ["technical", "soft", "language", "tool"];

function toSkillCategory(value: string): SkillCategory {
    return ALLOWED_SKILL_CATEGORIES.includes(value as SkillCategory)
        ? (value as SkillCategory)
        : "technical";
}

function toProficiencyLevel(value: number): ProficiencyLevel {
    if (value <= 1) return 1;
    if (value >= 5) return 5;
    return Math.round(value) as ProficiencyLevel;
}

export function useCV() {
    const { state } = useAuth();
    const isAuthenticated = state.isAuthenticated;

    // Conditionally fetch if authenticated
    const cvs = useQuery(api.cv.getUserCVs, isAuthenticated ? {} : "skip");
    const createCVMutation = useMutation(api.cv.createCV);
    const updateCVMutation = useMutation(api.cv.updateCV);

    const [activeCVId, setActiveCVId] = useState<Id<"cvs"> | null>(null);

    // Auto-select first CV
    useEffect(() => {
        if (cvs && cvs.length > 0 && !activeCVId) {
            setActiveCVId(cvs[0]._id);
        }
    }, [cvs, activeCVId]);

    // Convert schema format to frontend CVData format if needed
    // Schema: personalInfo has linkedin, portfolio now.
    // Schema skills: {id, name, category, proficiency} matches frontend Skill

    const activeCV: Doc<"cvs"> | undefined = cvs?.find((c) => c._id === activeCVId);

    // Helper to map backend data to frontend structure
    const cvData: CVData | null = activeCV ? {
        profile: {
            // id: activeCV.userId as string, // UserProfile in types doesn't have id
            name: activeCV.personalInfo.fullName,
            email: activeCV.personalInfo.email,
            phone: activeCV.personalInfo.phone,
            location: activeCV.personalInfo.location,
            linkedin: activeCV.personalInfo.linkedin || "",
            portfolio: activeCV.personalInfo.portfolio || "",
            summary: activeCV.personalInfo.summary,
            targetIndustry: "", // Not in schema yet
            experienceLevel: "fresh-graduate", // Not in schema yet
        },
        education: (activeCV.education || []).map((e) => ({
            ...e,
            fieldOfStudy: e.field // map field -> fieldOfStudy
        })),
        experience: (activeCV.experience || []).map((e) => ({
            ...e,
            endDate: e.endDate || "", // handle optional
            achievements: e.achievements || []
        })),
        skills: (activeCV.skills || []).map((s) => ({
            id: s.id,
            name: s.name,
            category: toSkillCategory(s.category),
            proficiency: toProficiencyLevel(s.proficiency)
        })),
        certifications: activeCV.certifications || [],
        projects: activeCV.projects || []
    } : null;

    const saveCV = useCallback(async (data: CVData) => {
        if (!isAuthenticated) return;

        try {
            const updatePayload = {
                title: "My CV",
                personalInfo: {
                    fullName: data.profile.name,
                    email: data.profile.email,
                    phone: data.profile.phone,
                    location: data.profile.location,
                    linkedin: data.profile.linkedin,
                    portfolio: data.profile.portfolio,
                    summary: data.profile.summary
                },
                experience: data.experience.map((e) => ({
                    id: e.id,
                    company: e.company,
                    position: e.position,
                    startDate: e.startDate,
                    endDate: e.endDate || undefined,
                    current: !e.endDate,
                    description: e.description,
                    achievements: e.achievements
                })),
                education: data.education.map((e) => ({
                    id: e.id,
                    institution: e.institution,
                    degree: e.degree,
                    field: e.fieldOfStudy, // map back
                    startDate: e.startDate,
                    endDate: e.endDate,
                    gpa: e.gpa || undefined
                })),
                skills: data.skills.map(s => ({
                    id: s.id,
                    name: s.name,
                    category: s.category,
                    proficiency: s.proficiency
                })),
                certifications: data.certifications.map(c => ({
                    id: c.id,
                    name: c.name,
                    issuer: c.issuer,
                    date: c.date,
                    expiryDate: c.expiryDate || undefined
                })),
                projects: data.projects.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    technologies: p.technologies,
                    link: p.link || undefined
                }))
            };

            if (activeCVId) {
                await updateCVMutation({
                    cvId: activeCVId,
                    updates: updatePayload
                });
            } else {
                const newId = await createCVMutation({
                    title: "My CV",
                    template: "modern"
                });
                setActiveCVId(newId);
                await updateCVMutation({
                    cvId: newId,
                    updates: updatePayload
                });
            }
            return true;
        } catch (error) {
            console.error("Failed to save CV:", error);
            return false;
        }
    }, [activeCVId, createCVMutation, updateCVMutation, isAuthenticated]);

    return {
        cvData,
        saveCV,
        isLoading: cvs === undefined,
        createCV: createCVMutation
    };
}
