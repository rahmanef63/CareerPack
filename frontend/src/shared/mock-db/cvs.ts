/**
 * CVs mock database table.
 */

import type { BaseEntity, ExperienceLevel, SkillCategory, ProficiencyLevel } from '../types';
import { BaseRepository } from './base-repository';

// CV Sub-entities
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

// Main CV Entity
export interface CV extends BaseEntity {
    userId: string;
    profile: UserProfile;
    education: Education[];
    experience: Experience[];
    skills: Skill[];
    certifications: Certification[];
    projects: Project[];
}

class CVsRepository extends BaseRepository<CV> {
    constructor() {
        super('CV', []);
    }

    /**
     * Get CV by user ID.
     */
    getByUserId(userId: string): CV | undefined {
        return this.data.find(cv => cv.userId === userId);
    }

    /**
     * Check if user has a CV.
     */
    userHasCV(userId: string): boolean {
        return this.data.some(cv => cv.userId === userId);
    }
}

// Singleton instance
export const cvsRepository = new CVsRepository();

// Type export for creating CVs
export type CreateCVDto = Omit<CV, 'id' | 'createdAt' | 'updatedAt'>;
