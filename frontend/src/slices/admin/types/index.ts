/**
 * Admin feature types.
 */

export type { AIConfig } from '@/slices/shared/types';

export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    totalCVs: number;
    totalApplications: number;
    aiUsage: {
        totalRequests: number;
        totalTokens: number;
        lastMonth: number;
    };
}
