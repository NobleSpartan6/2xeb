import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, stagger, utils } from 'animejs';

/**
 * Shared anime.js animation helpers.
 *
 * All hooks respect `prefers-reduced-motion`: when reduced motion is
 * requested, elements are left fully visible and no animation runs.
 */

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Reactive form of `prefersReducedMotion` for long-lived scenes (the 3D
 * canvases). The one-shot check freezes a scene with whatever value the OS
 * had at mount; subscribing to the media query lets a running scene thaw
 * the moment the user turns "reduce motion" off — no reload needed.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

const hasFinePointer = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * Routes whose entrance reveal has already played this SPA session.
 * Navigation is a high-frequency action: entrance choreography plays on a
 * route's first visit and renders instantly on revisits. In-memory on
 * purpose — a hard reload is a fresh visit and plays again.
 */
const playedRoutes = new Set<string>();

export const hasRouteRevealPlayed = (): boolean =>
  typeof window !== 'undefined' && playedRoutes.has(window.location.pathname);

/**
 * Deferred one tick so every reveal hook in the same commit still sees the
 * route as "not played" on its first visit.
 */
export const markRouteRevealPlayed = (): void => {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  setTimeout(() => playedRoutes.add(path), 0);
};

export interface RevealOptions {
  /** CSS selector for the elements to reveal (default: '[data-animate]') */
  selector?: string;
  /** Vertical travel distance in px (default: 16) */
  y?: number;
  /** Starting scale (default: 1 — no scaling) */
  scale?: number;
  /** Duration per element in ms (default: 550) */
  duration?: number;
  /** Stagger interval between elements revealed together in ms (default: 45) */
  interval?: number;
}

/**
 * Reveals matching descendants with a staggered rise + fade as they enter
 * the viewport. Elements already on screen animate immediately; elements
 * below the fold animate when scrolled to. Re-runs when `deps` change,
 * which re-plays the reveal (used for filter changes on grids).
 */
export function useScrollReveal<T extends HTMLElement>(
  options: RevealOptions = {},
  deps: readonly unknown[] = []
) {
  const ref = useRef<T>(null);
  const skipRef = useRef<boolean | null>(null);
  const { selector = '[data-animate]', y = 16, scale = 1, duration = 550, interval = 45 } = options;

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (els.length === 0 || prefersReducedMotion()) return;

    // Mounting on a route already seen this session: render instantly, and
    // latch that decision for this mount so deps re-runs (SWR refreshes,
    // filter changes) stay instant too. On a route's first visit, deps
    // re-runs still animate — that content actually changed.
    if (skipRef.current === null) skipRef.current = hasRouteRevealPlayed();
    if (skipRef.current) return;
    markRouteRevealPlayed();

    utils.set(els, { opacity: 0 });

    const revealed = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        const batch = entries
          .filter((e) => e.isIntersecting && !revealed.has(e.target))
          .map((e) => e.target as HTMLElement);
        if (batch.length === 0) return;
        batch.forEach((el) => {
          revealed.add(el);
          io.unobserve(el);
        });
        animate(batch, {
          opacity: [0, 1],
          translateY: [y, 0],
          ...(scale !== 1 ? { scale: [scale, 1] } : {}),
          duration,
          delay: stagger(interval),
          ease: 'outExpo',
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    );

    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      // Never leave elements stranded invisible (e.g. fast unmount/remount)
      utils.set(els, { opacity: 1, translateY: 0, scale: 1 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, y, scale, duration, interval, ...deps]);

  return ref;
}

const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#';

/**
 * Terminal-style text scramble: when the element first enters the viewport,
 * its text decodes left-to-right through glitchy random glyphs. The element's
 * text content must be a plain static string.
 */
export function useTextScramble<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || prefersReducedMotion() || hasRouteRevealPlayed()) return;

    const original = el.textContent ?? '';
    if (!original.trim()) return;

    let frame: number | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();

        const started = performance.now();
        const duration = Math.min(1200, 500 + original.length * 30);
        const tick = (now: number) => {
          const p = Math.min(1, (now - started) / duration);
          const settled = Math.floor(p * original.length);
          el.textContent = original
            .split('')
            .map((char, i) => {
              if (i < settled || /\s/.test(char)) return char;
              return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            })
            .join('');
          if (p < 1) {
            frame = requestAnimationFrame(tick);
          } else {
            el.textContent = original;
          }
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
      el.textContent = original;
    };
  }, [enabled]);

  return ref;
}

/**
 * Magnetic hover: the element is gently pulled toward the cursor and snaps
 * back with a spring when the pointer leaves. Desktop (fine pointer) only.
 * Attach to a wrapper element without CSS transition classes.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.25) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !hasFinePointer()) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      animate(el, {
        translateX: dx * strength,
        translateY: dy * strength,
        duration: 300,
        ease: 'out(3)',
      });
    };
    const onLeave = () => {
      animate(el, {
        translateX: 0,
        translateY: 0,
        duration: 550,
        ease: 'outElastic(1, .55)',
      });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      utils.set(el, { translateX: 0, translateY: 0 });
    };
  }, [strength]);

  return ref;
}
