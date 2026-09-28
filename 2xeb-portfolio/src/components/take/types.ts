import type { ConsoleLane } from '../../lib/types';

/**
 * A take is the visitor's *input*, not pixels: where the pointer went, where
 * they clicked, which discipline they hovered. Recording it costs nothing per
 * frame, and developing it re-runs the scene at a locked frame rate, so a
 * phone at 30 fps in Low Power Mode still exports a clean 60 fps clip.
 */
export interface Take {
  /** Seconds of input captured. */
  duration: number;
  /** Scene clock when REC was pressed, so the take opens on what they saw. */
  sceneStart: number;
  /** Pointer in NDC (-1..1, y up), seconds from REC. */
  pointer: { t: number; x: number; y: number }[];
  /** Clicks, same space as the hero's shockwave signal. */
  pulses: { t: number; nx: number; ny: number }[];
  /** Discipline hover changes. */
  focus: { t: number; lane: ConsoleLane | null }[];
}

export interface DevelopFrame {
  index: number;
  total: number;
  /** Discipline in focus on this frame, for the type layer. */
  focus: ConsoleLane | null;
}

export interface DevelopOptions {
  width: number;
  height: number;
  fps: number;
  /**
   * Called right after each frame renders, in the same task, while the WebGL
   * drawing buffer is still readable. Copy the canvas before the first await.
   */
  onFrame: (canvas: HTMLCanvasElement, frame: DevelopFrame) => Promise<void>;
  /** Checked between frames; return true to stop early. */
  cancelled?: () => boolean;
}

/** Imperative handle the hero scene exposes for REC and develop. */
export interface TakeDirector {
  /** The scene clock right now. */
  now(): number;
  /** Re-render a take offline, frame by frame, then hand the scene back live. */
  develop(take: Take, options: DevelopOptions): Promise<void>;
}

export const sampleFocus = (take: Take, t: number): ConsoleLane | null => {
  let lane: ConsoleLane | null = null;
  for (const f of take.focus) {
    if (f.t > t) break;
    lane = f.lane;
  }
  return lane;
};

/** WebCodecs encoding is the one hard requirement; everything else is WebGL the hero already needs. */
export const canDevelop = (): boolean =>
  typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window;

/** Longest take, in seconds. Short enough to loop, long enough to draw something. */
export const TAKE_MAX = 6;
