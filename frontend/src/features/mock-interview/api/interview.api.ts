/**
 * Mock Interview API.
 */

import { interviewSessionsRepository, type CreateInterviewSessionDto } from '@/shared/mock-db';
import type { InterviewSession, InterviewQuestion, InterviewCategory } from '../types';

export async function getUserSessions(userId: string): Promise<InterviewSession[]> {
    await new Promise(r => setTimeout(r, 200));
    return interviewSessionsRepository.getByUserId(userId) as InterviewSession[];
}

export function getRandomQuestions(category?: InterviewCategory, count?: number): InterviewQuestion[] {
    return interviewSessionsRepository.getRandomQuestions(category, count);
}

export async function saveSession(data: CreateInterviewSessionDto): Promise<InterviewSession> {
    const result = interviewSessionsRepository.create(data);
    return result.data as InterviewSession;
}
