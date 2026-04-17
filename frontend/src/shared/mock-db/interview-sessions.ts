/**
 * Interview Sessions mock database table.
 */

import type { BaseEntity, InterviewCategory, DifficultyLevel } from '../types';
import { BaseRepository } from './base-repository';

export interface InterviewQuestion {
    id: string;
    question: string;
    category: InterviewCategory;
    difficulty: DifficultyLevel;
    tips: string[];
    sampleAnswer?: string;
}

export interface InterviewSession extends BaseEntity {
    userId: string;
    date: string;
    category: InterviewCategory;
    questions: InterviewQuestion[];
    score?: number;
    feedback?: string;
}

// Default interview question bank (Indonesian)
export const interviewQuestionBank: Omit<InterviewQuestion, 'id'>[] = [
    { question: 'Ceritakan tentang diri Anda.', category: 'behavioral', difficulty: 'easy', tips: ['Fokus pada pengalaman profesional', 'Sebutkan pencapaian relevan'] },
    { question: 'Apa kelebihan terbesar Anda?', category: 'behavioral', difficulty: 'easy', tips: ['Pilih kelebihan yang relevan', 'Berikan contoh konkret'] },
    { question: 'Apa kekurangan Anda?', category: 'behavioral', difficulty: 'medium', tips: ['Pilih kekurangan nyata', 'Tunjukkan upaya perbaikan'] },
    { question: 'Mengapa Anda ingin bekerja di perusahaan kami?', category: 'company-specific', difficulty: 'medium', tips: ['Riset perusahaan dengan baik', 'Hubungkan dengan nilai pribadi'] },
    { question: 'Ceritakan pengalaman menghadapi tantangan di tempat kerja.', category: 'behavioral', difficulty: 'medium', tips: ['Gunakan metode STAR', 'Fokus pada tindakan Anda'] },
    { question: 'Di mana Anda melihat diri Anda dalam 5 tahun?', category: 'behavioral', difficulty: 'medium', tips: ['Tunjukkan ambisi', 'Realistis'] },
    { question: 'Mengapa kami harus mempekerjakan Anda?', category: 'behavioral', difficulty: 'hard', tips: ['Cocokkan skill dengan requirement', 'Percaya diri tapi tidak arogan'] },
    { question: 'Berapa ekspektasi gaji Anda?', category: 'behavioral', difficulty: 'hard', tips: ['Riset market rate', 'Berikan range'] },
    { question: 'Bagaimana Anda menangani tekanan?', category: 'situational', difficulty: 'medium', tips: ['Berikan contoh spesifik', 'Tunjukkan strategi coping'] },
    { question: 'Jelaskan konsep teknis kompleks ke orang non-teknis.', category: 'technical', difficulty: 'medium', tips: ['Gunakan analogi', 'Hindari jargon'] },
];

class InterviewSessionsRepository extends BaseRepository<InterviewSession> {
    constructor() {
        super('InterviewSession', []);
    }

    /**
     * Get sessions by user ID.
     */
    getByUserId(userId: string): InterviewSession[] {
        return this.findBy('userId', userId);
    }

    /**
     * Get sessions by category.
     */
    getByCategory(userId: string, category: InterviewCategory): InterviewSession[] {
        return this.data.filter(s => s.userId === userId && s.category === category);
    }

    /**
     * Get random questions for a practice session.
     */
    getRandomQuestions(category?: InterviewCategory, count: number = 5): InterviewQuestion[] {
        let pool = [...interviewQuestionBank];
        if (category) {
            pool = pool.filter(q => q.category === category);
        }

        // Shuffle and take count
        const shuffled = pool.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map((q, i) => ({
            ...q,
            id: `q-${Date.now()}-${i}`,
        }));
    }
}

// Singleton instance
export const interviewSessionsRepository = new InterviewSessionsRepository();

export type CreateInterviewSessionDto = Omit<InterviewSession, 'id' | 'createdAt' | 'updatedAt'>;
