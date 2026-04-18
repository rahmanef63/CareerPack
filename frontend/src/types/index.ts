/**
 * Legacy types barrel — re-exports canonical types from feature/shared modules.
 *
 * SSOT: each type has exactly one definition site. This file only aliases for
 * back-compat with consumers using `@/types`. Prefer importing from the
 * canonical source (feature module or `@/shared/types`) in new code.
 */

// Shared primitives
export type {
    UserRole,
    AIProvider,
    AIConfig,
    ApplicationStatus,
    ChatRole,
    DemandTrend,
    DifficultyLevel,
    SkillDifficultyLevel,
    DocumentCategory,
    DocumentSubcategory,
    InterviewCategory,
    ResourceType,
    SkillCategory,
    ProficiencyLevel,
    ExperienceLevel,
} from '@/slices/shared/types';

// Auth
export type {
    AuthUser as User,
    AuthState,
} from '@/slices/shared/types/auth';

// CV
export type {
    CVData,
    UserProfile,
    Education,
    Experience,
    Skill,
    Certification,
    Project,
} from '@/slices/cv-generator/types';

// Skill roadmap
export type {
    RoadmapCategory,
    RoadmapNode,
    RoadmapResource as Resource,
} from '@/slices/skill-roadmap/types';

// Document checklist
export type { ChecklistItem } from '@/slices/document-checklist/types';

// Career dashboard
export type {
    Application,
    DashboardStats,
} from '@/slices/career-dashboard/types';

// Mock interview
export type {
    InterviewQuestion,
    InterviewSession,
} from '@/slices/mock-interview/types';

// Financial calculator
export type {
    FinancialData,
    CityCostOfLiving,
} from '@/slices/financial-calculator/types';

// AI chat (shared contract; ai-chat slice was superseded by ai-agent)
export type {
    ChatMessage,
    ChatSession,
} from '@/slices/shared/types/chat';

// Admin
export type { AdminStats } from '@/slices/admin/types';
