/**
 * Generic CRUD Repository for mock database operations.
 * Provides type-safe CRUD operations that can be extended by feature-specific repositories.
 */

import type {
    BaseEntity,
    CreateEntity,
    PartialUpdate,
    ApiResponse,
    ApiListResponse,
    QueryParams
} from '../types';

/**
 * Generate a unique ID for new entities.
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Get current ISO timestamp.
 */
export function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Create a new entity with generated ID and timestamps.
 */
export function createEntity<T extends BaseEntity>(data: CreateEntity<T>): T {
    return {
        ...data,
        id: generateId(),
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
    } as T;
}

/**
 * Generic repository class for CRUD operations.
 * @template T - The entity type extending BaseEntity
 */
export class BaseRepository<T extends BaseEntity> {
    protected data: T[] = [];
    protected tableName: string;

    constructor(tableName: string, initialData: T[] = []) {
        this.tableName = tableName;
        this.data = [...initialData];
    }

    /**
     * Get all entities with optional filtering, sorting, and pagination.
     */
    getAll(params?: QueryParams<T>): ApiListResponse<T> {
        let result = [...this.data];

        // Apply filtering
        if (params?.filter) {
            result = result.filter(item => {
                return Object.entries(params.filter!).every(([key, value]) => {
                    if (value === undefined || value === null) return true;
                    return item[key as keyof T] === value;
                });
            });
        }

        // Apply sorting
        if (params?.sortBy) {
            const sortOrder = params.sortOrder === 'desc' ? -1 : 1;
            result.sort((a, b) => {
                const aVal = a[params.sortBy!];
                const bVal = b[params.sortBy!];
                if (aVal < bVal) return -1 * sortOrder;
                if (aVal > bVal) return 1 * sortOrder;
                return 0;
            });
        }

        const total = result.length;
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? total;
        const totalPages = Math.ceil(total / pageSize);

        // Apply pagination
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        result = result.slice(start, end);

        return {
            data: result,
            total,
            page,
            pageSize,
            totalPages,
        };
    }

    /**
     * Get a single entity by ID.
     */
    getById(id: string): ApiResponse<T | null> {
        const item = this.data.find(entity => entity.id === id) ?? null;
        return {
            data: item,
            success: item !== null,
            message: item ? undefined : `${this.tableName} not found`,
        };
    }

    /**
     * Create a new entity.
     */
    create(data: CreateEntity<T>): ApiResponse<T> {
        const newEntity = createEntity<T>(data);
        this.data.push(newEntity);
        return {
            data: newEntity,
            success: true,
            message: `${this.tableName} created successfully`,
        };
    }

    /**
     * Update an existing entity.
     */
    update(id: string, data: PartialUpdate<T>): ApiResponse<T> {
        const index = this.data.findIndex(entity => entity.id === id);
        if (index === -1) {
            return {
                data: null as unknown as T,
                success: false,
                message: `${this.tableName} not found`,
            };
        }

        const updated = {
            ...this.data[index],
            ...data,
            updatedAt: getCurrentTimestamp(),
        };
        this.data[index] = updated;
        return {
            data: updated,
            success: true,
            message: `${this.tableName} updated successfully`,
        };
    }

    /**
     * Delete an entity by ID.
     */
    delete(id: string): ApiResponse<boolean> {
        const index = this.data.findIndex(entity => entity.id === id);
        if (index === -1) {
            return {
                data: false,
                success: false,
                message: `${this.tableName} not found`,
            };
        }

        this.data.splice(index, 1);
        return {
            data: true,
            success: true,
            message: `${this.tableName} deleted successfully`,
        };
    }

    /**
     * Find entities by a specific field value.
     */
    findBy<K extends keyof T>(field: K, value: T[K]): T[] {
        return this.data.filter(entity => entity[field] === value);
    }

    /**
     * Check if an entity exists.
     */
    exists(id: string): boolean {
        return this.data.some(entity => entity.id === id);
    }

    /**
     * Get the count of all entities.
     */
    count(): number {
        return this.data.length;
    }

    /**
     * Reset the repository with new data (useful for testing).
     */
    reset(data: T[] = []): void {
        this.data = [...data];
    }
}
