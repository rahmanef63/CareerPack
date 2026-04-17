/**
 * Applications mock database table.
 */

import type { BaseEntity, ApplicationStatus } from '../types';
import { BaseRepository } from './base-repository';

export interface Application extends BaseEntity {
    userId: string;
    company: string;
    position: string;
    status: ApplicationStatus;
    appliedDate: string;
    lastUpdate: string;
    notes?: string;
}

class ApplicationsRepository extends BaseRepository<Application> {
    constructor() {
        super('Application', []);
    }

    /**
     * Get applications by user ID.
     */
    getByUserId(userId: string): Application[] {
        return this.findBy('userId', userId);
    }

    /**
     * Get applications by status.
     */
    getByStatus(status: ApplicationStatus): Application[] {
        return this.findBy('status', status);
    }

    /**
     * Get user's applications by status.
     */
    getUserApplicationsByStatus(userId: string, status: ApplicationStatus): Application[] {
        return this.data.filter(app => app.userId === userId && app.status === status);
    }

    /**
     * Get application statistics for a user.
     */
    getUserStats(userId: string) {
        const userApps = this.getByUserId(userId);
        return {
            total: userApps.length,
            applied: userApps.filter(a => a.status === 'applied').length,
            screening: userApps.filter(a => a.status === 'screening').length,
            interview: userApps.filter(a => a.status === 'interview').length,
            offer: userApps.filter(a => a.status === 'offer').length,
            rejected: userApps.filter(a => a.status === 'rejected').length,
        };
    }
}

// Singleton instance
export const applicationsRepository = new ApplicationsRepository();

// Type export
export type CreateApplicationDto = Omit<Application, 'id' | 'createdAt' | 'updatedAt'>;
