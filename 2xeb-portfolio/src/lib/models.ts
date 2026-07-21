/**
 * LLM Model Configuration
 *
 * Centralized config for all available models via Groq.
 * Includes rate limits for client-side protection.
 *
 * Fallback: if Groq returns 429, the ask-portfolio Edge Function transparently
 * retries on Cerebras (CEREBRAS_FALLBACK_MODEL_ID below) — responses then
 * report provider 'cerebras'. Keep in sync with
 * supabase/functions/ask-portfolio/index.ts (ALLOWED_GROQ_MODELS + fallback).
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'groq'; // primary provider; Cerebras is a server-side 429 fallback
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
    description: 'Fastest replies, highest daily limits',
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
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    provider: 'groq',
    description: 'Fast MoE model — best speed/quality balance',
    contextWindow: 131072,
    limits: {
      requestsPerMinute: 30,
      requestsPerDay: 1000,
      tokensPerMinute: 30000,
      tokensPerDay: 500000,
    },
    category: 'balanced',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    description: 'Dense 70B, thorough answers',
    contextWindow: 131072,
    limits: {
      requestsPerMinute: 30,
      requestsPerDay: 1000,
      tokensPerMinute: 12000,
      tokensPerDay: 100000,
    },
    category: 'balanced',
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'groq',
    description: 'Strongest reasoning on the free tier',
    contextWindow: 131072,
    limits: {
      requestsPerMinute: 30,
      requestsPerDay: 1000,
      tokensPerMinute: 8000,
      tokensPerDay: 200000,
    },
    category: 'powerful',
  },
];

export const DEFAULT_MODEL_ID = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Server-side 429 fallback (Cerebras hosts the same open-weights GPT-OSS 120B
// that Groq serves as openai/gpt-oss-120b). Not user-selectable.
export const CEREBRAS_FALLBACK_MODEL_ID = 'gpt-oss-120b';

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
