"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type { AIConfig } from "@/shared/types";

interface AIConfigContextType {
  config: AIConfig;
  updateConfig: (config: Partial<AIConfig>) => void;
  resetConfig: () => void;
  isConfigured: boolean;
}

const DEFAULT_CONFIG: AIConfig = {
  provider: "zai",
  apiKey: "",
  baseUrl: "https://api.z.ai/api/paas/v4/",
  model: "glm-4.7",
  temperature: 0.7,
  maxTokens: 2048,
  isEnabled: false,
};

const STORAGE_KEY = "careerpack_ai_config";

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export function AIConfigProvider({ children }: { children: ReactNode }) {
  const [config, dispatch] = useReducer(
    (
      state: AIConfig,
      action: { type: "UPDATE" | "RESET"; payload?: Partial<AIConfig> }
    ) => {
      switch (action.type) {
        case "UPDATE":
          return { ...state, ...action.payload };
        case "RESET":
          return DEFAULT_CONFIG;
        default:
          return state;
      }
    },
    DEFAULT_CONFIG
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        dispatch({ type: "UPDATE", payload: JSON.parse(saved) });
      } catch {
        /* ignore malformed cache */
      }
    }
  }, []);

  const updateConfig = (patch: Partial<AIConfig>) => {
    const next = { ...config, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    dispatch({ type: "UPDATE", payload: patch });
  };

  const resetConfig = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    dispatch({ type: "RESET" });
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
    throw new Error("useAIConfig harus dipakai di dalam <AIConfigProvider>");
  }
  return context;
}
