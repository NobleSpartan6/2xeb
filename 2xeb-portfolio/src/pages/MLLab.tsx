import React, { useEffect, useState, useMemo } from 'react';
import AskPortfolioWidget from '../components/AskPortfolioWidget';
import { useProjects } from '../hooks/useProjects';
import ProjectCard from '../components/ProjectCard';
import { Discipline } from '../lib/types';
import { useConsole } from '../context/ConsoleContext';
import { getModelByIdOrDefault } from '../lib/models';

const MLLab: React.FC = () => {
  // Start collapsed on mobile, expanded on desktop
  const [isExpanded, setIsExpanded] = useState(false);
  const { selectedModelId } = useConsole();
  const currentModel = getModelByIdOrDefault(selectedModelId);

  // SWR: static data immediately, DB fetch in background
  const { projects } = useProjects();

  // Ensure we land at the top when navigating to this page
  useEffect(() => {
    window.scrollTo(0, 0);
    // Auto-expand on desktop, collapse on mobile
    const checkScreenSize = () => {
      setIsExpanded(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const mlProjects = useMemo(() => projects.filter(p =>
     p.primaryDiscipline === Discipline.ML ||
     (p.primaryDiscipline === Discipline.HYBRID && p.tags.some(t => ['AI', 'ML'].includes(t))) ||
     // Include Midimix explicitly if needed by slug or logic
     p.slug === 'midimix'
  ), [projects]);

  return (
    <div className="min-h-screen pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-12 max-w-[1600px] mx-auto bg-[#050505]">
      <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
        
        {/* Left Column: Header & Projects */}
        <div className="lg:col-span-7 space-y-10 sm:space-y-12 lg:space-y-20">
          <div>
            <span className="text-[#2563EB] font-mono text-[11px] sm:text-xs uppercase tracking-widest block mb-3 sm:mb-4">Laboratory</span>
            <h1 className="font-bold text-white font-space-grotesk mb-4 sm:mb-6 md:mb-8 tracking-tighter leading-[0.9]" style={{ fontSize: 'clamp(2.2rem, 6vw + 0.5rem, 8rem)' }}>
              MACHINE<br />LEARNING
            </h1>
            <p className="text-[#A3A3A3] text-base sm:text-lg md:text-xl leading-relaxed font-light max-w-2xl border-l border-[#262626] pl-4 sm:pl-6">
              Exploring the intersection of generative AI and creative workflows. 
              Featuring experimental AI projects and the <strong>Portfolio Agent</strong> that powers this site.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8">
              {mlProjects.map(p => (
                <ProjectCard key={p.id} project={p} />
              ))}
          </div>
        </div>

        {/* Right Column: AI Widget sticky */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 h-fit">
          <div className="bg-[#0A0A0A] border border-[#1f2937] overflow-hidden shadow-xl relative transition-all duration-500">
            {/* Blue accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB] to-transparent" />

            {/* Collapsible Header */}
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="w-full h-12 sm:h-14 bg-[#080808] border-b border-[#1f2937] flex items-center justify-between px-4 text-left transition-colors active:bg-[#0d0d0d] lg:hover:bg-[#0d0d0d] touch-manipulation"
              aria-expanded={isExpanded}
              aria-controls="ml-widget-panel"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[11px] sm:text-[11px] uppercase tracking-[0.15em] text-[#a3a3a3]">
                  ASK
                </span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#0A0A0A] border border-[#1f2937] grid place-items-center">
                  <span className="text-[#2563EB] font-bold text-[10px] sm:text-[10px] font-space-grotesk tracking-tight">EB</span>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 sm:w-5 sm:h-5 text-[#a3a3a3] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75 12 17.25 19.5 9.75" />
              </svg>
            </button>

            {/* Widget Content - collapsible */}
            <div
              id="ml-widget-panel"
              className={`
                transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isExpanded ? 'max-h-[calc(100vh-200px)] sm:max-h-[540px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}
              `}
            >
              <div className="h-[calc(100vh-200px)] sm:h-[520px] flex flex-col">
                <div className="flex-1 min-h-0">
                  <AskPortfolioWidget compact />
                </div>
                <p className="text-[10px] sm:text-[10px] text-[#404040] text-center font-mono uppercase tracking-widest mt-2 sm:mt-3 pb-3 sm:pb-4 px-2">
                  Model: {currentModel.name} · Context: Project Metadata
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLLab;
