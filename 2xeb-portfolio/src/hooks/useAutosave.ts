import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'offline' | 'error';

export interface AutosaveState {
  status: AutosaveStatus;
  /** True whenever the last snapshot differs from the last successful save. */
  dirty: boolean;
  savedAt: Date | null;
  error: string | null;
  /** Save now if anything is dirty. Safe to call when nothing is. */
  flush: (opts?: { keepalive?: boolean }) => Promise<void>;
  /** Tell the hook the current value is already persisted (e.g. after an explicit save elsewhere). */
  markSaved: () => void;
}

interface Options<T> {
  value: T;
  /** Persist the snapshot. Throw to signal failure; set `offline` on the error to get the offline state. */
  save: (value: T, opts: { keepalive?: boolean }) => Promise<void>;
  enabled?: boolean;
  /** Quiet time after the last change before saving. */
  delay?: number;
}

const RETRY_MS = [4000, 12000, 30000];

function isOfflineError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return typeof err === 'object' && err !== null && (err as { kind?: string }).kind === 'offline';
}

/**
 * Debounced, single-flight autosave with retry.
 *
 * - A change schedules a save after `delay` ms of quiet.
 * - Only one save runs at a time; changes during a save queue one more.
 * - Failures back off and retry; going back online retries at once.
 * - `flush` saves immediately (used when the page is about to hide).
 */
export function useAutosave<T>({
  value,
  save,
  enabled = true,
  delay = 1500,
}: Options<T>): AutosaveState {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const serialized = JSON.stringify(value);
  const latestRef = useRef({ value, serialized });
  latestRef.current = { value, serialized };
  const lastSavedRef = useRef<string | null>(serialized);
  const saveRef = useRef(save);
  saveRef.current = save;

  const timerRef = useRef<number | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);
  const attemptRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const run = useCallback(async (opts: { keepalive?: boolean } = {}): Promise<void> => {
    if (inflightRef.current) return inflightRef.current;
    const snapshot = latestRef.current;
    if (snapshot.serialized === lastSavedRef.current) {
      setStatus((s) => (s === 'pending' ? 'saved' : s));
      return;
    }

    setStatus('saving');
    const p = (async () => {
      try {
        await saveRef.current(snapshot.value, opts);
        lastSavedRef.current = snapshot.serialized;
        attemptRef.current = 0;
        setError(null);
        setSavedAt(new Date());
        // Changes arrived while saving: go again after a short quiet period.
        if (latestRef.current.serialized !== snapshot.serialized) {
          setStatus('pending');
          clearTimer();
          timerRef.current = window.setTimeout(() => void run(), 600);
        } else {
          setStatus('saved');
        }
      } catch (err) {
        const offline = isOfflineError(err);
        setStatus(offline ? 'offline' : 'error');
        setError(offline ? null : err instanceof Error ? err.message : 'Could not save.');
        const wait = RETRY_MS[Math.min(attemptRef.current, RETRY_MS.length - 1)];
        attemptRef.current += 1;
        clearTimer();
        timerRef.current = window.setTimeout(() => void run(), wait);
      } finally {
        inflightRef.current = null;
      }
    })();
    inflightRef.current = p;
    return p;
  }, []);

  // Schedule on change.
  useEffect(() => {
    if (!enabledRef.current) return;
    if (serialized === lastSavedRef.current) return;
    setStatus('pending');
    clearTimer();
    timerRef.current = window.setTimeout(() => void run(), delay);
    return clearTimer;
  }, [serialized, delay, run]);

  // Back online: retry now rather than waiting out the backoff.
  useEffect(() => {
    const onOnline = () => {
      if (latestRef.current.serialized !== lastSavedRef.current) {
        clearTimer();
        void run();
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [run]);

  const flush = useCallback(
    async (opts: { keepalive?: boolean } = {}) => {
      clearTimer();
      if (!enabledRef.current) return;
      await run(opts);
    },
    [run]
  );

  const markSaved = useCallback(() => {
    clearTimer();
    lastSavedRef.current = latestRef.current.serialized;
    attemptRef.current = 0;
    setError(null);
    setSavedAt(new Date());
    setStatus('saved');
  }, []);

  return {
    status,
    dirty: serialized !== lastSavedRef.current,
    savedAt,
    error,
    flush,
    markSaved,
  };
}
