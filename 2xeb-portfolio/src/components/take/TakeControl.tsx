import React, { useEffect, useRef } from 'react';
import { TAKE_MAX } from './types';

interface TakeControlProps {
  recording: boolean;
  startedAt: number;
  onStart: (e: React.MouseEvent) => void;
  onStop: () => void;
}

/**
 * REC, in the hero's status line, where the clock already reads like
 * timecode. While rolling it becomes the take's timecode and a hairline that
 * fills to the six-second limit. The counter writes its own text node each
 * frame, so the hero tree never re-renders at 60 Hz.
 */
const TakeControl: React.FC<TakeControlProps> = ({ recording, startedAt, onStart, onStop }) => {
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!recording) return;
    let raf = 0;
    const tick = () => {
      const s = Math.min(TAKE_MAX, (performance.now() - startedAt) / 1000);
      const frames = Math.floor((s % 1) * 60);
      if (counter.current) {
        counter.current.textContent = `00:0${Math.floor(s)}:${String(frames).padStart(2, '0')}`;
      }
      if (bar.current) bar.current.style.transform = `scaleX(${s / TAKE_MAX})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [recording, startedAt]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (recording) onStop();
        else onStart(e);
      }}
      // The label is 10px type; the ::after pad gives a thumb-sized target
      // without moving the status line
      className="group relative inline-flex items-center gap-1.5 pointer-events-auto cursor-pointer uppercase after:absolute after:-inset-3 after:content-['']"
      aria-label={recording ? 'Stop recording this take' : 'Record a take: move and click on the grid, get a 60 fps clip'}
      title={recording ? 'Stop' : 'Record a 6-second take of the grid'}
    >
      <span
        className={`w-[6px] h-[6px] rounded-full bg-[#EF4444] transition-opacity duration-150 ${
          recording ? 'animate-pulse' : 'opacity-60 group-hover:opacity-100'
        }`}
      />
      <span
        ref={counter}
        className={`tabular-nums transition-colors duration-150 ${
          recording ? 'text-white' : 'text-[#525252] group-hover:text-[#A3A3A3]'
        }`}
      >
        {recording ? '00:00:00' : 'Rec'}
      </span>
      {recording && (
        <span className="absolute left-0 right-0 -bottom-1.5 h-px bg-white/10 overflow-hidden">
          <span ref={bar} className="block h-full bg-[#EF4444] origin-left" style={{ transform: 'scaleX(0)' }} />
        </span>
      )}
    </button>
  );
};

export default TakeControl;
