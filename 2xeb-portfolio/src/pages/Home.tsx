import React, { useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImmersiveScene from '../3d/ImmersiveScene';
import { useConsole } from '../context/ConsoleContext';
import { ConsoleLane } from '../lib/types';

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
  const { focusedDiscipline, setFocusedDiscipline, setIsAgentOpen } = useConsole();
  const [sceneReady, setSceneReady] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const clock = useLiveClock();
  const nowPlaying = useSpotifyNowPlaying();

  // Coordinated reveal: wait for 3D scene, then fade in content
  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
    // Small delay after scene ready for smooth transition
    setTimeout(() => setContentVisible(true), 150);
  }, []);

  // Hover only for mouse (not touch)
  const handleDisciplineHover = useCallback((lane: ConsoleLane | null, e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      setFocusedDiscipline(lane);
    }
  }, [setFocusedDiscipline]);

  // Tap to toggle on mobile
  const handleDisciplineClick = useCallback((lane: ConsoleLane) => {
    setFocusedDiscipline(prev => prev === lane ? null : lane);
  }, [setFocusedDiscipline]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#050505]" style={{ minHeight: '-webkit-fill-available' }}>

      {/* 3D Background - Full Screen Immersive */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${sceneReady ? 'opacity-100' : 'opacity-0'}`}>
        <ImmersiveScene onReady={handleSceneReady} />
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

      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 z-10 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content Layer */}
      <div
        className={`absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-1000 ease-out ${
          contentVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setFocusedDiscipline(null)}
      >
        {/* Top Section - Live Status */}
        <div className="px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 3xl:px-32 pt-20 sm:pt-24 md:pt-32 2xl:pt-36 3xl:pt-40 flex-shrink-0">
          <div className="flex items-start gap-2 sm:gap-3 pointer-events-none">
            <div className="w-5 sm:w-8 h-[1px] bg-[#2563EB] flex-shrink-0 mt-[4px] sm:mt-[6px]" />
            <div className="font-mono text-[7px] sm:text-[9px] md:text-[10px] 2xl:text-[11px] 3xl:text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.3em]">
              {/* Desktop: single line */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-[#A3A3A3]">NYC</span>
                <span className="text-[#525252]">·</span>
                <span className="text-[#A3A3A3]">{clock || '...'}</span>
                {nowPlaying && (
                  <>
                    <span className="text-[#525252]">·</span>
                    <span className="text-[#2563EB]">♪ {nowPlaying}</span>
                  </>
                )}
              </div>
              {/* Mobile/Tablet: compact */}
              <div className="md:hidden flex flex-col gap-0.5 max-w-[260px]">
                <span className="text-[#A3A3A3]">{clock || '...'}</span>
                {nowPlaying && (
                  <span className="text-[#2563EB] truncate">♪ {nowPlaying}</span>
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
                  className="block transition-all duration-500 ease-out cursor-pointer pointer-events-auto active:scale-[0.98]"
                  style={{
                    fontSize: 'clamp(2.75rem, 10vw, 14rem)',
                    color: focusedDiscipline === lane ? color : '#ffffff',
                    opacity: focusedDiscipline && focusedDiscipline !== lane ? 0.15 : 1,
                    transform: focusedDiscipline === lane ? 'translateX(8px)' : 'translateX(0)',
                    textShadow: focusedDiscipline === lane ? `0 0 80px ${color}40` : 'none',
                  }}
                  onPointerEnter={(e) => handleDisciplineHover(lane, e)}
                  onPointerLeave={(e) => handleDisciplineHover(null, e)}
                  onClick={(e) => { e.stopPropagation(); handleDisciplineClick(lane); }}
                >
                  {label}
                </span>
              ))}
            </h1>

            {/* Discipline description that appears on hover/tap */}
            <div
              className="h-5 sm:h-8 2xl:h-10 mt-3 sm:mt-6 2xl:mt-8 3xl:mt-10 overflow-hidden transition-all duration-300"
              style={{ opacity: focusedDiscipline ? 1 : 0 }}
            >
              {DISCIPLINES.map(({ lane, description, color }) => (
                <p
                  key={lane}
                  className="font-mono text-[10px] sm:text-xs 2xl:text-sm 3xl:text-base tracking-widest uppercase transition-all duration-300"
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
        <div className="px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 3xl:px-32 pb-20 sm:pb-6 md:pb-16 2xl:pb-20 3xl:pb-24 flex-shrink-0">
          <div className="flex flex-col-reverse md:flex-row md:items-end md:justify-between gap-2 sm:gap-4 md:gap-8 2xl:gap-12">
            {/* Description - hidden on mobile to save space */}
            <p className="hidden sm:block text-white/50 text-xs md:text-base 2xl:text-lg 3xl:text-xl max-w-xs md:max-w-md 2xl:max-w-lg 3xl:max-w-xl font-light leading-relaxed pointer-events-none">
              A multidisciplinary portfolio exploring the intersection of software engineering,
              machine learning, and visual storytelling.
            </p>

            {/* CTAs - rendered first on mobile due to flex-col-reverse */}
            <div className="flex gap-3 2xl:gap-4 pointer-events-auto flex-shrink-0">
              <Link
                to="/work"
                className="group relative px-6 md:px-8 2xl:px-10 3xl:px-12 py-3.5 md:py-4 2xl:py-5 bg-[#2563EB] overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative font-medium tracking-widest text-[10px] md:text-xs 2xl:text-sm uppercase text-white group-hover:text-black transition-colors z-10 whitespace-nowrap">
                  View Work
                </span>
              </Link>

              <button
                onClick={() => setIsAgentOpen(true)}
                className="group px-6 md:px-8 2xl:px-10 3xl:px-12 py-3.5 md:py-4 2xl:py-5 border border-white/20 hover:border-[#2563EB] backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] bg-black/20 flex items-center gap-2 2xl:gap-3"
              >
                <span className="font-medium tracking-widest text-[10px] md:text-xs 2xl:text-sm uppercase text-white">
                  ASK
                </span>
                <div className="w-5 h-5 md:w-6 md:h-6 2xl:w-7 2xl:h-7 bg-[#0A0A0A] border border-white/30 grid place-items-center">
                  <span className="text-[#2563EB] font-bold text-[9px] md:text-[10px] 2xl:text-[11px] font-space-grotesk tracking-tight">
                    EB
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Corner accent lines - Swiss precision detail */}
      <div className="absolute top-8 left-8 2xl:top-12 2xl:left-12 3xl:top-16 3xl:left-16 w-12 h-12 2xl:w-16 2xl:h-16 3xl:w-20 3xl:h-20 border-l border-t border-white/10 pointer-events-none z-20" />
      <div className="absolute bottom-8 right-8 2xl:bottom-12 2xl:right-12 3xl:bottom-16 3xl:right-16 w-12 h-12 2xl:w-16 2xl:h-16 3xl:w-20 3xl:h-20 border-r border-b border-white/10 pointer-events-none z-20" />
    </div>
  );
};

export default Home;
