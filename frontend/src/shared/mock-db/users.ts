/**
 * Users mock database table.
 */

import type { BaseEntity, UserRole } from '../types';
import { BaseRepository, getCurrentTimestamp } from './base-repository';

export interface User extends BaseEntity {
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
    lastLogin: string;
    isActive: boolean;
}

// Initial mock data
const mockUsers: User[] = [
    {
        id: 'admin-001',
        email: 'admin@careerpack.id',
        name: 'Admin CareerPack',
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        lastLogin: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'user-001',
        email: 'budi.santoso@email.com',
        name: 'Budi Santoso',
        role: 'user',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        lastLogin: new Date().toISOString(),
        isActive: true,
    },
];

class UsersRepository extends BaseRepository<User> {
    constructor() {
        super('User', mockUsers);
    }

    /**
     * Find user by email.
     */
    findByEmail(email: string): User | undefined {
        return this.data.find(user => user.email === email);
    }

    /**
     * Get all active users.
     */
    getActiveUsers(): User[] {
        return this.data.filter(user => user.isActive);
    }

    /**
     * Get users by role.
     */
    getByRole(role: UserRole): User[] {
        return this.findBy('role', role);
    }

    /**
     * Update user's last login.
     */
    updateLastLogin(id: string): void {
        const user = this.data.find(u => u.id === id);
        if (user) {
            user.lastLogin = getCurrentTimestamp();
            user.updatedAt = getCurrentTimestamp();
        }
    }
}

// Singleton instance
export const usersRepository = new UsersRepository();

// Type export for creating users
export type CreateUserDto = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
