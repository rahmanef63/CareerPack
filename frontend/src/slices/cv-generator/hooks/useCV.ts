import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation } from "convex/react";
import { type CVData, type CVDisplayPrefs, type CVTemplateId, type SkillCategory, type ProficiencyLevel } from '../types';
import { useAuth } from '@/shared/hooks/useAuth';
import { useDemoCVOverlay } from '@/shared/hooks/useDemoOverlay';
import { defaultDisplayPrefs } from '../constants';
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

const ALLOWED_TEMPLATES: CVTemplateId[] = ["classic", "modern", "minimal"];

function toTemplateId(value: string | undefined): CVTemplateId {
    return ALLOWED_TEMPLATES.includes(value as CVTemplateId)
        ? (value as CVTemplateId)
        : "classic";
}

function mergePrefs(raw: Doc<"cvs">["displayPrefs"]): CVDisplayPrefs {
    return {
        showPicture: raw?.showPicture ?? defaultDisplayPrefs.showPicture,
        showAge: raw?.showAge ?? defaultDisplayPrefs.showAge,
        showGraduationYear: raw?.showGraduationYear ?? defaultDisplayPrefs.showGraduationYear,
        templateId: toTemplateId(raw?.templateId),
    };
}

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
    const isDemo = state.isDemo;

    // Both branches must run unconditionally — Convex skips when unauth
    // or in demo, while the demo overlay always returns localStorage data.
    const cvs = useQuery(
        api.cv.queries.getUserCVs,
        isAuthenticated && !isDemo ? {} : "skip",
    );
    const createCVMutation = useMutation(api.cv.mutations.createCV);
    const updateCVMutation = useMutation(api.cv.mutations.updateCV);

    const demo = useDemoCVOverlay();

    const [activeCVId, setActiveCVId] = useState<Id<"cvs"> | null>(null);
    // Track the newest id we've already auto-selected so we can detect
    // when a brand-new CV appears (QuickFill insert / createCV) and
    // switch the picker over to it. Without this guard the picker would
    // re-fire on every Convex live update and clobber a manual pick.
    const lastAutoSelected = useRef<string | null>(null);

    // Newest CV first — matters when QuickFill inserts a fresh row
    // and we want it to become the visible/active CV without the user
    // having to manually swap. _creationTime is millisecond ts on every
    // Convex doc.
    const sortedCVs = useMemo(() => {
        if (!cvs) return cvs;
        return [...cvs].sort((a, b) => b._creationTime - a._creationTime);
    }, [cvs]);

    // Auto-select newest CV. Three triggers:
    //   1. First load — activeCVId null → pick newest.
    //   2. New CV appeared (QuickFill / createCV) — newest id differs
    //      from the one we last auto-selected → switch.
    //   3. Active CV got deleted (undo) — stillExists false → fall back
    //      to current newest.
    useEffect(() => {
        if (!sortedCVs || sortedCVs.length === 0) return;
        const newest = sortedCVs[0]._id;
        const newestStr = String(newest);
        const stillExists = activeCVId
            ? sortedCVs.some((c) => c._id === activeCVId)
            : false;

        if (!activeCVId) {
            setActiveCVId(newest);
            lastAutoSelected.current = newestStr;
            return;
        }
        if (!stillExists) {
            setActiveCVId(newest);
            lastAutoSelected.current = newestStr;
            return;
        }
        // Newest changed since our last auto-pick → fresh insert. Swap.
        if (lastAutoSelected.current && lastAutoSelected.current !== newestStr) {
            setActiveCVId(newest);
            lastAutoSelected.current = newestStr;
        }
    }, [sortedCVs, activeCVId]);

    // Convert schema format to frontend CVData format if needed
    // Schema: personalInfo has linkedin, portfolio now.
    // Schema skills: {id, name, category, proficiency} matches frontend Skill

    const activeCV: Doc<"cvs"> | undefined = sortedCVs?.find((c) => c._id === activeCVId);

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
            avatarStorageId: activeCV.personalInfo.avatarStorageId,
            dateOfBirth: activeCV.personalInfo.dateOfBirth,
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
        projects: activeCV.projects || [],
        displayPrefs: mergePrefs(activeCV.displayPrefs),
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
                    summary: data.profile.summary,
                    avatarStorageId: data.profile.avatarStorageId,
                    dateOfBirth: data.profile.dateOfBirth,
                },
                displayPrefs: {
                    showPicture: data.displayPrefs.showPicture,
                    showAge: data.displayPrefs.showAge,
                    showGraduationYear: data.displayPrefs.showGraduationYear,
                    templateId: data.displayPrefs.templateId,
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
            // Re-throw so the caller's try/catch can run notify.fromError.
            // Earlier the hook swallowed errors and returned false, but
            // CVGenerator.handleSave never inspected the return value, so
            // failures silently looked like successes.
            console.error("Failed to save CV:", error);
            throw error;
        }
    }, [activeCVId, createCVMutation, updateCVMutation, isAuthenticated]);

    if (isDemo) {
        return {
            cvData: demo.cvData,
            saveCV: demo.saveCV,
            isLoading: demo.isLoading,
            createCV: createCVMutation,
            activeCVId: null as Id<"cvs"> | null,
        };
    }

    return {
        cvData,
        saveCV,
        isLoading: cvs === undefined,
        createCV: createCVMutation,
        activeCVId,
    };
}
