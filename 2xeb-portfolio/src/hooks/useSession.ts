import { useEffect, useSyncExternalStore } from 'react';
import { getSession, subscribe, getAccessToken, Session } from '../lib/session';

/**
 * The desk session as React state. Subscribes to sign-in/out from anywhere
 * (the Desk form, the terminal, another tab) and quietly refreshes an
 * expiring token on mount so the first write never waits on it.
 */
export function useSession(): Session | null {
  const session = useSyncExternalStore(subscribe, getSession, () => null);

  useEffect(() => {
    if (session) void getAccessToken();
    // Only on mount / identity change — the token itself changing must not loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  return session;
}
