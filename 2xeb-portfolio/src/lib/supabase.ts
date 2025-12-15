import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log configuration status (masked for security)
console.log('[Supabase] URL configured:', !!supabaseUrl, supabaseUrl ? `(${supabaseUrl.substring(0, 30)}...)` : '');
console.log('[Supabase] Key configured:', !!supabaseAnonKey, supabaseAnonKey ? '(key present)' : '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Environment variables not set! Admin features will not work.');
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit', // Simpler flow - tokens come directly in URL hash
    },
  }
);

// Direct REST API helper - bypasses hanging Supabase client
export async function supabaseRest<T = unknown>(
  table: string,
  options: {
    select?: string;
    filter?: string;
    order?: string;
    limit?: number;
    count?: 'exact' | 'planned' | 'estimated';
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    accessToken?: string;
  } = {}
): Promise<{ data: T | null; count: number | null; error: string | null }> {
  const { select = '*', filter, order, limit, count, method = 'GET', body, accessToken } = options;

  // Debug logging for mutations
  if (method !== 'GET') {
    console.log(`[supabaseRest] ${method} ${table}`, {
      hasAccessToken: !!accessToken,
      tokenPrefix: accessToken ? accessToken.substring(0, 20) + '...' : 'none',
      filter,
      bodyKeys: body ? Object.keys(body as object) : [],
    });
  }

  try {
    let url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
    if (filter) url += `&${filter}`;
    if (order) url += `&order=${encodeURIComponent(order)}`;
    if (limit) url += `&limit=${limit}`;

    const headers: Record<string, string> = {
      'apikey': supabaseAnonKey || '',
      'Authorization': `Bearer ${accessToken || supabaseAnonKey || ''}`,
      'Content-Type': 'application/json',
    };

    if (count) {
      headers['Prefer'] = `count=${count}`;
    }
    if (method !== 'GET') {
      headers['Prefer'] = (headers['Prefer'] ? headers['Prefer'] + ', ' : '') + 'return=minimal';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      // Try to get error details from response body
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errorBody = await response.json();
        errorDetail = errorBody.message || errorBody.error || errorBody.details || JSON.stringify(errorBody);
      } catch {
        // Response body wasn't JSON
        try {
          errorDetail = await response.text() || errorDetail;
        } catch {
          // Ignore
        }
      }
      console.error(`[supabaseRest] ${method} ${table} failed:`, errorDetail);
      return { data: null, count: null, error: errorDetail };
    }

    const countHeader = response.headers.get('content-range');
    const totalCount = countHeader ? parseInt(countHeader.split('/')[1]) : null;

    if (method !== 'GET' || count === 'exact') {
      const data = response.headers.get('content-length') === '0' ? [] : await response.json();
      return { data: data as T, count: totalCount, error: null };
    }

    const data = await response.json();
    return { data: data as T, count: totalCount, error: null };
  } catch (err) {
    return { data: null, count: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Export type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
