/**
 * Features barrel export.
 * Provides centralized access to all feature modules.
 */

// Auth
export { AuthProvider, useAuth, LoginPage } from './auth';
export type { AuthUser, AuthState } from './auth';

// CV Generator
export type { CVData, UserProfile, Education, Experience, Skill } from './cv-generator';
export { getUserCV, saveCV } from './cv-generator';

// Skill Roadmap
export type { RoadmapCategory, RoadmapNode } from './skill-roadmap';
export { getCategories, toggleNodeCompletion } from './skill-roadmap';

// Document Checklist
export type { ChecklistItem } from './document-checklist';
export { getUserChecklist, updateChecklistItem } from './document-checklist';

// Career Dashboard
export type { Application, DashboardStats } from './career-dashboard';
export { getUserApplications, getDashboardStats } from './career-dashboard';

// Mock Interview
export type { InterviewSession, InterviewQuestion } from './mock-interview';
export { getRandomQuestions, saveSession } from './mock-interview';

// Financial Calculator
export type { FinancialData, CityCostOfLiving } from './financial-calculator';
export { cityCostData } from './financial-calculator';

// AI Chat
export type { ChatMessage, ChatSession } from './ai-chat';
export { startSession, addMessage } from './ai-chat';

// Admin
export type { AdminStats, AIConfig } from './admin';
export { getAdminStats } from './admin';
