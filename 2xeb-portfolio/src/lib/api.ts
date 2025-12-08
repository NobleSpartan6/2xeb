/**
 * API helpers for calling Supabase Edge Functions.
 *
 * Uses plain fetch() instead of @supabase/supabase-js for simplicity.
 * The Edge Functions handle LLM calls and contact form submissions.
 */

import { checkRateLimit, recordRequest, getModelByIdOrDefault, DEFAULT_MODEL_ID } from './models';

const FUNCTIONS_BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export type LLMProvider = 'groq' | 'gemini';

export interface AskPortfolioResponse {
  answer: string;
  projectSlugs: string[];
  model?: string;
  provider?: LLMProvider;
}

export interface ContactPayload {
  name?: string;
  email?: string;
  message: string;
  reason?: string;
  source_page?: string;
}

/**
 * Ask the AI portfolio assistant a question.
 *
 * @param question - The user's question
 * @param context - Pre-built context string from static project data
 * @param modelId - Model ID (e.g., 'llama-3.1-8b-instant')
 * @returns AI response with answer and related project slugs
 */
export async function askPortfolio(
  question: string,
  context: string,
  modelId: string = DEFAULT_MODEL_ID
): Promise<AskPortfolioResponse> {
  // Client-side rate limiting
  const rateLimitCheck = checkRateLimit(modelId);
  if (!rateLimitCheck.allowed) {
    throw new Error(rateLimitCheck.reason || 'Rate limit exceeded');
  }

  const model = getModelByIdOrDefault(modelId);

  // If no functions URL configured, return demo response
  if (!FUNCTIONS_BASE_URL) {
    console.warn('VITE_SUPABASE_FUNCTIONS_URL not configured, using demo mode');
    return {
      answer: "Demo mode: I would normally tell you about projects like 'Midimix' (AI-powered MIDI tool) or 'Portfolio Console' (this 3D experience) here!",
      projectSlugs: ['midimix', 'portfolio-console'],
      model: modelId,
      provider: model.provider,
    };
  }

  const res = await fetch(`${FUNCTIONS_BASE_URL}/ask-portfolio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      question,
      context,
      model: modelId,
      provider: model.provider,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Ask portfolio failed: ${error}`);
  }

  // Record successful request for rate limiting
  recordRequest();

  return res.json() as Promise<AskPortfolioResponse>;
}

/**
 * Submit a contact form message.
 *
 * @param payload - Contact form data
 */
export async function submitContact(payload: ContactPayload): Promise<void> {
  // If no functions URL configured, log and return
  if (!FUNCTIONS_BASE_URL) {
    console.warn('VITE_SUPABASE_FUNCTIONS_URL not configured, contact form disabled');
    console.log('Would submit:', payload);
    return;
  }

  const res = await fetch(`${FUNCTIONS_BASE_URL}/submit-contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Contact submit failed: ${error}`);
  }
}
