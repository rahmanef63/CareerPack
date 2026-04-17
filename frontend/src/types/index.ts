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
} from '@/shared/types';

// Auth
export type {
    AuthUser as User,
    AuthState,
} from '@/features/auth/types';

// CV
export type {
    CVData,
    UserProfile,
    Education,
    Experience,
    Skill,
    Certification,
    Project,
} from '@/features/cv-generator/types';

// Skill roadmap
export type {
    RoadmapCategory,
    RoadmapNode,
    RoadmapResource as Resource,
} from '@/features/skill-roadmap/types';

// Document checklist
export type { ChecklistItem } from '@/features/document-checklist/types';

// Career dashboard
export type {
    Application,
    DashboardStats,
} from '@/features/career-dashboard/types';

// Mock interview
export type {
    InterviewQuestion,
    InterviewSession,
} from '@/features/mock-interview/types';

// Financial calculator
export type {
    FinancialData,
    CityCostOfLiving,
} from '@/features/financial-calculator/types';

// AI chat
export type {
    ChatMessage,
    ChatSession,
} from '@/features/ai-chat/types';

// Admin
export type { AdminStats } from '@/features/admin/types';
