import React, { useEffect, useState } from 'react';
import AskPortfolioWidget from '../components/AskPortfolioWidget';
import { PROJECTS } from '../data';
import ProjectCard from '../components/ProjectCard';
import { Discipline } from '../lib/types';

const MLLab: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Ensure we land at the top when navigating to this page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const mlProjects = PROJECTS.filter(p => 
     p.primaryDiscipline === Discipline.ML || 
     (p.primaryDiscipline === Discipline.HYBRID && p.tags.some(t => ['AI', 'ML'].includes(t))) ||
     // Include Midimix explicitly if needed by slug or logic
     p.slug === 'midimix'
  );

  return (
    <div className="min-h-screen pt-28 md:pt-32 pb-20 px-4 sm:px-6 md:px-12 max-w-[1600px] mx-auto bg-[#050505]">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
        
        {/* Left Column: Header & Projects */}
        <div className="lg:col-span-7 space-y-14 lg:space-y-20">
          <div>
            <span className="text-[#2563EB] font-mono text-xs uppercase tracking-widest block mb-4">Laboratory</span>
            <h1 className="font-bold text-white font-space-grotesk mb-6 md:mb-8 tracking-tighter leading-[0.9]" style={{ fontSize: 'clamp(2.8rem, 5vw + 1rem, 8rem)' }}>
              MACHINE<br />LEARNING
            </h1>
            <p className="text-[#A3A3A3] text-xl leading-relaxed font-light max-w-2xl border-l border-[#262626] pl-6">
              Exploring the intersection of generative AI and creative workflows. 
              Featuring <strong>Midimix</strong>, a custom AI-driven MIDI tool, and the <strong>Portfolio Agent</strong> that powers this site.
            </p>
          </div>

          <div className="grid gap-8">
              {mlProjects.map(p => (
                <ProjectCard key={p.id} project={p} />
              ))}
          </div>
        </div>

        {/* Right Column: AI Widget sticky */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 h-fit space-y-4">
          <div className="bg-[#0A0A0A] border border-[#1f2937] overflow-hidden shadow-xl relative transition-all duration-500">
            {/* Blue accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB] to-transparent" />

            {/* Collapsible Header */}
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="w-full h-12 bg-[#080808] border-b border-[#1f2937] flex items-center justify-between px-4 text-left transition-colors hover:bg-[#0d0d0d]"
              aria-expanded={isExpanded}
              aria-controls="ml-widget-panel"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#2563EB]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="text-[11px] uppercase tracking-[0.15em] text-[#a3a3a3]">
                  Ask EB
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 text-[#a3a3a3] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75 12 17.25 19.5 9.75" />
              </svg>
            </button>

            {/* Widget Content - collapsible */}
            <div
              id="ml-widget-panel"
              className={`
                transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isExpanded ? 'max-h-[540px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}
              `}
            >
              <div className="h-[520px] flex flex-col">
                <div className="flex-1 min-h-0">
                  <AskPortfolioWidget compact />
                </div>
                <p className="text-[10px] text-[#404040] text-center font-mono uppercase tracking-widest mt-3 pb-4">
                  Model: Gemini 2.5 Flash · Context: Project Metadata
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