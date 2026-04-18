/**
 * Skill Roadmap feature types.
 */

import type { SkillDifficultyLevel, ResourceType } from '@/slices/shared/types';

export type { SkillDifficultyLevel, ResourceType };

export interface RoadmapResource {
    id: string;
    title: string;
    type: ResourceType;
    url: string;
    free: boolean;
}

export interface RoadmapNode {
    id: string;
    title: string;
    description: string;
    difficulty: SkillDifficultyLevel;
    estimatedHours: number;
    resources: RoadmapResource[];
    prerequisites: string[];
    completed: boolean;
    order: number;
    children?: RoadmapNode[];
}

export interface RoadmapCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    isActive: boolean;
    nodes: RoadmapNode[];
}
