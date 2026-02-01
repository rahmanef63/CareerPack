/**
 * Auth API operations.
 * Uses mock-db for authentication and user management.
 */

import { usersRepository } from '@/shared/mock-db';
import type { AuthUser, LoginCredentials } from '../types';

/**
 * Authenticate user with email and password.
 * In a real app, this would validate against a backend.
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthUser | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = usersRepository.findByEmail(credentials.email);

    if (!user || !user.isActive) {
        return null;
    }

    // In demo mode, accept any password for existing users
    // In production, validate password hash
    usersRepository.updateLastLogin(user.id);

    return user as AuthUser;
}

/**
 * Demo login - creates a demo user session.
 */
export async function loginAsDemo(role: 'user' | 'admin' = 'user'): Promise<AuthUser> {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (role === 'admin') {
        const admin = usersRepository.findByEmail('admin@careerpack.id');
        if (admin) {
            usersRepository.updateLastLogin(admin.id);
            return admin as AuthUser;
        }
    }

    const demoUser = usersRepository.findByEmail('budi.santoso@email.com');
    if (demoUser) {
        usersRepository.updateLastLogin(demoUser.id);
        return demoUser as AuthUser;
    }

    throw new Error('Demo user not found');
}

/**
 * Logout - clear session.
 */
export function logoutUser(): void {
    // In real app, invalidate session token
    // For mock, we just clear local state
}
