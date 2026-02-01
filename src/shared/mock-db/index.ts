/**
 * Mock Database barrel export.
 * Provides access to all repositories from a single entry point.
 */

// Base utilities
export { generateId, getCurrentTimestamp, createEntity, BaseRepository } from './base-repository';

// Repositories
export { usersRepository, type User, type CreateUserDto } from './users';
export { cvsRepository, type CV, type CreateCVDto, type UserProfile, type Education, type Experience, type Skill, type Certification, type Project } from './cvs';
export { applicationsRepository, type Application, type CreateApplicationDto } from './applications';
export { checklistsRepository, type ChecklistItem, type CreateChecklistItemDto, defaultChecklistTemplate } from './checklists';
export { interviewSessionsRepository, type InterviewSession, type InterviewQuestion, type CreateInterviewSessionDto, interviewQuestionBank } from './interview-sessions';
export { chatSessionsRepository, type ChatSession, type ChatMessage, type CreateChatSessionDto } from './chat-sessions';
export { roadmapCategoriesRepository, type RoadmapCategory, type RoadmapNode, type RoadmapResource, type CreateRoadmapCategoryDto } from './roadmap-categories';
