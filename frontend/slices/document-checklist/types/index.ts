/**
 * Document Checklist feature types.
 */

import type { DocumentCategory, DocumentSubcategory } from '@/shared/types';

export type { DocumentCategory, DocumentSubcategory };

export interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    category: DocumentCategory;
    /** Not `DocumentSubcategory` — country templates bring their own
     *  vocabulary ("visa", "language", …) on this axis. */
    subcategory: string;
    required: boolean;
    completed: boolean;
    dueDate?: string;
    notes?: string;
}
