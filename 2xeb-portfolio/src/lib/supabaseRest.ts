import type { Database } from './database.types';
import { debug } from './debug';

// Plain-fetch Supabase REST helper, split from supabase.ts so public pages
// (useExperience, the Log, the Desk) don't pull @supabase/supabase-js into
// the main bundle — the full client is only needed by the (currently
// unrouted) legacy admin CMS.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface RestResult<T> {
  data: T | null;
  count: number | null;
  error: string | null;
  /** HTTP status, or null when the request never reached the server. */
  status: number | null;
}

export interface RestOptions {
  select?: string;
  filter?: string;
  order?: string;
  limit?: number;
  count?: 'exact' | 'planned' | 'estimated';
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string;
  /** Ask PostgREST to return the written row(s) instead of nothing. */
  returning?: boolean;
  /** Let the request outlive the page (final autosave on pagehide). */
  keepalive?: boolean;
  signal?: AbortSignal;
}

async function readError(response: Response): Promise<string> {
  let errorDetail = `HTTP ${response.status}`;
  try {
    const errorBody = await response.json();
    errorDetail =
      errorBody.message || errorBody.error || errorBody.details || JSON.stringify(errorBody);
  } catch {
    try {
      errorDetail = (await response.text()) || errorDetail;
    } catch {
      // Ignore
    }
  }
  return errorDetail;
}

export async function supabaseRest<T = unknown>(
  table: string,
  options: RestOptions = {}
): Promise<RestResult<T>> {
  const {
    select = '*',
    filter,
    order,
    limit,
    count,
    method = 'GET',
    body,
    accessToken,
    returning = false,
    keepalive = false,
    signal,
  } = options;

  // Debug logging for mutations
  if (method !== 'GET') {
    debug.log(`[supabaseRest] ${method} ${table}`, {
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
      apikey: supabaseAnonKey || '',
      Authorization: `Bearer ${accessToken || supabaseAnonKey || ''}`,
      'Content-Type': 'application/json',
    };

    const prefer: string[] = [];
    if (count) prefer.push(`count=${count}`);
    if (method !== 'GET') prefer.push(returning ? 'return=representation' : 'return=minimal');
    if (prefer.length) headers['Prefer'] = prefer.join(', ');

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      keepalive,
      signal,
    });

    if (!response.ok) {
      const errorDetail = await readError(response);
      console.error(`[supabaseRest] ${method} ${table} failed:`, errorDetail);
      return { data: null, count: null, error: errorDetail, status: response.status };
    }

    const countHeader = response.headers.get('content-range');
    const totalCount = countHeader ? parseInt(countHeader.split('/')[1]) : null;

    if (method !== 'GET' && !returning) {
      return { data: [] as unknown as T, count: totalCount, error: null, status: response.status };
    }

    const text = await response.text();
    const data = text ? (JSON.parse(text) as T) : ([] as unknown as T);
    return { data, count: totalCount, error: null, status: response.status };
  } catch (err) {
    return {
      data: null,
      count: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      status: null,
    };
  }
}

/**
 * Call a Postgres function exposed through PostgREST (`/rest/v1/rpc/<name>`).
 * Used for reads that must not be expressible as a table query — e.g. an
 * unlisted post fetched by exact slug.
 */
export async function supabaseRpc<T = unknown>(
  fn: string,
  args: Record<string, unknown> = {},
  options: { accessToken?: string; signal?: AbortSignal } = {}
): Promise<RestResult<T>> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey || '',
        Authorization: `Bearer ${options.accessToken || supabaseAnonKey || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorDetail = await readError(response);
      console.error(`[supabaseRpc] ${fn} failed:`, errorDetail);
      return { data: null, count: null, error: errorDetail, status: response.status };
    }

    const text = await response.text();
    const data = text ? (JSON.parse(text) as T) : null;
    return { data, count: null, error: null, status: response.status };
  } catch (err) {
    return {
      data: null,
      count: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      status: null,
    };
  }
}

// Export type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
