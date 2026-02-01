/**
 * Admin feature types.
 */

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

export interface AIConfig {
    provider: 'zai' | 'openai' | 'custom';
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
    isEnabled: boolean;
}
