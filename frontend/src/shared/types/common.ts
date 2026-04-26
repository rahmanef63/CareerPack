/**
 * Common types and enums used across multiple features.
 */

// User & Auth — must stay aligned with convex/schema.ts userProfiles.role union.
export type UserRole = 'user' | 'admin' | 'moderator';

// Experience levels
export type ExperienceLevel = 'fresh-graduate' | 'entry-level' | 'mid-level' | 'senior';

// Skill categories
export type SkillCategory = 'technical' | 'soft' | 'language' | 'tool';

// Proficiency levels (1-5)
export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;

// Difficulty levels
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type SkillDifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Application status
export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

// Document categories
export type DocumentCategory = 'local' | 'international';
export type DocumentSubcategory = 'identity' | 'education' | 'professional' | 'financial' | 'health' | 'travel';

// Interview categories
export type InterviewCategory = 'behavioral' | 'technical' | 'situational' | 'company-specific';

// Resource types
export type ResourceType = 'video' | 'article' | 'course' | 'book' | 'practice';

// Chat roles
export type ChatRole = 'user' | 'assistant' | 'system';

// Market trends
export type DemandTrend = 'increasing' | 'stable' | 'decreasing';

// AI providers
export type AIProvider = 'zai' | 'openai' | 'custom';

export interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
    isEnabled: boolean;
}

/**
 * Common value objects
 */
export interface SalaryRange {
    min: number;
    max: number;
    median: number;
}

export interface DateRange {
    startDate: string;
    endDate?: string;
}

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
