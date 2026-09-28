import React, { useEffect, useRef, useState } from 'react';
import type { Take, TakeDirector } from './types';
import { developTake, TAKE_FPS, TAKE_HEIGHT, TAKE_WIDTH } from './develop';

interface TakeOverlayProps {
  take: Take;
  director: React.RefObject<TakeDirector | null>;
  onClose: () => void;
}

type Phase =
  | { kind: 'developing'; done: number; total: number }
  | { kind: 'ready'; url: string; file: File; canShare: boolean }
  | { kind: 'failed' };

/** Per-visitor take counter, like a slate. Storage can be unavailable; then it's take 1. */
const nextTakeNumber = (): number => {
  try {
    const n = Number(localStorage.getItem('2xeb-take') ?? 0) + 1;
    localStorage.setItem('2xeb-take', String(n));
    return n;
  } catch {
    return 1;
  }
};

/**
 * The darkroom. The take develops in front of the visitor: the composited
 * frames are drawn straight into the preview as they encode, so the wait is
 * the show. Then the clip plays back on loop with Share (phones: the system
 * sheet, straight to Instagram or X) or Save.
 */
const TakeOverlay: React.FC<TakeOverlayProps> = ({ take, director, onClose }) => {
  const [phase, setPhase] = useState<Phase>({ kind: 'developing', done: 0, total: 1 });
  const [takeNumber] = useState(nextTakeNumber);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = director.current;
    const host = frameRef.current;
    if (!d || !host) {
      setPhase({ kind: 'failed' });
      return;
    }
    // Per run, not a shared ref: StrictMode's mount-unmount-mount must cancel
    // the first develop, never revive it
    let dead = false;
    const master = document.createElement('canvas');
    master.className = 'w-full h-full';
    host.appendChild(master);
    let url = '';

    developTake(take, d, takeNumber, {
      master,
      cancelled: () => dead,
      onProgress: (done, total) => setPhase({ kind: 'developing', done, total }),
    })
      .then((blob) => {
        if (!blob || dead) return;
        const name = `2xeb-take-${String(takeNumber).padStart(3, '0')}.mp4`;
        const file = new File([blob], name, { type: 'video/mp4' });
        const canShare = !!navigator.canShare?.({ files: [file] });
        url = URL.createObjectURL(blob);
        setPhase({ kind: 'ready', url, file, canShare });
      })
      .catch((err) => {
        console.warn('[take] develop failed', err);
        if (!dead) setPhase({ kind: 'failed' });
      })
      .finally(() => master.remove());

    return () => {
      dead = true;
      master.remove();
      if (url) URL.revokeObjectURL(url);
    };
  }, [take, director, takeNumber]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = (file: File, url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
  };

  const share = async (file: File, url: string) => {
    try {
      await navigator.share({ files: [file], title: '2XEB', text: '2xeb.me' });
    } catch (err) {
      // Dismissing the sheet is an AbortError, not a failure
      if ((err as DOMException)?.name !== 'AbortError') save(file, url);
    }
  };

  const label = `TAKE ${String(takeNumber).padStart(3, '0')}`;
  const progress = phase.kind === 'developing' ? phase.done / phase.total : 1;

  return (
    <div
      className="fixed inset-0 z-[150] bg-[#050505]/95 backdrop-blur-sm flex items-center justify-center p-6 animate-modal-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${label}, ${phase.kind === 'ready' ? 'ready' : 'developing'}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[min(420px,calc((100dvh-220px)*0.8))] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em]">
          <span className="flex items-center gap-2 text-[#A3A3A3]">
            <span className="w-5 h-px bg-[#2563EB]" />
            {label}
          </span>
          <span className="text-[#525252] tabular-nums">
            {phase.kind === 'developing'
              ? `${String(phase.done).padStart(3, '0')} / ${phase.total}`
              : `${TAKE_WIDTH}×${TAKE_HEIGHT} · ${TAKE_FPS} FPS`}
          </span>
        </div>

        <div className="relative aspect-[4/5] w-full bg-black border border-[#262626] overflow-hidden">
          <div ref={frameRef} className={phase.kind === 'ready' ? 'hidden' : 'absolute inset-0'} />
          {phase.kind === 'ready' && (
            <video
              src={phase.url}
              className="absolute inset-0 w-full h-full"
              autoPlay
              loop
              muted
              playsInline
            />
          )}
          {phase.kind === 'failed' && (
            <p className="absolute inset-0 grid place-items-center px-8 text-center font-mono text-xs text-[#737373]">
              This browser can't develop a take. Try Chrome, Edge or Safari.
            </p>
          )}
        </div>

        {/* Developing: a hairline that fills; ready: the actions */}
        {phase.kind === 'developing' && (
          <div className="flex flex-col gap-2">
            <div className="h-px w-full bg-[#262626] overflow-hidden">
              <div className="h-full bg-[#2563EB] origin-left" style={{ transform: `scaleX(${progress})` }} />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#525252]">
              Developing at {TAKE_FPS} fps, on this device
            </p>
          </div>
        )}

        {phase.kind === 'ready' && (
          <div className="flex gap-3">
            {phase.canShare && (
              <button
                type="button"
                onClick={() => share(phase.file, phase.url)}
                className="flex-1 py-3.5 bg-[#2563EB] text-white font-medium tracking-widest text-[11px] uppercase pressable"
              >
                Share
              </button>
            )}
            <button
              type="button"
              onClick={() => save(phase.file, phase.url)}
              className={`flex-1 py-3.5 font-medium tracking-widest text-[11px] uppercase pressable ${
                phase.canShare
                  ? 'border border-white/20 text-white hover:border-[#2563EB]'
                  : 'bg-[#2563EB] text-white'
              }`}
            >
              Save .mp4
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="self-center font-mono text-[10px] uppercase tracking-[0.3em] text-[#525252] hover:text-[#A3A3A3] transition-colors duration-150"
        >
          {phase.kind === 'developing' ? 'Cancel' : 'Close'} <span className="text-[#333]">esc</span>
        </button>
      </div>
    </div>
  );
};

export default TakeOverlay;
