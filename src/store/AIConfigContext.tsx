import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AIConfig } from '@/types';

interface AIConfigContextType {
  config: AIConfig;
  updateConfig: (config: Partial<AIConfig>) => void;
  resetConfig: () => void;
  isConfigured: boolean;
}

const defaultConfig: AIConfig = {
  provider: 'zai',
  apiKey: '',
  baseUrl: 'https://api.z.ai/api/paas/v4/',
  model: 'glm-4.7',
  temperature: 0.7,
  maxTokens: 2048,
  isEnabled: false,
};

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export function AIConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useReducer(
    (state: AIConfig, action: { type: 'UPDATE' | 'RESET'; payload?: Partial<AIConfig> }) => {
      switch (action.type) {
        case 'UPDATE':
          return { ...state, ...action.payload };
        case 'RESET':
          return defaultConfig;
        default:
          return state;
      }
    },
    defaultConfig
  );

  useEffect(() => {
    const savedConfig = localStorage.getItem('careerpack_ai_config');
    if (savedConfig) {
      setConfig({ type: 'UPDATE', payload: JSON.parse(savedConfig) });
    }
  }, []);

  const updateConfig = (newConfig: Partial<AIConfig>) => {
    const updated = { ...config, ...newConfig };
    localStorage.setItem('careerpack_ai_config', JSON.stringify(updated));
    setConfig({ type: 'UPDATE', payload: newConfig });
  };

  const resetConfig = () => {
    localStorage.removeItem('careerpack_ai_config');
    setConfig({ type: 'RESET' });
  };

  const isConfigured = config.isEnabled && config.apiKey.length > 0;

  return (
    <AIConfigContext.Provider value={{ config, updateConfig, resetConfig, isConfigured }}>
      {children}
    </AIConfigContext.Provider>
  );
}

export function useAIConfig() {
  const context = useContext(AIConfigContext);
  if (context === undefined) {
    throw new Error('useAIConfig must be used within an AIConfigProvider');
  }
  return context;
}
