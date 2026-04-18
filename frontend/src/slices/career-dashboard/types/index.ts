/**
 * Career Dashboard feature types.
 */

import type { ApplicationStatus } from '@/shared/types';

export type { ApplicationStatus };

export interface Application {
    id: string;
    company: string;
    position: string;
    status: ApplicationStatus;
    appliedDate: string;
    lastUpdate: string;
    notes?: string;
    link?: string;
    salary?: string;
}

export interface DashboardStats {
    totalApplications: number;
    interviewsScheduled: number;
    offersReceived: number;
    responseRate: number;
    weeklyGoal: number;
    weeklyProgress: number;
}
