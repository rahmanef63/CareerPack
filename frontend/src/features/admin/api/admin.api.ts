/**
 * Admin API.
 */

import { usersRepository, cvsRepository, applicationsRepository } from '@/shared/mock-db';
import type { AdminStats } from '../types';

export function getAdminStats(): AdminStats {
    return {
        totalUsers: usersRepository.count(),
        activeUsers: usersRepository.getActiveUsers().length,
        totalCVs: cvsRepository.count(),
        totalApplications: applicationsRepository.count(),
        aiUsage: {
            totalRequests: 1250,
            totalTokens: 450000,
            lastMonth: 320,
        },
    };
}
