/**
 * Base entity interface that all domain entities should extend.
 * Provides common fields for ID and timestamps.
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entity with only ID, for simpler entities that don't need timestamps.
 */
export interface IdentifiableEntity {
  id: string;
}

/**
 * Utility type to make all properties optional for update operations.
 */
export type PartialUpdate<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Utility type for creating new entities (without id and timestamps).
 */
export type CreateEntity<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
