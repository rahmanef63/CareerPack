/**
 * AI chat types — shared contract for the AI assistant feature set
 * (currently consumed by AIAgentConsole and the admin mock generator).
 */

import type { ChatRole } from "./common";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
