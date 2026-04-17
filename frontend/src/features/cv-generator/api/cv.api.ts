/**
 * CV Generator API operations.
 */

import { cvsRepository, type CV, type CreateCVDto } from '@/shared/mock-db';
import type { CVData } from '../types';

/**
 * Get CV for a user.
 */
export async function getUserCV(userId: string): Promise<CVData | null> {
    await new Promise(r => setTimeout(r, 200));
    const cv = cvsRepository.getByUserId(userId);
    if (!cv) return null;
    return {
        profile: cv.profile,
        education: cv.education,
        experience: cv.experience,
        skills: cv.skills,
        certifications: cv.certifications,
        projects: cv.projects,
    };
}

/**
 * Save or update CV for a user.
 */
export async function saveCV(userId: string, cvData: CVData): Promise<CV> {
    await new Promise(r => setTimeout(r, 300));

    const existingCV = cvsRepository.getByUserId(userId);

    const cvRecord: CreateCVDto = {
        userId,
        profile: cvData.profile,
        education: cvData.education,
        experience: cvData.experience,
        skills: cvData.skills,
        certifications: cvData.certifications,
        projects: cvData.projects,
    };

    if (existingCV) {
        const result = cvsRepository.update(existingCV.id, cvRecord);
        return result.data;
    }

    const result = cvsRepository.create(cvRecord);
    return result.data;
}

/**
 * Delete CV.
 */
export async function deleteCV(cvId: string): Promise<boolean> {
    const result = cvsRepository.delete(cvId);
    return result.success;
}
