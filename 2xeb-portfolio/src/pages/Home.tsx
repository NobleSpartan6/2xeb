import React from 'react';
import { Link } from 'react-router-dom';
import SystemConsoleScene from '../3d/SystemConsoleScene';
import { useConsole } from '../context/ConsoleContext';
import { ConsoleLane } from '../lib/types';

const Home: React.FC = () => {
  const { setFocusedDiscipline, setIsAgentOpen } = useConsole();
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">
      
      {/* 3D Background Layer */}
      <div className="absolute inset-0 z-0">
         <SystemConsoleScene />
      </div>

      {/* Vignette & Grain */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-20 mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)]"></div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-center px-6 md:px-12 lg:px-24 pb-16">
        <div className="max-w-6xl space-y-8">
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-[1px] bg-[#2563EB]"></div>
            <span className="text-[#2563EB] font-mono text-[10px] font-bold uppercase tracking-[0.4em]">System Console / 2025</span>
          </div>

          {/* Main Typography with Interactive Hovers */}
        <h1
          className="font-bold font-space-grotesk text-white leading-[0.9] tracking-tighter mix-blend-difference pointer-events-auto select-none"
          style={{ fontSize: 'clamp(3.2rem, 8vw + 0.5rem, 10rem)' }}
        >
            <span 
              className="block hover:text-[#F59E0B] transition-colors duration-300 cursor-default"
              onMouseEnter={() => setFocusedDiscipline(ConsoleLane.DESIGN)}
              onMouseLeave={() => setFocusedDiscipline(null)}
            >
              DESIGN
            </span>
            <span 
              className="block hover:text-[#06B6D4] transition-colors duration-300 cursor-default"
              onMouseEnter={() => setFocusedDiscipline(ConsoleLane.CODE)}
              onMouseLeave={() => setFocusedDiscipline(null)}
            >
              CODE
            </span>
            <span 
              className="block hover:text-[#84CC16] transition-colors duration-300 cursor-default"
              onMouseEnter={() => setFocusedDiscipline(ConsoleLane.VISION)}
              onMouseLeave={() => setFocusedDiscipline(null)}
            >
              VISION
            </span>
          </h1>

          <div className="flex flex-col md:flex-row md:items-end gap-8 md:gap-12 pt-4 pointer-events-auto">
            <p className="text-white/60 text-lg md:text-xl max-w-xl font-light leading-relaxed font-sans backdrop-blur-sm">
              A multidisciplinary universe. <br/>Hover above to explore the system.
            </p>

            <div className="flex gap-3 sm:gap-4">
              <Link 
                to="/work" 
                className="group relative px-7 sm:px-8 py-4 bg-[#2563EB] overflow-hidden transition-all hover:scale-105 border border-[#2563EB]"
              >
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative font-bold tracking-widest text-xs uppercase text-white group-hover:text-black transition-colors z-10">View Work</span>
              </Link>
              <button 
                onClick={() => setIsAgentOpen(true)}
                className="group px-7 sm:px-8 py-4 border border-white/20 hover:border-[#2563EB] backdrop-blur-md transition-all hover:scale-105 bg-black/30 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#2563EB]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="font-bold tracking-widest text-xs uppercase text-white">Ask EB</span>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Home;