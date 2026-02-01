/**
 * Roadmap Categories mock database table.
 */

import type { BaseEntity, SkillDifficultyLevel, ResourceType } from '../types';
import { BaseRepository } from './base-repository';

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

export interface RoadmapCategory extends BaseEntity {
    name: string;
    icon: string;
    color: string;
    description: string;
    isActive: boolean;
    nodes: RoadmapNode[];
}

// Initial Indonesian roadmap categories
const initialCategories: RoadmapCategory[] = [
    {
        id: 'frontend',
        name: 'Frontend Development',
        icon: 'Layout',
        color: 'bg-blue-500',
        description: 'Pengembangan antarmuka web yang interaktif dan responsif',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        nodes: [],
    },
    {
        id: 'backend',
        name: 'Backend Development',
        icon: 'Server',
        color: 'bg-green-500',
        description: 'Pengembangan server, database, dan API',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        nodes: [],
    },
    {
        id: 'devops',
        name: 'DevOps',
        icon: 'Cloud',
        color: 'bg-purple-500',
        description: 'Otomasi deployment dan infrastruktur cloud',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        nodes: [],
    },
    {
        id: 'data',
        name: 'Data Science',
        icon: 'BarChart3',
        color: 'bg-orange-500',
        description: 'Analisis data, machine learning, dan AI',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        nodes: [],
    },
    {
        id: 'design',
        name: 'UI/UX Design',
        icon: 'Palette',
        color: 'bg-pink-500',
        description: 'Desain antarmuka dan pengalaman pengguna',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        nodes: [],
    },
    {
        id: 'mobile',
        name: 'Mobile Development',
        icon: 'Smartphone',
        color: 'bg-cyan-500',
        description: 'Pengembangan aplikasi iOS dan Android',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        nodes: [],
    },
    {
        id: 'digital-marketing',
        name: 'Digital Marketing',
        icon: 'TrendingUp',
        color: 'bg-red-500',
        description: 'Pemasaran digital, SEO, dan social media',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        nodes: [],
    },
    {
        id: 'accounting',
        name: 'Akuntansi & Keuangan',
        icon: 'Calculator',
        color: 'bg-emerald-600',
        description: 'Akuntansi, perpajakan, dan financial analysis',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        nodes: [],
    },
    {
        id: 'hr',
        name: 'Human Resources',
        icon: 'Users',
        color: 'bg-indigo-500',
        description: 'HR management, recruitment, dan employee relations',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        nodes: [],
    },
    {
        id: 'project-management',
        name: 'Project Management',
        icon: 'Kanban',
        color: 'bg-rose-500',
        description: 'Manajemen proyek, Agile, dan Scrum',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        nodes: [],
    },
];

class RoadmapCategoriesRepository extends BaseRepository<RoadmapCategory> {
    constructor() {
        super('RoadmapCategory', initialCategories);
    }

    /**
     * Get active categories only.
     */
    getActiveCategories(): RoadmapCategory[] {
        return this.data.filter(cat => cat.isActive);
    }

    /**
     * Toggle node completion status.
     */
    toggleNodeCompletion(categoryId: string, nodeId: string): boolean {
        const category = this.data.find(c => c.id === categoryId);
        if (!category) return false;

        const toggleNode = (nodes: RoadmapNode[]): boolean => {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    node.completed = !node.completed;
                    return true;
                }
                if (node.children && toggleNode(node.children)) {
                    return true;
                }
            }
            return false;
        };

        return toggleNode(category.nodes);
    }
}

// Singleton instance
export const roadmapCategoriesRepository = new RoadmapCategoriesRepository();

export type CreateRoadmapCategoryDto = Omit<RoadmapCategory, 'id' | 'createdAt' | 'updatedAt'>;
