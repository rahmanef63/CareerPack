/**
 * Career Dashboard feature types.
 */

import type { ApplicationStatus, Application } from '@/shared/types';

export type { ApplicationStatus, Application };

export interface DashboardStats {
    totalApplications: number;
    interviewsScheduled: number;
    offersReceived: number;
    responseRate: number;
    weeklyGoal: number;
    weeklyProgress: number;
}
