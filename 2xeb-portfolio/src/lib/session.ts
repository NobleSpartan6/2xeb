/**
 * Desk session — the admin identity used by the Log's writing surface and
 * the terminal's `login` command.
 *
 * Plain fetch against Supabase Auth (GoTrue) instead of @supabase/supabase-js:
 *  - keeps the client library out of every bundle the Log touches
 *  - one code path for the terminal, the Desk, and the data layer
 *  - no background timers; tokens refresh lazily, right before they're needed
 *
 * Security lives in Supabase, not here: the password grant is the same one the
 * dashboard uses, admin_users gates who counts as an admin, and RLS decides
 * what a token may write. This module only carries the token around.
 */

import { debug } from './debug';

const AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL || ''}/auth/v1`;
const REST_URL = `${import.meta.env.VITE_SUPABASE_URL || ''}/rest/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const STORAGE_KEY = '2xeb.desk.session';
/** Refresh when fewer than this many seconds remain on the access token. */
const REFRESH_MARGIN_S = 90;

export interface Session {
  accessToken: string;
  refreshToken: string;
  /** Unix seconds. */
  expiresAt: number;
  user: { id: string; email: string };
}

export type SessionErrorKind = 'credentials' | 'unauthorized' | 'offline' | 'server';

export class SessionError extends Error {
  kind: SessionErrorKind;
  constructor(kind: SessionErrorKind, message: string) {
    super(message);
    this.name = 'SessionError';
    this.kind = kind;
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
let current: Session | null = load();
let inflightRefresh: Promise<Session | null> | null = null;

// --- storage ---------------------------------------------------------------

function load(): Session | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user?.id) return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

function persist(session: Session | null) {
  current = session;
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable (private mode); the in-memory session still works.
  }
  listeners.forEach((l) => l());
}

// Another tab signed in or out: mirror it here.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    current = load();
    listeners.forEach((l) => l());
  });
}

// --- public surface --------------------------------------------------------

export function getSession(): Session | null {
  return current;
}

export function isSignedIn(): boolean {
  return current !== null;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  user: { id: string; email?: string };
}

function toSession(t: TokenResponse): Session {
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: t.expires_at ?? Math.floor(Date.now() / 1000) + (t.expires_in ?? 3600),
    user: { id: t.user.id, email: t.user.email ?? '' },
  };
}

async function authErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error_description || body.msg || body.message || body.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function isAdmin(session: Session): Promise<boolean> {
  const res = await fetch(`${REST_URL}/admin_users?id=eq.${session.user.id}&select=id`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${session.accessToken}` },
  });
  if (!res.ok) return false;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0;
}

/**
 * Password sign-in. Resolves to the session when the account is an admin;
 * throws a SessionError with a message fit to show the person typing.
 */
export async function signIn(email: string, password: string): Promise<Session> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_URL}/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    throw new SessionError('offline', 'No connection. Try again when you are back online.');
  }

  if (!res.ok) {
    const msg = await authErrorMessage(res);
    if (res.status === 400 || res.status === 401 || /invalid/i.test(msg)) {
      throw new SessionError('credentials', 'Wrong email or password.');
    }
    if (res.status === 429) {
      throw new SessionError('server', 'Too many attempts. Wait a minute and try again.');
    }
    throw new SessionError('server', msg);
  }

  const session = toSession((await res.json()) as TokenResponse);

  if (!(await isAdmin(session))) {
    // Revoke the token we just minted; a non-admin should not hold one.
    void revoke(session.accessToken);
    throw new SessionError('unauthorized', 'This account cannot use the desk.');
  }

  persist(session);
  debug.log('[session] signed in', session.user.email);
  return session;
}

async function revoke(accessToken: string): Promise<void> {
  try {
    await fetch(`${AUTH_URL}/logout`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Best effort. The local copy is gone either way.
  }
}

export async function signOut(): Promise<void> {
  const s = current;
  persist(null);
  if (s) await revoke(s.accessToken);
}

function secondsLeft(session: Session): number {
  return session.expiresAt - Math.floor(Date.now() / 1000);
}

async function refresh(session: Session): Promise<Session | null> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_URL}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
  } catch {
    // Network trouble is not a reason to sign someone out. Keep what we have;
    // the caller decides whether the current token is still usable.
    debug.warn('[session] refresh failed: offline');
    return secondsLeft(session) > 0 ? session : null;
  }

  if (res.status === 400 || res.status === 401 || res.status === 403) {
    // Refresh token revoked or expired: this session is over.
    debug.warn('[session] refresh rejected; signing out');
    persist(null);
    return null;
  }
  if (!res.ok) {
    debug.warn('[session] refresh error', res.status);
    return secondsLeft(session) > 0 ? session : null;
  }

  const next = toSession((await res.json()) as TokenResponse);
  persist(next);
  return next;
}

/**
 * The access token to use right now, refreshed if it is about to expire.
 * Single-flight: concurrent callers share one refresh, which matters because
 * Supabase rotates refresh tokens and a second parallel refresh would be
 * rejected.
 */
export async function getAccessToken(opts: { force?: boolean } = {}): Promise<string | null> {
  const session = current;
  if (!session) return null;

  if (!opts.force && secondsLeft(session) > REFRESH_MARGIN_S) return session.accessToken;

  if (!inflightRefresh) {
    inflightRefresh = refresh(session).finally(() => {
      inflightRefresh = null;
    });
  }
  const refreshed = await inflightRefresh;
  return refreshed?.accessToken ?? null;
}
