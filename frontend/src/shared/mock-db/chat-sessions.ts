/**
 * Chat Sessions mock database table.
 */

import type { BaseEntity, ChatRole } from '../types';
import { BaseRepository, generateId, getCurrentTimestamp } from './base-repository';

export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    timestamp: string;
}

export interface ChatSession extends BaseEntity {
    userId: string;
    title: string;
    messages: ChatMessage[];
}

class ChatSessionsRepository extends BaseRepository<ChatSession> {
    constructor() {
        super('ChatSession', []);
    }

    /**
     * Get sessions by user ID.
     */
    getByUserId(userId: string): ChatSession[] {
        return this.findBy('userId', userId);
    }

    /**
     * Add a message to a session.
     */
    addMessage(sessionId: string, role: ChatRole, content: string): ChatMessage | null {
        const session = this.data.find(s => s.id === sessionId);
        if (!session) return null;

        const message: ChatMessage = {
            id: generateId(),
            role,
            content,
            timestamp: getCurrentTimestamp(),
        };
        session.messages.push(message);
        session.updatedAt = getCurrentTimestamp();
        return message;
    }

    /**
     * Create a new chat session with initial message.
     */
    startSession(userId: string, initialMessage: string): ChatSession {
        const session = this.create({
            userId,
            title: initialMessage.substring(0, 50) + (initialMessage.length > 50 ? '...' : ''),
            messages: [{
                id: generateId(),
                role: 'user',
                content: initialMessage,
                timestamp: getCurrentTimestamp(),
            }],
        });
        return session.data;
    }
}

// Singleton instance
export const chatSessionsRepository = new ChatSessionsRepository();

export type CreateChatSessionDto = Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt'>;
