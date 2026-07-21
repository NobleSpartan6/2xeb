import React, { useCallback, useState, useEffect, useLayoutEffect, useRef, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { createTimeline, stagger, utils } from 'animejs';
import { useConsole } from '../context/ConsoleContext';
import { ConsoleLane } from '../lib/types';
import { prefersReducedMotion, useMagnetic, hasRouteRevealPlayed, markRouteRevealPlayed } from '../hooks/useAnimations';

// Lazy load the 3D scene so three.js/R3F stay out of the main bundle —
// the UI shell paints immediately while the scene streams in
const ImmersiveScene = lazy(() => import('../3d/ImmersiveScene'));

// Hook for periodic terminal hint - shows a subtle cursor periodically
const useTerminalHint = () => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Show hint after 8 seconds, then periodically every 30 seconds
    const initialDelay = setTimeout(() => {
      setShowHint(true);
      // Hide after 4 seconds
      setTimeout(() => setShowHint(false), 4000);
    }, 8000);

    const interval = setInterval(() => {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 4000);
    }, 30000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return showHint;
};

// Hook for timestamp terminal hint - appears periodically next to the clock
const useTimestampHint = () => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // First appearance after 15 seconds, then every 45 seconds
    // Offset from main hint to avoid overlap
    const initialDelay = setTimeout(() => {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 3000);
    }, 15000);

    const interval = setInterval(() => {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 3000);
    }, 45000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return showHint;
};

// --- REALTIME HOOKS ---

// Live clock in EST timezone
const useLiveClock = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const t = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/New_York',
      });
      setTime(t + ' EST');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
};

// Spotify now playing - polls Edge Function
const useSpotifyNowPlaying = () => {
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const baseUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
        if (!baseUrl) return;

        const res = await fetch(`${baseUrl}/spotify-now-playing`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.isPlaying && data.track && data.artist) {
          setNowPlaying(`${data.track} — ${data.artist}`);
        } else {
          setNowPlaying(null);
        }
      } catch {
        // Silently fail - show IDLE
        setNowPlaying(null);
      }
    };

    // Initial fetch
    fetchNowPlaying();

    // Poll every 30 seconds
    const id = setInterval(fetchNowPlaying, 30000);
    return () => clearInterval(id);
  }, []);

  return nowPlaying;
};

// Discipline data for hover states
const DISCIPLINES = [
  { lane: ConsoleLane.CODE, label: 'CODE', color: '#06B6D4', description: 'Software Engineering' },
  { lane: ConsoleLane.VISION, label: 'VISION', color: '#84CC16', description: 'Machine Learning & AI' },
  { lane: ConsoleLane.DESIGN, label: 'DESIGN', color: '#F59E0B', description: 'Video Production' },
] as const;

const Home: React.FC = () => {
  const { focusedDiscipline, setFocusedDiscipline, setIsAgentOpen, setIsEasterEggActive } = useConsole();
  const [sceneReady, setSceneReady] = useState(false);
  // Click shockwave signal for the 3D grid (NDC coords + timestamp)
  const [scenePulse, setScenePulse] = useState<{ nx: number; ny: number; t: number } | null>(null);
  const clock = useLiveClock();
  const nowPlaying = useSpotifyNowPlaying();
  const showTerminalHint = useTerminalHint();
  const showTimestampHint = useTimestampHint();
  const contentRef = useRef<HTMLDivElement>(null);
  const workCtaRef = useMagnetic<HTMLDivElement>();
  const askCtaRef = useMagnetic<HTMLDivElement>();

  // Entrance choreography: hero letters cascade in, then status bar and CTAs.
  // Starts on mount — content never waits for the 3D scene (it fades in
  // behind). Plays once per session; revisits via the nav render instantly.
  useLayoutEffect(() => {
    const root = contentRef.current;
    if (!root || prefersReducedMotion() || hasRouteRevealPlayed()) return;
    markRouteRevealPlayed();

    const letters = root.querySelectorAll('.hero-letter');
    const status = root.querySelectorAll('[data-hero-status]');
    const footer = root.querySelectorAll('[data-hero-footer]');

    const all = [...letters, ...status, ...footer] as HTMLElement[];

    // Hide everything synchronously before first paint to avoid a flash,
    // and suspend CSS transitions so they don't fight the animation
    utils.set(all, { opacity: 0 });
    all.forEach((el) => {
      el.style.transition = 'none';
    });

    const tl = createTimeline({
      defaults: { ease: 'outExpo' },
      // Clear inline styles afterwards so Tailwind transitions and hover
      // transforms (e.g. hover:scale on the CTAs) work again
      onComplete: () => {
        all.forEach((el) => {
          el.style.transform = '';
          el.style.opacity = '';
          el.style.transition = '';
        });
      },
    });
    tl.add(letters, {
      opacity: [0, 1],
      translateY: ['0.45em', '0em'],
      duration: 600,
      delay: stagger(14),
    })
      .add(status, { opacity: [0, 1], translateY: [-10, 0], duration: 400 }, '-=500')
      .add(
        footer,
        { opacity: [0, 1], translateY: [16, 0], duration: 500, delay: stagger(60) },
        '-=450'
      );
  }, []);

  // The 3D scene fades itself in behind the content once WebGL is ready
  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  // Hover only for mouse (not touch)
  const handleDisciplineHover = useCallback((lane: ConsoleLane | null, e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      setFocusedDiscipline(lane);
    }
  }, [setFocusedDiscipline]);

  // Tap to toggle on mobile
  const handleDisciplineClick = useCallback((lane: ConsoleLane) => {
    setFocusedDiscipline(focusedDiscipline === lane ? null : lane);
  }, [focusedDiscipline, setFocusedDiscipline]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#050505]" style={{ minHeight: '-webkit-fill-available' }}>

      {/* 3D Background - Full Screen Immersive */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ease-out-strong ${sceneReady ? 'opacity-100' : 'opacity-0'}`}>
        <Suspense fallback={null}>
          <ImmersiveScene onReady={handleSceneReady} pulse={scenePulse} />
        </Suspense>
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050505] to-transparent" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050505] to-transparent" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,#050505_100%)]" />
      </div>

      {/* (grain texture now lives in App's MainLayout so every page shares it) */}

      {/* Content Layer - never gated on the 3D scene */}
      <div
        ref={contentRef}
        className="absolute inset-0 z-20 flex flex-col justify-between"
        onClick={(e) => {
          setFocusedDiscipline(null);
          // Fire a shockwave through the grid from the click point
          setScenePulse({
            nx: (e.clientX / window.innerWidth) * 2 - 1,
            ny: -((e.clientY / window.innerHeight) * 2 - 1),
            t: Date.now(),
          });
        }}
      >
        {/* Terminal Hint - Periodic subtle cursor */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEasterEggActive(true);
          }}
          className={`
            fixed top-[100px] sm:top-[110px] md:top-[136px] right-6 md:right-12 lg:right-16 z-30
            font-mono text-[10px] sm:text-xs text-[#2563EB]/60 hover:text-[#2563EB]
            transition-[opacity,transform,color] duration-300 ease-out-strong pointer-events-auto
            ${showTerminalHint ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}
          `}
          title="Hello, friend."
        >
          <span className="flex items-center gap-1">
            <span className="animate-pulse">&gt;_</span>
            <span className="hidden sm:inline text-[#525252] text-[9px]">type friend</span>
          </span>
        </button>

        {/* Top Section - Live Status */}
        <div className="px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 3xl:px-32 pt-[100px] sm:pt-[110px] md:pt-[136px] 2xl:pt-[148px] 3xl:pt-[160px] flex-shrink-0">
          <div data-hero-status className="flex items-start gap-2 sm:gap-3">
            <div className="w-5 sm:w-8 h-[1px] bg-[#2563EB] flex-shrink-0 mt-[4px] sm:mt-[6px] pointer-events-none" />
            <div className="font-mono text-[8px] sm:text-[9px] md:text-[10px] 2xl:text-[11px] 3xl:text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.3em]">
              {/* Desktop: single line */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-[#A3A3A3] pointer-events-none">NYC</span>
                <span className="text-[#525252] pointer-events-none">·</span>
                <span className="text-[#A3A3A3] pointer-events-none">{clock || '...'}</span>
                {/* Terminal cursor hint - appears periodically, clickable */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEasterEggActive(true);
                  }}
                  className={`
                    text-[#2563EB]/60 hover:text-[#2563EB] transition-[opacity,transform,color] duration-300 ease-out-strong
                    pointer-events-auto cursor-pointer
                    ${showTimestampHint ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
                  `}
                  title="Hello, friend."
                >
                  <span className="animate-pulse">&gt;_</span>
                </button>
                {nowPlaying && (
                  <>
                    <span className="text-[#525252] pointer-events-none">·</span>
                    <span className="text-[#2563EB] pointer-events-none">♪ {nowPlaying}</span>
                  </>
                )}
              </div>
              {/* Mobile/Tablet: compact */}
              <div className="flex md:hidden flex-col gap-0.5 max-w-[260px]">
                <div className="flex items-center gap-2">
                  <span className="text-[#A3A3A3] pointer-events-none">{clock || '...'}</span>
                  {/* Terminal cursor hint - mobile */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEasterEggActive(true);
                    }}
                    className={`
                      text-[#2563EB]/60 hover:text-[#2563EB] transition-[opacity,transform,color] duration-300 ease-out-strong
                      pointer-events-auto cursor-pointer
                      ${showTimestampHint ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
                    `}
                    title="Hello, friend."
                  >
                    <span className="animate-pulse">&gt;_</span>
                  </button>
                </div>
                {nowPlaying && (
                  <span className="text-[#2563EB] truncate pointer-events-none">♪ {nowPlaying}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Main Typography */}
        <div className="flex-grow md:flex-1 flex items-center px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 3xl:px-32 min-h-0">
          <div className="w-full max-w-7xl 2xl:max-w-[1400px] 3xl:max-w-[1800px]">
            <h1 className="font-space-grotesk font-bold leading-[0.85] tracking-tighter select-none">
              {DISCIPLINES.map(({ lane, label, color }) => (
                <span
                  key={lane}
                  className="block transition-[color,opacity,transform,text-shadow] duration-300 ease-in-out-strong cursor-pointer pointer-events-auto"
                  style={{
                    fontSize: 'clamp(2.25rem, 8vw, 14rem)',
                    color: focusedDiscipline === lane ? color : '#ffffff',
                    opacity: focusedDiscipline && focusedDiscipline !== lane ? 0.15 : 1,
                    transform: focusedDiscipline === lane ? 'translateX(8px)' : 'translateX(0)',
                    textShadow: focusedDiscipline === lane ? `0 0 80px ${color}40` : 'none',
                  }}
                  onPointerEnter={(e) => handleDisciplineHover(lane, e)}
                  onPointerLeave={(e) => handleDisciplineHover(null, e)}
                  onClick={(e) => { e.stopPropagation(); handleDisciplineClick(lane); }}
                >
                  {label.split('').map((char, i) => (
                    <span key={i} className="hero-letter inline-block will-change-transform">
                      {char}
                    </span>
                  ))}
                </span>
              ))}
            </h1>

            {/* Discipline description that appears on hover/tap */}
            <div
              className="h-5 sm:h-8 2xl:h-10 mt-3 sm:mt-6 2xl:mt-8 3xl:mt-10 overflow-hidden transition-opacity duration-300"
              style={{ opacity: focusedDiscipline ? 1 : 0 }}
            >
              {DISCIPLINES.map(({ lane, description, color }) => (
                <p
                  key={lane}
                  className="font-mono text-[10px] sm:text-xs 2xl:text-sm 3xl:text-base tracking-widest uppercase transition-[opacity,transform] duration-300 ease-out-strong"
                  style={{
                    color: color,
                    opacity: focusedDiscipline === lane ? 1 : 0,
                    transform: focusedDiscipline === lane ? 'translateY(0)' : 'translateY(-100%)',
                    position: focusedDiscipline === lane ? 'relative' : 'absolute',
                  }}
                >
                  {description}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section - CTA & Description */}
        <div className="px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 3xl:px-32 pb-32 sm:pb-28 md:pb-24 lg:pb-24 2xl:pb-28 3xl:pb-32 flex-shrink-0">
          <div className="flex flex-col-reverse md:flex-row md:items-end md:justify-between gap-1.5 sm:gap-4 md:gap-8 2xl:gap-12">
            {/* Identity + description */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <p data-hero-footer className="font-mono text-[9px] sm:text-[10px] md:text-[11px] 2xl:text-xs uppercase tracking-[0.2em] text-[#A3A3A3] pointer-events-none">
                Ebenezer Eshetu <span className="text-[#525252]">·</span>{' '}
                <span className="text-[#2563EB]">2XEB</span> <span className="text-[#525252]">·</span>{' '}
                Engineer <span className="text-[#525252]">×</span> Filmmaker
              </p>
              <p data-hero-footer className="text-white/40 text-[10px] sm:text-xs md:text-base 2xl:text-lg 3xl:text-xl max-w-[260px] sm:max-w-xs md:max-w-md 2xl:max-w-lg 3xl:max-w-xl font-light leading-snug sm:leading-relaxed pointer-events-none">
                A multidisciplinary portfolio exploring the intersection of software engineering,
                machine learning, and visual storytelling.
              </p>
            </div>

            {/* CTAs - rendered first on mobile due to flex-col-reverse.
                Magnetic wrappers pull the buttons toward the cursor on desktop. */}
            <div className="flex gap-3 2xl:gap-4 pointer-events-auto flex-shrink-0">
              <div ref={workCtaRef} data-hero-footer>
                <Link
                  to="/work"
                  className="group relative px-6 md:px-8 2xl:px-10 3xl:px-12 py-3.5 md:py-4 2xl:py-5 bg-[#2563EB] overflow-hidden pressable flex items-center justify-center h-full"
                >
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out-strong" />
                  <span className="relative font-medium tracking-widest text-[11px] md:text-xs 2xl:text-sm uppercase text-white group-hover:text-black transition-colors z-10 whitespace-nowrap">
                    View Work
                  </span>
                </Link>
              </div>

              <div ref={askCtaRef} data-hero-footer>
                <button
                  onClick={() => setIsAgentOpen(true)}
                  className="group px-6 md:px-8 2xl:px-10 3xl:px-12 py-3.5 md:py-4 2xl:py-5 border border-white/20 hover:border-[#2563EB] backdrop-blur-sm pressable bg-black/20 flex items-center gap-2 2xl:gap-3 h-full"
                >
                  <span className="font-medium tracking-widest text-[11px] md:text-xs 2xl:text-sm uppercase text-white">
                    ASK
                  </span>
                  <div className="w-5 h-5 md:w-6 md:h-6 2xl:w-7 2xl:h-7 bg-[#0A0A0A] border border-white/30 grid place-items-center">
                    <span className="text-[#2563EB] font-bold text-[10px] md:text-[10px] 2xl:text-[11px] font-space-grotesk tracking-tight">
                      EB
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
