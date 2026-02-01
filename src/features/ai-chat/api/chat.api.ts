/**
 * AI Chat API.
 */

import { chatSessionsRepository, type ChatMessage } from '@/shared/mock-db';
import type { ChatSession, ChatRole } from '../types';

export async function getUserSessions(userId: string): Promise<ChatSession[]> {
    return chatSessionsRepository.getByUserId(userId) as ChatSession[];
}

export function startSession(userId: string, message: string): ChatSession {
    return chatSessionsRepository.startSession(userId, message) as ChatSession;
}

export function addMessage(sessionId: string, role: ChatRole, content: string): ChatMessage | null {
    return chatSessionsRepository.addMessage(sessionId, role, content);
}
