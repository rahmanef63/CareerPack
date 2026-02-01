// User & Auth Types
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// AI Configuration Types
export interface AIConfig {
  provider: 'zai' | 'openai' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isEnabled: boolean;
}

// User Profile Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  targetIndustry: string;
  experienceLevel: 'fresh-graduate' | 'entry-level' | 'mid-level' | 'senior';
}

// CV Types
export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'tool';
  proficiency: 1 | 2 | 3 | 4 | 5;
}

export interface CVData {
  profile: UserProfile;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  certifications: Certification[];
  projects: Project[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

// Roadmap Types - Dynamic
export interface RoadmapCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapNode {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  resources: Resource[];
  prerequisites: string[];
  completed: boolean;
  order: number;
  children?: RoadmapNode[];
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'course' | 'book' | 'practice';
  url: string;
  free: boolean;
}

// Checklist Types
export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'local' | 'international';
  subcategory: 'identity' | 'education' | 'professional' | 'financial' | 'health' | 'travel';
  required: boolean;
  completed: boolean;
  dueDate?: string;
  notes?: string;
}

// Dashboard Types
export interface Application {
  id: string;
  company: string;
  position: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedDate: string;
  lastUpdate: string;
  notes?: string;
}

export interface DashboardStats {
  totalApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  responseRate: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

// Interview Types
export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'behavioral' | 'technical' | 'situational' | 'company-specific';
  difficulty: 'easy' | 'medium' | 'hard';
  tips: string[];
  sampleAnswer?: string;
}

export interface InterviewSession {
  id: string;
  date: string;
  category: string;
  questions: InterviewQuestion[];
  score?: number;
  feedback?: string;
}

// Job Market Types
export interface JobMarketData {
  industry: string;
  position: string;
  salaryRange: {
    min: number;
    max: number;
    median: number;
  };
  location: string;
  demandTrend: 'increasing' | 'stable' | 'decreasing';
  topSkills: string[];
}

// Calculator Types
export interface FinancialData {
  monthlyIncome: number;
  monthlyExpenses: {
    housing: number;
    food: number;
    transportation: number;
    utilities: number;
    entertainment: number;
    others: number;
  };
  savings: number;
  targetCity: string;
}

export interface CityCostOfLiving {
  name: string;
  country: string;
  costIndex: number;
  rentIndex: number;
  groceriesIndex: number;
  restaurantIndex: number;
}

// AI Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCVs: number;
  totalApplications: number;
  aiUsage: {
    totalRequests: number;
    totalTokens: number;
    lastMonth: number;
  };
}

export interface MockDataConfig {
  userCount: number;
  withCV: boolean;
  withApplications: boolean;
  withRoadmap: boolean;
}

// App State
export interface AppState {
  auth: AuthState;
  aiConfig: AIConfig;
  cv: CVData | null;
  roadmap: RoadmapNode[];
  roadmapCategories: RoadmapCategory[];
  checklist: ChecklistItem[];
  applications: Application[];
  dashboardStats: DashboardStats;
  interviewSessions: InterviewSession[];
  chatSessions: ChatSession[];
  currentView: string;
}
