import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { User, UserRole, AuthState } from '@/types';

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SWITCH_ROLE'; payload: UserRole };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SWITCH_ROLE':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          role: action.payload,
        },
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'user@careerpack.id',
    name: 'Budi Santoso',
    role: 'user',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
    createdAt: '2024-01-01',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
  {
    id: '2',
    email: 'admin@careerpack.id',
    name: 'Admin CareerPack',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    createdAt: '2024-01-01',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('careerpack_user');
    if (savedUser) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: JSON.parse(savedUser) });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = MOCK_USERS.find(u => u.email === email);
    if (user && password === 'password') {
      localStorage.setItem('careerpack_user', JSON.stringify(user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } else {
      throw new Error('Email atau password salah');
    }
  };

  const logout = () => {
    localStorage.removeItem('careerpack_user');
    dispatch({ type: 'LOGOUT' });
  };

  const register = async (email: string, _password: string, name: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true,
    };
    
    localStorage.setItem('careerpack_user', JSON.stringify(newUser));
    dispatch({ type: 'LOGIN_SUCCESS', payload: newUser });
  };

  const switchRole = (role: UserRole) => {
    dispatch({ type: 'SWITCH_ROLE', payload: role });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, register, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
