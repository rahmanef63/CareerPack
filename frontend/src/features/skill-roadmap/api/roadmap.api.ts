/**
 * Skill Roadmap API operations.
 */

import { roadmapCategoriesRepository, type RoadmapCategory } from '@/shared/mock-db';

/**
 * Get all active roadmap categories.
 */
export async function getCategories(): Promise<RoadmapCategory[]> {
    await new Promise(r => setTimeout(r, 200));
    return roadmapCategoriesRepository.getActiveCategories();
}

/**
 * Get category by ID.
 */
export async function getCategoryById(id: string): Promise<RoadmapCategory | null> {
    const result = roadmapCategoriesRepository.getById(id);
    return result.data;
}

/**
 * Toggle node completion.
 */
export async function toggleNodeCompletion(categoryId: string, nodeId: string): Promise<boolean> {
    return roadmapCategoriesRepository.toggleNodeCompletion(categoryId, nodeId);
}
