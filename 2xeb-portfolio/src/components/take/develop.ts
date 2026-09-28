import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  getFirstEncodableVideoCodec,
} from 'mediabunny';
import { ConsoleLane } from '../../lib/types';
import { approach } from '../../3d/frame';
import type { Take, TakeDirector } from './types';

/**
 * Developing a take: the hero re-renders the recorded input at a locked 60 fps
 * into a 4:5 frame (Instagram's tallest feed crop, fine on X), each frame gets
 * the hero's type and a slate composited on, and WebCodecs encodes it to H.264.
 * Nothing leaves the device. Lazy chunk: mediabunny only loads on first REC.
 */

export const TAKE_WIDTH = 1080;
export const TAKE_HEIGHT = 1350;
export const TAKE_FPS = 60;
/** Where a clip that travels without its caption points back to. */
const SITE = '2XEB.ME';

const BG = '#050505';
const LANES = [
  { lane: ConsoleLane.CODE, label: 'CODE', color: '#06B6D4' },
  { lane: ConsoleLane.VISION, label: 'VISION', color: '#84CC16' },
  { lane: ConsoleLane.DESIGN, label: 'DESIGN', color: '#F59E0B' },
] as const;
const MONO = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace';

const timecode = (frame: number, fps: number): string => {
  const s = Math.floor(frame / fps);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `00:00:${pad(s)}:${pad(frame % fps)}`;
};

const mix = (a: string, b: string, t: number): string => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

/**
 * The DOM layers the WebGL canvas doesn't contain: the hero's fades and
 * vignette, CODE / VISION / DESIGN with the same focus behaviour as the page
 * (focused lane takes its colour and nudges right, the others drop to 15%),
 * and a slate that brands the clip wherever it ends up.
 */
class Slate {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly takeNumber: number;
  private readonly focus = new Map<ConsoleLane, number>(LANES.map((l) => [l.lane, 0]));
  private anyFocus = 0;

  constructor(ctx: CanvasRenderingContext2D, takeNumber: number) {
    this.ctx = ctx;
    this.takeNumber = takeNumber;
  }

  draw(frame: number, total: number, lane: ConsoleLane | null) {
    const { ctx } = this;
    const W = TAKE_WIDTH;
    const H = TAKE_HEIGHT;
    const dt = 1 / TAKE_FPS;
    // The page transitions focus over 300ms; ease the same way
    const k = approach(12, dt);
    for (const l of LANES) {
      const w = this.focus.get(l.lane)!;
      this.focus.set(l.lane, w + ((lane === l.lane ? 1 : 0) - w) * k);
    }
    this.anyFocus += ((lane ? 1 : 0) - this.anyFocus) * k;

    // Fades and vignette, as on the hero
    let g = ctx.createLinearGradient(0, 0, 0, 260);
    g.addColorStop(0, BG);
    g.addColorStop(1, 'rgba(5,5,5,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 260);
    g = ctx.createLinearGradient(0, H - 420, 0, H);
    g.addColorStop(0, 'rgba(5,5,5,0)');
    g.addColorStop(1, BG);
    ctx.fillStyle = g;
    ctx.fillRect(0, H - 420, W, 420);
    const v = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, 'rgba(5,5,5,0)');
    v.addColorStop(1, 'rgba(5,5,5,0.9)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);

    // Status line: the hero's blue rule, then the take where the clock sits
    const pad = 80;
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(pad, 150, 56, 2);
    ctx.font = `500 22px ${MONO}`;
    ctx.letterSpacing = '6px';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#A3A3A3';
    ctx.fillText(`TAKE ${String(this.takeNumber).padStart(3, '0')}`, pad + 76, 151);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#737373';
    ctx.fillText(timecode(frame, TAKE_FPS), W - pad, 151);
    ctx.textAlign = 'left';

    // CODE / VISION / DESIGN
    const size = 184;
    ctx.font = `700 ${size}px "Space Grotesk", sans-serif`;
    ctx.letterSpacing = `${-0.05 * size}px`;
    ctx.textBaseline = 'alphabetic';
    let y = 300 + size * 0.72;
    for (const l of LANES) {
      const w = this.focus.get(l.lane)!;
      ctx.save();
      ctx.globalAlpha = 1 - 0.85 * Math.max(0, this.anyFocus - w);
      if (w > 0.01) {
        ctx.shadowColor = `${l.color}${Math.round(0x40 * w).toString(16).padStart(2, '0')}`;
        ctx.shadowBlur = 80;
      }
      ctx.fillStyle = mix('#ffffff', l.color, w);
      ctx.fillText(l.label, pad - 6 + 12 * w, y);
      ctx.restore();
      y += size * 0.85;
    }

    // Identity line and the way back
    ctx.font = `500 20px ${MONO}`;
    ctx.letterSpacing = '4px';
    ctx.textBaseline = 'middle';
    const base = H - 110;
    const parts: [string, string][] = [
      ['EBENEZER ESHETU', '#A3A3A3'],
      [' · ', '#525252'],
      ['ENGINEER', '#A3A3A3'],
      [' × ', '#525252'],
      ['FILMMAKER', '#A3A3A3'],
    ];
    let x = pad;
    for (const [text, color] of parts) {
      ctx.fillStyle = color;
      ctx.fillText(text, x, base);
      x += ctx.measureText(text).width;
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2563EB';
    ctx.fillText(SITE, W - pad, base);
    ctx.textAlign = 'left';
    ctx.letterSpacing = '0px';

    // In from black, out to black, so the clip loops without a hard cut
    const fade = Math.min(1, frame / 8, (total - 1 - frame) / 16);
    if (fade < 1) {
      ctx.fillStyle = `rgba(5,5,5,${1 - Math.max(0, fade)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

export interface DevelopHandle {
  /** Receives every frame as it's composited — show it while the take develops. */
  master: HTMLCanvasElement;
  onProgress: (done: number, total: number) => void;
  cancelled: () => boolean;
}

export async function developTake(
  take: Take,
  director: TakeDirector,
  takeNumber: number,
  { master, onProgress, cancelled }: DevelopHandle
): Promise<Blob | null> {
  const codec = await getFirstEncodableVideoCodec(['avc', 'vp9', 'av1'], {
    width: TAKE_WIDTH,
    height: TAKE_HEIGHT,
  });
  if (!codec) throw new Error('No video encoder available');

  master.width = TAKE_WIDTH;
  master.height = TAKE_HEIGHT;
  const ctx = master.getContext('2d', { alpha: false })!;
  await Promise.all([
    document.fonts.load(`700 184px "Space Grotesk"`),
    document.fonts.load(`500 22px ${MONO}`),
  ]).catch(() => undefined);

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(master, { codec, bitrate: QUALITY_HIGH, keyFrameInterval: 2 });
  output.addVideoTrack(source, { frameRate: TAKE_FPS });
  await output.start();

  if (cancelled()) {
    await output.cancel();
    return null;
  }
  const slate = new Slate(ctx, takeNumber);
  await director.develop(take, {
    width: TAKE_WIDTH,
    height: TAKE_HEIGHT,
    fps: TAKE_FPS,
    cancelled,
    onFrame: async (gl, { index, total, focus }) => {
      // Synchronous until the first await: the WebGL buffer is only
      // readable in the task that rendered it
      ctx.drawImage(gl, 0, 0, TAKE_WIDTH, TAKE_HEIGHT);
      slate.draw(index, total, focus);
      await source.add(index / TAKE_FPS, 1 / TAKE_FPS);
      onProgress(index + 1, total);
      // Encoder backpressure rarely yields a paint; give the progress UI one
      if (index % 6 === 5) await new Promise((r) => setTimeout(r));
    },
  });

  if (cancelled()) {
    await output.cancel();
    return null;
  }
  await output.finalize();
  const buffer = (output.target as BufferTarget).buffer;
  return buffer ? new Blob([buffer], { type: 'video/mp4' }) : null;
}
