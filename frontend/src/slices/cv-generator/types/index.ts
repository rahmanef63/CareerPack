/**
 * CV Generator feature types.
 */

import type { ExperienceLevel, SkillCategory, ProficiencyLevel } from '@/shared/types';

export type { ExperienceLevel, SkillCategory, ProficiencyLevel };

export interface UserProfile {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
    summary: string;
    targetIndustry: string;
    experienceLevel: ExperienceLevel;
}

export interface Education {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    gpa?: string;
}

export interface Experience {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    achievements: string[];
}

export interface Skill {
    id: string;
    name: string;
    category: SkillCategory;
    proficiency: ProficiencyLevel;
}

export interface Certification {
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
}

export interface CVData {
    profile: UserProfile;
    education: Education[];
    experience: Experience[];
    skills: Skill[];
    certifications: Certification[];
    projects: Project[];
}
