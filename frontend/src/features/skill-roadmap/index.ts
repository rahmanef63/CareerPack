/**
 * Skill Roadmap feature barrel export.
 */

// Components
export { SkillRoadmap } from './components/SkillRoadmap';

// Types
export type { RoadmapCategory, RoadmapNode, RoadmapResource } from './types';

// API
export { getCategories, getCategoryById, toggleNodeCompletion } from './api/roadmap.api';

export * from './config';
export * from './manifest';
