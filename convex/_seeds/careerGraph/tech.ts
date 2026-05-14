/**
 * Tech-track seed for the Career Graph. Hand-curated for the
 * Indonesian labor market — probabilities reflect typical
 * progression observed at ID startups (jakarta-based, mix of
 * fintech / ecommerce / saas) circa 2025.
 *
 * Edit notes:
 *   - Probabilities are subjective priors; Phase 4's outcome
 *     calibrator will refine them as user telemetry accumulates.
 *   - Durations are *median* months; assume p25/p75 spread of ±40%.
 *   - sampleSize reflects confidence (50 = solid prior, 20 = rough
 *     estimate); BFS scoring already accounts for it.
 */

import type { SeniorityLevel } from "./types";

export interface SeedNode {
  slug: string;
  label: string;
  role: string;
  seniority: SeniorityLevel;
  salaryByeSector?: {
    fintech?: number;
    ecommerce?: number;
    saas?: number;
    enterprise?: number;
  };
  requiredSkills: string[];
  description?: string;
}

export interface SeedEdge {
  fromSlug: string;
  toSlug: string;
  probability: number;
  durationMonthsMedian: number;
  acquiredSkills: string[];
  sampleSize: number;
}

// ────────────────────────────────────────────────────────────────────
// NODES — ~30 canonical career states across the ID tech labor market
// ────────────────────────────────────────────────────────────────────

export const TECH_NODES: SeedNode[] = [
  // Frontend
  {
    slug: "fe-junior",
    label: "Junior Frontend Engineer",
    role: "Frontend Engineer",
    seniority: "junior",
    salaryByeSector: { fintech: 9_000_000, ecommerce: 8_500_000, saas: 11_000_000 },
    requiredSkills: ["HTML", "CSS", "JavaScript", "React"],
    description: "Implementasi komponen UI dari Figma, fix bug, fitur kecil di bawah supervisi senior.",
  },
  {
    slug: "fe-mid",
    label: "Mid Frontend Engineer",
    role: "Frontend Engineer",
    seniority: "mid",
    salaryByeSector: { fintech: 17_000_000, ecommerce: 15_000_000, saas: 22_000_000 },
    requiredSkills: ["TypeScript", "React", "State Management", "Testing"],
    description: "Memimpin satu feature end-to-end, code review junior, kontribusi component library.",
  },
  {
    slug: "fe-senior",
    label: "Senior Frontend Engineer",
    role: "Frontend Engineer",
    seniority: "senior",
    salaryByeSector: { fintech: 28_000_000, ecommerce: 25_000_000, saas: 38_000_000 },
    requiredSkills: ["TypeScript", "React", "Performance Optimization", "Design Systems", "Mentoring"],
    description: "Arsitek frontend produk, define standar, mentor 2-4 engineer.",
  },
  {
    slug: "fe-lead",
    label: "Frontend Tech Lead",
    role: "Frontend Engineer",
    seniority: "lead",
    salaryByeSector: { fintech: 40_000_000, ecommerce: 35_000_000, saas: 55_000_000 },
    requiredSkills: ["System Design", "Architecture Decisions", "Cross-team Coordination", "Leadership"],
  },

  // Backend
  {
    slug: "be-junior",
    label: "Junior Backend Engineer",
    role: "Backend Engineer",
    seniority: "junior",
    salaryByeSector: { fintech: 10_000_000, ecommerce: 9_000_000, saas: 12_000_000 },
    requiredSkills: ["SQL", "REST API", "Go atau Node.js", "Git"],
  },
  {
    slug: "be-mid",
    label: "Mid Backend Engineer",
    role: "Backend Engineer",
    seniority: "mid",
    salaryByeSector: { fintech: 18_000_000, ecommerce: 16_000_000, saas: 24_000_000 },
    requiredSkills: ["Database Design", "API Design", "Microservices", "Observability"],
  },
  {
    slug: "be-senior",
    label: "Senior Backend Engineer",
    role: "Backend Engineer",
    seniority: "senior",
    salaryByeSector: { fintech: 32_000_000, ecommerce: 28_000_000, saas: 42_000_000 },
    requiredSkills: ["System Design", "Distributed Systems", "Code Review", "Mentoring", "Reliability"],
  },
  {
    slug: "be-lead",
    label: "Backend Tech Lead",
    role: "Backend Engineer",
    seniority: "lead",
    salaryByeSector: { fintech: 45_000_000, ecommerce: 40_000_000, saas: 60_000_000 },
    requiredSkills: ["Architecture", "Capacity Planning", "Incident Response", "Cross-team Coordination"],
  },
  {
    slug: "be-staff",
    label: "Staff Backend Engineer",
    role: "Backend Engineer",
    seniority: "principal",
    salaryByeSector: { fintech: 65_000_000, ecommerce: 55_000_000, saas: 90_000_000 },
    requiredSkills: ["Org-wide Architecture", "Technical Strategy", "Cross-org Influence"],
  },

  // Full-stack
  {
    slug: "fs-mid",
    label: "Mid Full-stack Engineer",
    role: "Full-stack Engineer",
    seniority: "mid",
    salaryByeSector: { fintech: 19_000_000, ecommerce: 17_000_000, saas: 25_000_000 },
    requiredSkills: ["TypeScript", "React", "Node.js", "SQL", "REST API"],
  },
  {
    slug: "fs-senior",
    label: "Senior Full-stack Engineer",
    role: "Full-stack Engineer",
    seniority: "senior",
    salaryByeSector: { fintech: 33_000_000, ecommerce: 29_000_000, saas: 44_000_000 },
    requiredSkills: ["System Design", "End-to-end Feature Ownership", "Database Modeling"],
  },

  // Mobile
  {
    slug: "mobile-junior",
    label: "Junior Mobile Engineer",
    role: "Mobile Engineer",
    seniority: "junior",
    salaryByeSector: { fintech: 9_500_000, ecommerce: 9_000_000 },
    requiredSkills: ["Kotlin atau Swift", "REST API", "Mobile UI"],
  },
  {
    slug: "mobile-mid",
    label: "Mid Mobile Engineer",
    role: "Mobile Engineer",
    seniority: "mid",
    salaryByeSector: { fintech: 18_000_000, ecommerce: 16_000_000 },
    requiredSkills: ["Kotlin/Swift", "Architecture (MVVM/Clean)", "Offline-first", "App Store Submission"],
  },
  {
    slug: "mobile-senior",
    label: "Senior Mobile Engineer",
    role: "Mobile Engineer",
    seniority: "senior",
    salaryByeSector: { fintech: 30_000_000, ecommerce: 26_000_000 },
    requiredSkills: ["Performance Profiling", "CI/CD untuk Mobile", "Cross-platform Strategy"],
  },

  // Data Engineering
  {
    slug: "de-junior",
    label: "Junior Data Engineer",
    role: "Data Engineer",
    seniority: "junior",
    salaryByeSector: { fintech: 11_000_000, ecommerce: 10_000_000 },
    requiredSkills: ["SQL", "Python", "ETL Basics"],
  },
  {
    slug: "de-mid",
    label: "Mid Data Engineer",
    role: "Data Engineer",
    seniority: "mid",
    salaryByeSector: { fintech: 22_000_000, ecommerce: 19_000_000 },
    requiredSkills: ["Airflow", "Spark atau BigQuery", "Data Modeling", "Pipeline Reliability"],
  },
  {
    slug: "de-senior",
    label: "Senior Data Engineer",
    role: "Data Engineer",
    seniority: "senior",
    salaryByeSector: { fintech: 38_000_000, ecommerce: 32_000_000 },
    requiredSkills: ["Lakehouse Architecture", "Streaming (Kafka/Pulsar)", "Data Governance"],
  },

  // ML Engineering
  {
    slug: "ml-mid",
    label: "Mid ML Engineer",
    role: "ML Engineer",
    seniority: "mid",
    salaryByeSector: { fintech: 25_000_000, saas: 30_000_000 },
    requiredSkills: ["Python", "PyTorch atau TensorFlow", "Feature Engineering", "Model Serving"],
  },
  {
    slug: "ml-senior",
    label: "Senior ML Engineer",
    role: "ML Engineer",
    seniority: "senior",
    salaryByeSector: { fintech: 45_000_000, saas: 55_000_000 },
    requiredSkills: ["MLOps", "Experimentation Design", "Production Model Monitoring"],
  },

  // DevOps / SRE
  {
    slug: "devops-mid",
    label: "Mid DevOps / SRE",
    role: "DevOps Engineer",
    seniority: "mid",
    salaryByeSector: { fintech: 21_000_000, ecommerce: 18_000_000, saas: 26_000_000 },
    requiredSkills: ["Linux", "Docker", "Kubernetes", "CI/CD", "Terraform"],
  },
  {
    slug: "devops-senior",
    label: "Senior DevOps / SRE",
    role: "DevOps Engineer",
    seniority: "senior",
    salaryByeSector: { fintech: 36_000_000, ecommerce: 30_000_000, saas: 45_000_000 },
    requiredSkills: ["Observability Stack", "Incident Response", "Capacity Planning", "Cost Optimization"],
  },

  // QA
  {
    slug: "qa-mid",
    label: "Mid QA Engineer",
    role: "QA Engineer",
    seniority: "mid",
    salaryByeSector: { fintech: 14_000_000, ecommerce: 12_000_000 },
    requiredSkills: ["Test Strategy", "Automation (Playwright/Cypress)", "API Testing"],
  },
  {
    slug: "qa-senior",
    label: "Senior QA Engineer",
    role: "QA Engineer",
    seniority: "senior",
    salaryByeSector: { fintech: 24_000_000, ecommerce: 21_000_000 },
    requiredSkills: ["Performance Testing", "Security Testing", "QA Process Design"],
  },

  // Designer
  {
    slug: "design-junior",
    label: "Junior Product Designer",
    role: "Product Designer",
    seniority: "junior",
    salaryByeSector: { fintech: 9_000_000, ecommerce: 8_000_000 },
    requiredSkills: ["Figma", "Visual Design", "Prototyping"],
  },
  {
    slug: "design-mid",
    label: "Mid Product Designer",
    role: "Product Designer",
    seniority: "mid",
    salaryByeSector: { fintech: 17_000_000, ecommerce: 15_000_000, saas: 21_000_000 },
    requiredSkills: ["User Research", "Information Architecture", "Design Systems"],
  },
  {
    slug: "design-senior",
    label: "Senior Product Designer",
    role: "Product Designer",
    seniority: "senior",
    salaryByeSector: { fintech: 30_000_000, ecommerce: 26_000_000, saas: 38_000_000 },
    requiredSkills: ["Cross-functional Leadership", "Strategy", "Design Critique"],
  },

  // Product
  {
    slug: "pm-apm",
    label: "Associate Product Manager",
    role: "Product Manager",
    seniority: "junior",
    salaryByeSector: { fintech: 14_000_000, ecommerce: 12_000_000 },
    requiredSkills: ["User Research Basics", "Roadmap Planning", "Data Analysis"],
  },
  {
    slug: "pm-mid",
    label: "Product Manager",
    role: "Product Manager",
    seniority: "mid",
    salaryByeSector: { fintech: 28_000_000, ecommerce: 24_000_000, saas: 35_000_000 },
    requiredSkills: ["Product Discovery", "Stakeholder Management", "OKR Framework"],
  },
  {
    slug: "pm-senior",
    label: "Senior Product Manager",
    role: "Product Manager",
    seniority: "senior",
    salaryByeSector: { fintech: 45_000_000, ecommerce: 38_000_000, saas: 60_000_000 },
    requiredSkills: ["Strategy", "Cross-team Coordination", "Outcome Measurement"],
  },

  // Engineering Manager
  {
    slug: "em",
    label: "Engineering Manager",
    role: "Engineering Manager",
    seniority: "lead",
    salaryByeSector: { fintech: 48_000_000, ecommerce: 40_000_000, saas: 65_000_000 },
    requiredSkills: ["People Management", "Hiring", "1:1s", "Performance Reviews", "Roadmap Planning"],
  },
];

// ────────────────────────────────────────────────────────────────────
// EDGES — observed transitions in the ID tech labor market
// ────────────────────────────────────────────────────────────────────

export const TECH_EDGES: SeedEdge[] = [
  // Frontend track
  { fromSlug: "fe-junior", toSlug: "fe-mid", probability: 0.72, durationMonthsMedian: 18, acquiredSkills: ["TypeScript", "Testing", "State Management"], sampleSize: 80 },
  { fromSlug: "fe-mid", toSlug: "fe-senior", probability: 0.55, durationMonthsMedian: 24, acquiredSkills: ["Performance Optimization", "Design Systems", "Mentoring"], sampleSize: 60 },
  { fromSlug: "fe-senior", toSlug: "fe-lead", probability: 0.30, durationMonthsMedian: 30, acquiredSkills: ["Architecture Decisions", "Cross-team Coordination"], sampleSize: 40 },
  { fromSlug: "fe-senior", toSlug: "em", probability: 0.18, durationMonthsMedian: 18, acquiredSkills: ["People Management", "Hiring"], sampleSize: 35 },
  { fromSlug: "fe-mid", toSlug: "fs-mid", probability: 0.40, durationMonthsMedian: 12, acquiredSkills: ["Node.js", "SQL"], sampleSize: 45 },

  // Backend track
  { fromSlug: "be-junior", toSlug: "be-mid", probability: 0.75, durationMonthsMedian: 18, acquiredSkills: ["Database Design", "API Design", "Microservices"], sampleSize: 85 },
  { fromSlug: "be-mid", toSlug: "be-senior", probability: 0.55, durationMonthsMedian: 24, acquiredSkills: ["System Design", "Distributed Systems"], sampleSize: 60 },
  { fromSlug: "be-senior", toSlug: "be-lead", probability: 0.32, durationMonthsMedian: 30, acquiredSkills: ["Architecture", "Capacity Planning"], sampleSize: 35 },
  { fromSlug: "be-senior", toSlug: "be-staff", probability: 0.12, durationMonthsMedian: 36, acquiredSkills: ["Technical Strategy", "Cross-org Influence"], sampleSize: 25 },
  { fromSlug: "be-lead", toSlug: "be-staff", probability: 0.25, durationMonthsMedian: 24, acquiredSkills: ["Org-wide Architecture"], sampleSize: 20 },
  { fromSlug: "be-senior", toSlug: "em", probability: 0.22, durationMonthsMedian: 18, acquiredSkills: ["People Management", "Hiring"], sampleSize: 40 },
  { fromSlug: "be-mid", toSlug: "fs-mid", probability: 0.30, durationMonthsMedian: 12, acquiredSkills: ["React", "TypeScript"], sampleSize: 30 },
  { fromSlug: "be-mid", toSlug: "devops-mid", probability: 0.18, durationMonthsMedian: 18, acquiredSkills: ["Kubernetes", "CI/CD", "Terraform"], sampleSize: 25 },
  { fromSlug: "be-mid", toSlug: "de-mid", probability: 0.15, durationMonthsMedian: 18, acquiredSkills: ["Airflow", "Data Modeling"], sampleSize: 20 },

  // Full-stack track
  { fromSlug: "fs-mid", toSlug: "fs-senior", probability: 0.50, durationMonthsMedian: 24, acquiredSkills: ["System Design", "End-to-end Feature Ownership"], sampleSize: 40 },
  { fromSlug: "fs-senior", toSlug: "em", probability: 0.20, durationMonthsMedian: 18, acquiredSkills: ["People Management"], sampleSize: 25 },
  { fromSlug: "fs-senior", toSlug: "be-lead", probability: 0.15, durationMonthsMedian: 24, acquiredSkills: ["Architecture"], sampleSize: 15 },

  // Mobile track
  { fromSlug: "mobile-junior", toSlug: "mobile-mid", probability: 0.70, durationMonthsMedian: 18, acquiredSkills: ["Architecture (MVVM/Clean)", "Offline-first"], sampleSize: 50 },
  { fromSlug: "mobile-mid", toSlug: "mobile-senior", probability: 0.50, durationMonthsMedian: 24, acquiredSkills: ["Performance Profiling", "CI/CD untuk Mobile"], sampleSize: 30 },
  { fromSlug: "mobile-senior", toSlug: "em", probability: 0.18, durationMonthsMedian: 18, acquiredSkills: ["People Management"], sampleSize: 15 },

  // Data Engineering track
  { fromSlug: "de-junior", toSlug: "de-mid", probability: 0.70, durationMonthsMedian: 18, acquiredSkills: ["Airflow", "Spark atau BigQuery", "Data Modeling"], sampleSize: 40 },
  { fromSlug: "de-mid", toSlug: "de-senior", probability: 0.50, durationMonthsMedian: 24, acquiredSkills: ["Lakehouse Architecture", "Streaming (Kafka/Pulsar)"], sampleSize: 25 },
  { fromSlug: "de-mid", toSlug: "ml-mid", probability: 0.22, durationMonthsMedian: 18, acquiredSkills: ["PyTorch atau TensorFlow", "Feature Engineering"], sampleSize: 20 },

  // ML track
  { fromSlug: "ml-mid", toSlug: "ml-senior", probability: 0.48, durationMonthsMedian: 24, acquiredSkills: ["MLOps", "Experimentation Design"], sampleSize: 18 },

  // DevOps track
  { fromSlug: "devops-mid", toSlug: "devops-senior", probability: 0.50, durationMonthsMedian: 24, acquiredSkills: ["Observability Stack", "Incident Response", "Capacity Planning"], sampleSize: 25 },
  { fromSlug: "devops-senior", toSlug: "em", probability: 0.20, durationMonthsMedian: 18, acquiredSkills: ["People Management"], sampleSize: 15 },

  // QA track
  { fromSlug: "qa-mid", toSlug: "qa-senior", probability: 0.55, durationMonthsMedian: 20, acquiredSkills: ["Performance Testing", "Security Testing"], sampleSize: 30 },
  { fromSlug: "qa-mid", toSlug: "be-mid", probability: 0.18, durationMonthsMedian: 24, acquiredSkills: ["Database Design", "API Design"], sampleSize: 15 },

  // Designer track
  { fromSlug: "design-junior", toSlug: "design-mid", probability: 0.68, durationMonthsMedian: 18, acquiredSkills: ["User Research", "Information Architecture", "Design Systems"], sampleSize: 35 },
  { fromSlug: "design-mid", toSlug: "design-senior", probability: 0.45, durationMonthsMedian: 24, acquiredSkills: ["Strategy", "Cross-functional Leadership"], sampleSize: 25 },
  { fromSlug: "design-senior", toSlug: "pm-mid", probability: 0.12, durationMonthsMedian: 24, acquiredSkills: ["Product Discovery", "Roadmap Planning"], sampleSize: 10 },

  // Product track
  { fromSlug: "pm-apm", toSlug: "pm-mid", probability: 0.65, durationMonthsMedian: 18, acquiredSkills: ["Product Discovery", "Stakeholder Management", "OKR Framework"], sampleSize: 40 },
  { fromSlug: "pm-mid", toSlug: "pm-senior", probability: 0.42, durationMonthsMedian: 24, acquiredSkills: ["Strategy", "Cross-team Coordination", "Outcome Measurement"], sampleSize: 30 },

  // Engineering → Product crossover (rarer)
  { fromSlug: "fe-senior", toSlug: "pm-mid", probability: 0.08, durationMonthsMedian: 24, acquiredSkills: ["Product Discovery", "Stakeholder Management"], sampleSize: 12 },
  { fromSlug: "be-senior", toSlug: "pm-mid", probability: 0.10, durationMonthsMedian: 24, acquiredSkills: ["Product Discovery"], sampleSize: 15 },
];
