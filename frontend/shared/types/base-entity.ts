/**
 * Base entity interface that all domain entities should extend.
 * Provides common fields for ID and timestamps.
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
