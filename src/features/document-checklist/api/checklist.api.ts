/**
 * Document Checklist API.
 */

import { checklistsRepository, type ChecklistItem } from '@/shared/mock-db';

export async function getUserChecklist(userId: string): Promise<ChecklistItem[]> {
    await new Promise(r => setTimeout(r, 200));
    return checklistsRepository.initializeForUser(userId);
}

export async function updateChecklistItem(
    id: string,
    updates: Partial<ChecklistItem>
): Promise<ChecklistItem> {
    const result = checklistsRepository.update(id, updates);
    return result.data;
}

export function getCompletionStats(userId: string) {
    return checklistsRepository.getCompletionStats(userId);
}
