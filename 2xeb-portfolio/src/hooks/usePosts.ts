import { useEffect, useState } from 'react';
import { fetchPublished, fetchPublicPost, Post, LogError } from '../lib/log';

type State<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: T; error: null }
  | { status: 'error'; data: null; error: LogError };

function asLogError(err: unknown): LogError {
  if (err instanceof LogError) return err;
  return new LogError('server', err instanceof Error ? err.message : 'Something went wrong.');
}

const LIST_CACHE_KEY = '2xeb.log.index';

function readListCache(): Post[] | null {
  try {
    const raw = sessionStorage.getItem(LIST_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Post[]) : null;
  } catch {
    return null;
  }
}

/**
 * Published pieces, newest first. Shows the last successful list instantly
 * on revisits (sessionStorage) and refreshes behind it.
 */
export function usePosts(): State<Post[]> {
  const [state, setState] = useState<State<Post[]>>(() => {
    const cached = readListCache();
    return cached
      ? { status: 'ready', data: cached, error: null }
      : { status: 'loading', data: null, error: null };
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchPublished(controller.signal)
      .then((posts) => {
        try {
          sessionStorage.setItem(LIST_CACHE_KEY, JSON.stringify(posts));
        } catch {
          // Cache is a convenience only.
        }
        setState({ status: 'ready', data: posts, error: null });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        // A failed refresh keeps the cached list on screen rather than replacing it with an error.
        setState((prev) =>
          prev.status === 'ready' ? prev : { status: 'error', data: null, error: asLogError(err) }
        );
      });
    return () => controller.abort();
  }, []);

  return state;
}

/** One public piece by slug. `data` is null when nothing public matches. */
export function usePost(slug: string): State<Post | null> {
  const [state, setState] = useState<State<Post | null>>({
    status: 'loading',
    data: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', data: null, error: null });
    fetchPublicPost(slug, controller.signal)
      .then((post) => setState({ status: 'ready', data: post, error: null }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', data: null, error: asLogError(err) });
      });
    return () => controller.abort();
  }, [slug]);

  return state;
}
