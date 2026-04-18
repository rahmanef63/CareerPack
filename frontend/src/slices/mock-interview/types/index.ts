/**
 * Mock Interview feature types.
 */

import type { InterviewCategory, DifficultyLevel } from '@/slices/shared/types';

export type { InterviewCategory, DifficultyLevel };

export interface InterviewQuestion {
    id: string;
    question: string;
    category: InterviewCategory;
    difficulty: DifficultyLevel;
    tips: string[];
    sampleAnswer?: string;
}

export interface InterviewSession {
    id: string;
    date: string;
    category: InterviewCategory;
    questions: InterviewQuestion[];
    score?: number;
    feedback?: string;
}
