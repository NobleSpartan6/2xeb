/**
 * Frame-rate independence and render budgets for the full-screen scenes.
 *
 * Browsers pick the requestAnimationFrame cadence, not us: 120 Hz on ProMotion,
 * 60 on most monitors, and 30 under power saving (Chrome Energy Saver, Edge
 * efficiency mode, Safari and iOS Low Power Mode). Motion written as "cover 8%
 * of the distance per frame" runs at half speed at 30 fps and double at 120,
 * so every rate in the scenes is per second, and simulations step on real
 * elapsed time.
 */

/**
 * Largest step any simulation takes in one frame. A hitch or a tab coming back
 * from the background resumes where it left off instead of lurching ahead.
 */
export const MAX_STEP = 0.1;

/** Fraction of the remaining distance to close in `dt` seconds at `rate` per second. */
export const approach = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);

/**
 * The per-second rate that matches a per-frame lerp factor tuned at 60 fps,
 * so existing feel carries over exactly at 60 and holds at every other rate.
 */
export const rateFromLerp60 = (factor: number): number => -Math.log(1 - factor) * 60;

/**
 * Widest framebuffer a full-screen scene renders, in device pixels.
 *
 * Every fullscreen pass scales with framebuffer area: a 2560px canvas at DPR
 * 1.5 is 8.3M pixels per frame, enough to drop an integrated GPU to single
 * digits or exhaust it and lose the context. Budgeting the width gives every
 * display comparable per-frame cost. A multiple of the 64px viewport rounding
 * step so the budget and the rounded width can't disagree by a fraction.
 */
export const MAX_RENDER_WIDTH = 2240;

export const budgetDpr = (viewportWidth: number, isMobile: boolean): number => {
  const device = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  if (isMobile) return Math.min(device, 1);
  return Math.max(0.7, Math.min(device, 1.5, MAX_RENDER_WIDTH / viewportWidth));
};

export type Cadence = 'smooth' | 'ok' | 'struggling';

/**
 * Judges smoothness against the beat the browser is actually giving us, not
 * against 60 fps.
 *
 * Under power saving every frame lands on a steady ~33 ms beat and nothing is
 * wrong. A monitor that reads "30 fps, below 50, degrade" strips quality from
 * a scene that is running perfectly, and keeps stripping it. What actually
 * reads as broken is a *missed* beat: a frame that takes well over the
 * cadence. So the cadence is the fast end of recent intervals, and the verdict
 * is how many frames missed it.
 */
export class CadenceMonitor {
  private readonly samples: number[] = [];
  private elapsed = 0;
  /** Seconds of frames per verdict. */
  private readonly window: number;
  /** A frame counts as missed past this multiple of the cadence. */
  private readonly missFactor: number;

  constructor(window = 2, missFactor = 1.6) {
    this.window = window;
    this.missFactor = missFactor;
  }

  /** Feed one frame interval; returns a verdict once per window, else null. */
  sample(dt: number): Cadence | null {
    // Tab switches, occluded windows, and first-frame shader compiles aren't
    // smoothness; they'd poison the window
    if (dt <= 0 || dt > 0.25) return null;
    this.samples.push(dt);
    this.elapsed += dt;
    if (this.elapsed < this.window || this.samples.length < 20) return null;

    const sorted = [...this.samples].sort((a, b) => a - b);
    const beat = sorted[Math.floor(sorted.length * 0.25)];
    let missed = 0;
    for (const s of this.samples) if (s > beat * this.missFactor) missed++;
    const ratio = missed / this.samples.length;

    this.samples.length = 0;
    this.elapsed = 0;
    if (ratio > 0.25) return 'struggling';
    if (ratio < 0.05) return 'smooth';
    return 'ok';
  }

  reset(): void {
    this.samples.length = 0;
    this.elapsed = 0;
  }
}
