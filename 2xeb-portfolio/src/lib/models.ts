/**
 * LLM Model Configuration
 *
 * Centralized config for all available models via Groq.
 * Includes rate limits for client-side protection.
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'groq' | 'gemini';
  description: string;
  contextWindow: number;
  // Free tier limits
  limits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerMinute: number;
    tokensPerDay: number;
  };
  // For UI grouping
  category: 'fast' | 'balanced' | 'powerful';
}

/**
 * Available models - ordered by recommendation for portfolio use case
 * Using models with higher free tier limits to avoid billing
 */
export const MODELS: ModelConfig[] = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'groq',
    description: 'Fast & efficient, best for simple Q&A',
    contextWindow: 131072,
    limits: {
      requestsPerMinute: 30,
      requestsPerDay: 14400,
      tokensPerMinute: 6000,
      tokensPerDay: 500000,
    },
    category: 'fast',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    description: 'More capable, complex reasoning',
    contextWindow: 131072,
    limits: {
      requestsPerMinute: 30,
      requestsPerDay: 1000,
      tokensPerMinute: 12000,
      tokensPerDay: 100000,
    },
    category: 'powerful',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    description: 'Google\'s fast multimodal model',
    contextWindow: 1000000,
    limits: {
      requestsPerMinute: 15,
      requestsPerDay: 1500,
      tokensPerMinute: 32000,
      tokensPerDay: 1000000,
    },
    category: 'balanced',
  },
];

export const DEFAULT_MODEL_ID = 'llama-3.3-70b-versatile';

export function getModelById(id: string): ModelConfig | undefined {
  return MODELS.find(m => m.id === id);
}

export function getModelByIdOrDefault(id: string): ModelConfig {
  return getModelById(id) || MODELS[0];
}

/**
 * Client-side rate limiting
 * Tracks requests to prevent hitting API limits
 */
interface RateLimitState {
  requests: number[];  // Timestamps of recent requests
  lastReset: number;   // Last daily reset timestamp
  dailyCount: number;  // Requests today
}

const RATE_LIMIT_KEY = '2xeb_rate_limit';
const COOLDOWN_MS = 2000; // 2 second cooldown between requests

function getRateLimitState(): RateLimitState {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (stored) {
      const state = JSON.parse(stored) as RateLimitState;
      // Reset daily count if it's a new day
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (now - state.lastReset > oneDayMs) {
        return { requests: [], lastReset: now, dailyCount: 0 };
      }
      return state;
    }
  } catch {
    // Ignore parse errors
  }
  return { requests: [], lastReset: Date.now(), dailyCount: 0 };
}

function saveRateLimitState(state: RateLimitState): void {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
  waitMs?: number;
}

/**
 * Check if a request is allowed based on rate limits
 * Returns { allowed: true } or { allowed: false, reason, waitMs }
 */
export function checkRateLimit(modelId: string): RateLimitCheck {
  const model = getModelByIdOrDefault(modelId);
  const state = getRateLimitState();
  const now = Date.now();

  // Check cooldown (prevent rapid-fire requests)
  const recentRequests = state.requests.filter(t => now - t < 60000);
  const lastRequest = recentRequests[recentRequests.length - 1];
  if (lastRequest && now - lastRequest < COOLDOWN_MS) {
    return {
      allowed: false,
      reason: 'Please wait a moment between questions',
      waitMs: COOLDOWN_MS - (now - lastRequest),
    };
  }

  // Check requests per minute (use 80% of limit as buffer)
  const safeRPM = Math.floor(model.limits.requestsPerMinute * 0.8);
  if (recentRequests.length >= safeRPM) {
    const oldestInWindow = recentRequests[0];
    const waitMs = 60000 - (now - oldestInWindow);
    return {
      allowed: false,
      reason: `Rate limit reached (${safeRPM}/min). Please wait.`,
      waitMs,
    };
  }

  // Check daily limit (use 90% of limit as buffer)
  const safeDailyLimit = Math.floor(model.limits.requestsPerDay * 0.9);
  if (state.dailyCount >= safeDailyLimit) {
    return {
      allowed: false,
      reason: 'Daily limit reached. Try again tomorrow.',
    };
  }

  return { allowed: true };
}

/**
 * Record a successful request for rate limiting
 */
export function recordRequest(): void {
  const state = getRateLimitState();
  const now = Date.now();

  // Keep only requests from last minute
  state.requests = state.requests.filter(t => now - t < 60000);
  state.requests.push(now);
  state.dailyCount += 1;

  saveRateLimitState(state);
}

/**
 * Get current usage stats for display
 */
export function getUsageStats(modelId: string): { rpm: number; daily: number; limits: ModelConfig['limits'] } {
  const model = getModelByIdOrDefault(modelId);
  const state = getRateLimitState();
  const now = Date.now();
  const recentRequests = state.requests.filter(t => now - t < 60000);

  return {
    rpm: recentRequests.length,
    daily: state.dailyCount,
    limits: model.limits,
  };
}
