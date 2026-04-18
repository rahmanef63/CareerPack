/**
 * Document Checklist feature types.
 */

import type { DocumentCategory, DocumentSubcategory } from '@/slices/shared/types';

export type { DocumentCategory, DocumentSubcategory };

export interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    category: DocumentCategory;
    subcategory: DocumentSubcategory;
    required: boolean;
    completed: boolean;
    dueDate?: string;
    notes?: string;
}
