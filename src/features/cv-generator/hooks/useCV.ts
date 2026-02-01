import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from "convex/react";
import { type CVData } from '../types';
import { useAuth } from '@/features/auth';
// We import from relative path assuming convex/_generated exists
// If not, these imports will fail and we might need to mock types or run code gen
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

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

    const activeCV = cvs?.find((c: any) => c._id === activeCVId);

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
        education: (activeCV.education || []).map((e: any) => ({
            ...e,
            fieldOfStudy: e.field // map field -> fieldOfStudy
        })),
        experience: (activeCV.experience || []).map((e: any) => ({
            ...e,
            endDate: e.endDate || "", // handle optional
            achievements: e.achievements || []
        })),
        skills: (activeCV.skills || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            category: s.category as any, // Cast string to union
            proficiency: s.proficiency
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
                experience: data.experience.map((e: any) => ({
                    id: e.id,
                    company: e.company,
                    position: e.position,
                    startDate: e.startDate,
                    endDate: e.endDate || undefined,
                    current: !e.endDate,
                    description: e.description,
                    achievements: e.achievements
                })),
                education: data.education.map((e: any) => ({
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
