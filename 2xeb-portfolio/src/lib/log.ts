/**
 * Log data layer — every read and write to the `posts` table.
 *
 * Public reads use the anon key and see only published rows (RLS), or one
 * unlisted row by exact slug (the get_post function). Writes carry the desk
 * session token; a 401 triggers one forced refresh and one retry, so an
 * hour-old tab keeps working without the writer noticing.
 */

import { supabaseRest, supabaseRpc, Tables, InsertTables, UpdateTables } from './supabaseRest';
import { getAccessToken } from './session';

export type Post = Tables<'posts'>;
export type PostInsert = InsertTables<'posts'>;
export type PostUpdate = UpdateTables<'posts'>;
export type PostStatus = Post['status'];
export type PostKind = Post['kind'];

export type LogErrorKind = 'offline' | 'auth' | 'notfound' | 'server';

export class LogError extends Error {
  kind: LogErrorKind;
  constructor(kind: LogErrorKind, message: string) {
    super(message);
    this.name = 'LogError';
    this.kind = kind;
  }
}

const FIELDS =
  'id,slug,title,body,excerpt,kind,discipline,status,published_at,created_at,updated_at';

function toError(status: number | null, error: string | null): LogError {
  if (status === null) return new LogError('offline', 'No connection.');
  if (status === 401 || status === 403) return new LogError('auth', 'Not signed in.');
  if (status === 404) return new LogError('notfound', 'Not found.');
  return new LogError('server', error || `HTTP ${status}`);
}

// --- public reads ------------------------------------------------------------

export async function fetchPublished(signal?: AbortSignal): Promise<Post[]> {
  const { data, error, status } = await supabaseRest<Post[]>('posts', {
    select: FIELDS,
    filter: 'status=eq.published',
    order: 'published_at.desc',
    signal,
  });
  if (error) throw toError(status, error);
  return data ?? [];
}

/** Published or unlisted, by exact slug. Null when nothing public matches. */
export async function fetchPublicPost(slug: string, signal?: AbortSignal): Promise<Post | null> {
  const { data, error, status } = await supabaseRpc<Post[]>(
    'get_post',
    { p_slug: slug },
    { signal }
  );
  if (error) throw toError(status, error);
  return data?.[0] ?? null;
}

// --- authenticated -------------------------------------------------------------

type Call<T> = (
  token: string
) => Promise<{ data: T | null; error: string | null; status: number | null }>;

async function withAuth<T>(call: Call<T>): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new LogError('auth', 'Not signed in.');

  let result = await call(token);
  if (result.status === 401) {
    const fresh = await getAccessToken({ force: true });
    if (!fresh) throw new LogError('auth', 'Session expired. Sign in again.');
    result = await call(fresh);
  }
  if (result.error) throw toError(result.status, result.error);
  return result.data as T;
}

export function fetchAllPosts(): Promise<Post[]> {
  return withAuth<Post[]>((token) =>
    supabaseRest<Post[]>('posts', { select: FIELDS, order: 'updated_at.desc', accessToken: token })
  );
}

export async function fetchPost(id: number): Promise<Post | null> {
  const rows = await withAuth<Post[]>((token) =>
    supabaseRest<Post[]>('posts', { select: FIELDS, filter: `id=eq.${id}`, accessToken: token })
  );
  return rows[0] ?? null;
}

export async function createPost(input: PostInsert): Promise<Post> {
  const rows = await withAuth<Post[]>((token) =>
    supabaseRest<Post[]>('posts', {
      method: 'POST',
      select: FIELDS,
      body: input,
      accessToken: token,
      returning: true,
    })
  );
  const row = rows[0];
  if (!row) throw new LogError('server', 'Save did not return the new piece.');
  return row;
}

export async function updatePost(
  id: number,
  patch: PostUpdate,
  opts: { keepalive?: boolean } = {}
): Promise<Post> {
  const rows = await withAuth<Post[]>((token) =>
    supabaseRest<Post[]>('posts', {
      method: 'PATCH',
      select: FIELDS,
      filter: `id=eq.${id}`,
      body: patch,
      accessToken: token,
      returning: true,
      keepalive: opts.keepalive,
    })
  );
  const row = rows[0];
  if (!row) throw new LogError('notfound', 'That piece no longer exists.');
  return row;
}

export async function deletePost(id: number): Promise<void> {
  await withAuth<unknown>((token) =>
    supabaseRest('posts', { method: 'DELETE', filter: `id=eq.${id}`, accessToken: token })
  );
}

// --- derived text ----------------------------------------------------------------

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Markdown → plain text, good enough for excerpts and share cards. */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function postDate(post: Pick<Post, 'published_at' | 'created_at'>): Date {
  return new Date(post.published_at ?? post.created_at);
}

export function formatDate(d: Date, style: 'long' | 'short' = 'long'): string {
  return d.toLocaleDateString(
    'en-US',
    style === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { month: 'short', day: 'numeric' }
  );
}

/** Title if there is one, otherwise the piece's date. */
export function postTitle(post: Pick<Post, 'title' | 'published_at' | 'created_at'>): string {
  const t = post.title?.trim();
  return t && t.length > 0 ? t : formatDate(postDate(post));
}

/** Excerpt override, else the opening of the body, trimmed to a share-card length. */
export function postExcerpt(post: Pick<Post, 'excerpt' | 'body'>, max = 200): string {
  const source = post.excerpt?.trim() || stripMarkdown(post.body);
  if (source.length <= max) return source;
  const cut = source.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).trimEnd() + '…';
}

/** The first few non-empty lines, for the index's "openings" list. */
export function openingLines(body: string, count = 4): string[] {
  return body
    .split('\n')
    .map((l) => stripMarkdown(l))
    .filter((l) => l.length > 0)
    .slice(0, count);
}

export function wordCount(body: string): number {
  const words = stripMarkdown(body).split(/\s+/).filter(Boolean);
  return words.length;
}
