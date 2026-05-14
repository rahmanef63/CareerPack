/**
 * Shared types for career-graph seed data — kept in their own file
 * so domain-specific seed modules (`tech.ts`, future `business.ts`,
 * `creative.ts`) can import without circular references.
 */
export type SeniorityLevel =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "principal";
