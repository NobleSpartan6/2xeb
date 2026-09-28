import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConsoleLane } from '../../lib/types';
import { TAKE_MAX, type Take, type TakeDirector } from './types';

const toNdc = (clientX: number, clientY: number) => ({
  x: (clientX / window.innerWidth) * 2 - 1,
  y: -(clientY / window.innerHeight) * 2 + 1,
});

/**
 * Records a take: pointer path, clicks and discipline focus, timestamped from
 * REC. Input only, so recording adds no rendering cost at all.
 */
export function useTakeRecorder(director: React.RefObject<TakeDirector | null>) {
  const session = useRef<{ start: number; take: Take } | null>(null);
  const [recording, setRecording] = useState(false);
  const [take, setTake] = useState<Take | null>(null);
  const [startedAt, setStartedAt] = useState(0);

  const elapsed = () => (session.current ? (performance.now() - session.current.start) / 1000 : 0);

  const stop = useCallback(() => {
    const s = session.current;
    if (!s) return;
    session.current = null;
    s.take.duration = Math.min(TAKE_MAX, (performance.now() - s.start) / 1000);
    setRecording(false);
    // Under half a second there's nothing to develop; treat it as a misclick
    if (s.take.duration >= 0.5) setTake(s.take);
  }, []);

  const start = useCallback(
    (clientX: number, clientY: number, focus: ConsoleLane | null) => {
      const d = director.current;
      if (!d || session.current) return;
      const now = performance.now();
      session.current = {
        start: now,
        take: {
          duration: 0,
          sceneStart: d.now(),
          pointer: [{ t: 0, ...toNdc(clientX, clientY) }],
          pulses: [],
          focus: [{ t: 0, lane: focus }],
        },
      };
      setStartedAt(now);
      setRecording(true);
    },
    [director]
  );

  useEffect(() => {
    if (!recording) return;
    const onMove = (e: PointerEvent) => {
      const s = session.current;
      if (!s) return;
      s.take.pointer.push({ t: (performance.now() - s.start) / 1000, ...toNdc(e.clientX, e.clientY) });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    const limit = window.setTimeout(stop, TAKE_MAX * 1000);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.clearTimeout(limit);
    };
  }, [recording, stop]);

  const recordPulse = useCallback((nx: number, ny: number) => {
    const s = session.current;
    if (s) s.take.pulses.push({ t: (performance.now() - s.start) / 1000, nx, ny });
  }, []);

  const recordFocus = useCallback((lane: ConsoleLane | null) => {
    const s = session.current;
    if (s) s.take.focus.push({ t: (performance.now() - s.start) / 1000, lane });
  }, []);

  const clear = useCallback(() => setTake(null), []);

  return { recording, startedAt, take, start, stop, clear, recordPulse, recordFocus, elapsed };
}
