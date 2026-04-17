/**
 * Career Dashboard API.
 */

import { applicationsRepository, type Application, type CreateApplicationDto } from '@/shared/mock-db';
import type { DashboardStats } from '../types';

export async function getUserApplications(userId: string): Promise<Application[]> {
    await new Promise(r => setTimeout(r, 200));
    return applicationsRepository.getByUserId(userId);
}

export async function createApplication(data: CreateApplicationDto): Promise<Application> {
    const result = applicationsRepository.create(data);
    return result.data;
}

export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    const result = applicationsRepository.update(id, updates);
    return result.data;
}

export function getDashboardStats(userId: string): DashboardStats {
    const stats = applicationsRepository.getUserStats(userId);
    return {
        totalApplications: stats.total,
        interviewsScheduled: stats.interview,
        offersReceived: stats.offer,
        responseRate: stats.total > 0 ? ((stats.interview + stats.offer) / stats.total) * 100 : 0,
        weeklyGoal: 10,
        weeklyProgress: Math.min(stats.total, 10),
    };
}
