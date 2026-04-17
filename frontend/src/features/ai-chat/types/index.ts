/**
 * AI Chat feature types.
 */

import type { ChatRole } from '@/shared/types';

export type { ChatRole };

export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}
