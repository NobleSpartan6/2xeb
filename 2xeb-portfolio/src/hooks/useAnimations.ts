import { useLayoutEffect, useRef } from 'react';
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

export interface RevealOptions {
  /** CSS selector for the elements to reveal (default: '[data-animate]') */
  selector?: string;
  /** Vertical travel distance in px (default: 28) */
  y?: number;
  /** Starting scale (default: 1 — no scaling) */
  scale?: number;
  /** Duration per element in ms (default: 900) */
  duration?: number;
  /** Stagger interval between elements revealed together in ms (default: 80) */
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
  const { selector = '[data-animate]', y = 28, scale = 1, duration = 900, interval = 80 } = options;

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (els.length === 0 || prefersReducedMotion()) return;

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
