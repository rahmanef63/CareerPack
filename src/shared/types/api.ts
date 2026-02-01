/**
 * Generic API response types for CRUD operations.
 */

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

export interface ApiListResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

/**
 * Pagination parameters for list queries.
 */
export interface PaginationParams {
    page?: number;
    pageSize?: number;
}

/**
 * Sort parameters for list queries.
 */
export interface SortParams<T> {
    sortBy?: keyof T;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Combined query parameters.
 */
export interface QueryParams<T> extends PaginationParams, SortParams<T> {
    filter?: Partial<T>;
}

/**
 * CRUD operation types for API functions.
 */
export interface CrudOperations<T, CreateDto = Omit<T, 'id'>, UpdateDto = Partial<T>> {
    getAll: (params?: QueryParams<T>) => Promise<ApiListResponse<T>>;
    getById: (id: string) => Promise<ApiResponse<T | null>>;
    create: (data: CreateDto) => Promise<ApiResponse<T>>;
    update: (id: string, data: UpdateDto) => Promise<ApiResponse<T>>;
    delete: (id: string) => Promise<ApiResponse<boolean>>;
}
