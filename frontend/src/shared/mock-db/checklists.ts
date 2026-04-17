/**
 * Checklists mock database table.
 */

import type { BaseEntity, DocumentCategory, DocumentSubcategory } from '../types';
import { BaseRepository } from './base-repository';

export interface ChecklistItem extends BaseEntity {
    userId: string;
    title: string;
    description: string;
    category: DocumentCategory;
    subcategory: DocumentSubcategory;
    required: boolean;
    completed: boolean;
    dueDate?: string;
    notes?: string;
}

// Default checklist template (Indonesian documents)
export const defaultChecklistTemplate: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>[] = [
    // Local documents
    { title: 'KTP (Kartu Tanda Penduduk)', description: 'Kartu identitas warga negara Indonesia', category: 'local', subcategory: 'identity', required: true, completed: false },
    { title: 'NPWP', description: 'Nomor Pokok Wajib Pajak', category: 'local', subcategory: 'identity', required: true, completed: false },
    { title: 'Ijazah & Transkrip Nilai', description: 'Ijazah terakhir dan transkrip nilai akademik', category: 'local', subcategory: 'education', required: true, completed: false },
    { title: 'SKCK', description: 'Surat Keterangan Catatan Kepolisian', category: 'local', subcategory: 'identity', required: true, completed: false },
    { title: 'BPJS Kesehatan & Ketenagakerjaan', description: 'Kartu BPJS aktif', category: 'local', subcategory: 'health', required: true, completed: false },
    { title: 'Kartu Keluarga', description: 'Dokumen keluarga', category: 'local', subcategory: 'identity', required: true, completed: false },
    // International documents
    { title: 'Paspor', description: 'Paspor dengan masa berlaku minimal 6 bulan', category: 'international', subcategory: 'travel', required: true, completed: false },
    { title: 'Sertifikat IELTS/TOEFL', description: 'Sertifikat kemampuan bahasa Inggris', category: 'international', subcategory: 'professional', required: true, completed: false },
    { title: 'Visa Kerja', description: 'Visa pekerjaan untuk negara tujuan', category: 'international', subcategory: 'travel', required: true, completed: false },
    { title: 'Medical Check-up', description: 'Surat keterangan sehat', category: 'international', subcategory: 'health', required: true, completed: false },
];

class ChecklistsRepository extends BaseRepository<ChecklistItem> {
    constructor() {
        super('ChecklistItem', []);
    }

    /**
     * Get checklist items by user ID.
     */
    getByUserId(userId: string): ChecklistItem[] {
        return this.findBy('userId', userId);
    }

    /**
     * Get checklist items by category.
     */
    getByCategory(userId: string, category: DocumentCategory): ChecklistItem[] {
        return this.data.filter(item => item.userId === userId && item.category === category);
    }

    /**
     * Get completion stats for a user.
     */
    getCompletionStats(userId: string) {
        const items = this.getByUserId(userId);
        const completed = items.filter(i => i.completed).length;
        return {
            total: items.length,
            completed,
            percentage: items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
        };
    }

    /**
     * Initialize default checklist for a user.
     */
    initializeForUser(userId: string): ChecklistItem[] {
        const existingItems = this.getByUserId(userId);
        if (existingItems.length > 0) return existingItems;

        const items = defaultChecklistTemplate.map(template => {
            const result = this.create({ ...template, userId });
            return result.data;
        });
        return items;
    }
}

// Singleton instance
export const checklistsRepository = new ChecklistsRepository();

export type CreateChecklistItemDto = Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>;
