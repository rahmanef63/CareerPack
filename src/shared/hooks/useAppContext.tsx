import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { 
  UserProfile, CVData, RoadmapNode, ChecklistItem, 
  Application, DashboardStats, InterviewSession 
} from '@/types';

interface AppState {
  user: UserProfile | null;
  cv: CVData | null;
  roadmap: RoadmapNode[];
  checklist: ChecklistItem[];
  applications: Application[];
  dashboardStats: DashboardStats;
  interviewSessions: InterviewSession[];
  currentView: string;
}

type Action =
  | { type: 'SET_USER'; payload: UserProfile }
  | { type: 'UPDATE_CV'; payload: Partial<CVData> }
  | { type: 'UPDATE_ROADMAP'; payload: RoadmapNode[] }
  | { type: 'TOGGLE_ROADMAP_NODE'; payload: string }
  | { type: 'UPDATE_CHECKLIST'; payload: ChecklistItem[] }
  | { type: 'TOGGLE_CHECKLIST_ITEM'; payload: string }
  | { type: 'ADD_APPLICATION'; payload: Application }
  | { type: 'UPDATE_APPLICATION'; payload: Application }
  | { type: 'SET_DASHBOARD_STATS'; payload: DashboardStats }
  | { type: 'ADD_INTERVIEW_SESSION'; payload: InterviewSession }
  | { type: 'SET_VIEW'; payload: string }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const initialState: AppState = {
  user: null,
  cv: null,
  roadmap: [],
  checklist: [],
  applications: [],
  dashboardStats: {
    totalApplications: 0,
    interviewsScheduled: 0,
    offersReceived: 0,
    responseRate: 0,
    weeklyGoal: 10,
    weeklyProgress: 0,
  },
  interviewSessions: [],
  currentView: 'home',
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'UPDATE_CV':
      return { ...state, cv: { ...state.cv, ...action.payload } as CVData };
    
    case 'UPDATE_ROADMAP':
      return { ...state, roadmap: action.payload };
    
    case 'TOGGLE_ROADMAP_NODE': {
      const toggleNode = (nodes: RoadmapNode[]): RoadmapNode[] => {
        return nodes.map(node => {
          if (node.id === action.payload) {
            return { ...node, completed: !node.completed };
          }
          if (node.children) {
            return { ...node, children: toggleNode(node.children) };
          }
          return node;
        });
      };
      return { ...state, roadmap: toggleNode(state.roadmap) };
    }
    
    case 'UPDATE_CHECKLIST':
      return { ...state, checklist: action.payload };
    
    case 'TOGGLE_CHECKLIST_ITEM':
      return {
        ...state,
        checklist: state.checklist.map(item =>
          item.id === action.payload
            ? { ...item, completed: !item.completed }
            : item
        ),
      };
    
    case 'ADD_APPLICATION':
      return {
        ...state,
        applications: [...state.applications, action.payload],
      };
    
    case 'UPDATE_APPLICATION':
      return {
        ...state,
        applications: state.applications.map(app =>
          app.id === action.payload.id ? action.payload : app
        ),
      };
    
    case 'SET_DASHBOARD_STATS':
      return { ...state, dashboardStats: action.payload };
    
    case 'ADD_INTERVIEW_SESSION':
      return {
        ...state,
        interviewSessions: [...state.interviewSessions, action.payload],
      };
    
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
