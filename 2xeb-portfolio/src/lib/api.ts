/**
 * API helpers for calling Supabase Edge Functions.
 *
 * Uses plain fetch() instead of @supabase/supabase-js for simplicity.
 * The Edge Functions handle LLM calls and contact form submissions.
 */

import { checkRateLimit, recordRequest, getModelByIdOrDefault, DEFAULT_MODEL_ID } from './models';
import { debug } from './debug';

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
    debug.warn('VITE_SUPABASE_FUNCTIONS_URL not configured, using demo mode');
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
 * Stream callback type for receiving chunks
 */
export type StreamCallback = (chunk: string) => void;

/**
 * Ask the AI portfolio assistant with streaming response.
 * Uses SSE to receive tokens as they're generated.
 *
 * @param question - The user's question
 * @param context - Pre-built context string from static project data
 * @param modelId - Model ID (must be Groq model for streaming)
 * @param onChunk - Callback for each text chunk
 * @returns Final AI response with answer and related project slugs
 */
export async function askPortfolioStreaming(
  question: string,
  context: string,
  modelId: string = DEFAULT_MODEL_ID,
  onChunk: StreamCallback
): Promise<AskPortfolioResponse> {
  // Client-side rate limiting
  const rateLimitCheck = checkRateLimit(modelId);
  if (!rateLimitCheck.allowed) {
    throw new Error(rateLimitCheck.reason || 'Rate limit exceeded');
  }

  const model = getModelByIdOrDefault(modelId);
  
  // Streaming only works with Groq
  if (model.provider !== 'groq') {
    // Fall back to non-streaming
    return askPortfolio(question, context, modelId);
  }

  // If no functions URL configured, return demo response
  if (!FUNCTIONS_BASE_URL) {
    debug.warn('VITE_SUPABASE_FUNCTIONS_URL not configured, using demo mode');
    const demoAnswer = "Demo mode: I would normally tell you about projects here!";
    // Simulate streaming
    for (const char of demoAnswer) {
      onChunk(char);
      await new Promise(r => setTimeout(r, 20));
    }
    return {
      answer: demoAnswer,
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
      stream: true,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Ask portfolio failed: ${error}`);
  }

  if (!res.body) {
    throw new Error('No response body for streaming');
  }

  // Record successful request for rate limiting
  recordRequest();

  // Read SSE stream
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let finalProjectSlugs: string[] = [];
  let finalModel = modelId;
  let finalProvider = model.provider;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n').filter(line => line.startsWith('data:'));

    for (const line of lines) {
      const data = line.replace('data:', '').trim();
      if (!data) continue;

      try {
        const parsed = JSON.parse(data);

        if (parsed.done) {
          finalProjectSlugs = parsed.projectSlugs || finalProjectSlugs;
          finalModel = parsed.model || finalModel;
          finalProvider = parsed.provider || finalProvider;
        } else if (parsed.chunk) {
          fullText += parsed.chunk;
          onChunk(parsed.chunk);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return {
    answer: fullText,
    projectSlugs: finalProjectSlugs,
    model: finalModel,
    provider: finalProvider,
  };
}

/**
 * Submit a contact form message.
 *
 * @param payload - Contact form data
 */
export async function submitContact(payload: ContactPayload): Promise<void> {
  // If no functions URL configured, log and return
  if (!FUNCTIONS_BASE_URL) {
    debug.warn('VITE_SUPABASE_FUNCTIONS_URL not configured, contact form disabled');
    debug.log('Would submit:', payload);
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
