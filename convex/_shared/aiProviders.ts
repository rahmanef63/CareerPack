export interface AIProviderSpec {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  models: readonly string[];
  docsUrl?: string;
}

export const AI_PROVIDERS: Record<string, AIProviderSpec> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: [
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4.1-nano",
      "gpt-4o",
      "gpt-4o-mini",
      "o4-mini",
    ],
    docsUrl: "https://platform.openai.com/api-keys",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    models: [
      "openai/gpt-4o-mini",
      "openai/gpt-4o",
      "anthropic/claude-sonnet-4.5",
      "anthropic/claude-haiku-4.5",
      "google/gemini-2.5-pro",
      "google/gemini-2.5-flash",
      "x-ai/grok-4",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-chat",
      "moonshotai/kimi-k2",
    ],
    docsUrl: "https://openrouter.ai/keys",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.5-flash",
    models: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
    ],
    docsUrl: "https://aistudio.google.com/apikey",
  },
  groq: {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "deepseek-r1-distill-llama-70b",
      "qwen-2.5-32b",
      "mixtral-8x7b-32768",
    ],
    docsUrl: "https://console.groq.com/keys",
  },
  grok: {
    id: "grok",
    label: "xAI Grok",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-4",
    models: ["grok-4", "grok-3", "grok-3-mini", "grok-code-fast-1"],
    docsUrl: "https://console.x.ai",
  },
  glm: {
    id: "glm",
    label: "Zhipu GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4.6",
    models: ["glm-4.6", "glm-4.5", "glm-4.5-air", "glm-4-plus", "glm-4-air"],
    docsUrl: "https://open.bigmodel.cn/usercenter/apikeys",
  },
  moonshot: {
    id: "moonshot",
    label: "Moonshot Kimi",
    baseUrl: "https://api.moonshot.ai/v1",
    defaultModel: "kimi-k2.5",
    models: ["kimi-k2.5", "kimi-k2-thinking", "kimi-k2-thinking-turbo", "kimi-k2-turbo"],
    docsUrl: "https://platform.moonshot.ai/console/api-keys",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    docsUrl: "https://platform.deepseek.com/api_keys",
  },
  mistral: {
    id: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    models: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"],
    docsUrl: "https://console.mistral.ai/api-keys",
  },
  custom: {
    id: "custom",
    label: "Kustom (OpenAI-compat)",
    baseUrl: "",
    defaultModel: "",
    models: [],
  },
};

export type AIProviderId = keyof typeof AI_PROVIDERS;

export function resolveProviderBaseUrl(provider: string, override?: string): string {
  const trimmed = override?.trim();
  if (trimmed) return trimmed.replace(/\/+$/, "");
  const spec = AI_PROVIDERS[provider];
  if (!spec || !spec.baseUrl) {
    throw new Error(`Provider AI tidak dikenal: ${provider}`);
  }
  return spec.baseUrl.replace(/\/+$/, "");
}

export function listProvidersPublic() {
  return Object.values(AI_PROVIDERS).map(({ id, label, baseUrl, defaultModel, models, docsUrl }) => ({
    id,
    label,
    baseUrl,
    defaultModel,
    models: [...models],
    docsUrl,
  }));
}
