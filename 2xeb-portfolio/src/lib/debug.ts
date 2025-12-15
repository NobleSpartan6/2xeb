/**
 * Debug logging utility.
 *
 * Logs are only output when VITE_DEBUG=true in your .env.local file.
 * This keeps the console clean in production while allowing verbose
 * logging during development.
 *
 * Usage:
 *   import { debug } from '@/lib/debug';
 *   debug.log('[Auth] Session loaded:', session);
 *   debug.warn('[API] Rate limit approaching');
 */

const DEBUG = import.meta.env.VITE_DEBUG === 'true';

export const debug = {
  log: (...args: unknown[]) => {
    if (DEBUG) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (DEBUG) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (DEBUG) console.info(...args);
  },
};

export default debug;
