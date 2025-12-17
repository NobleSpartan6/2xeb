import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useConsole } from '../context/ConsoleContext';
import { Discipline } from '../lib/types';
import ProjectCard from '../components/ProjectCard';

const Work: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('discipline') as Discipline | 'ALL' || 'ALL';
  const [activeFilter, setActiveFilter] = useState<Discipline | 'ALL'>(initialFilter);
  const { setIsEasterEggActive } = useConsole();

  // Scroll-triggered hint state
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [hasClickedProject, setHasClickedProject] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // SWR: static data immediately, DB fetch in background
  const { projects } = useProjects();

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'ALL') return projects;
    return projects.filter(p => p.primaryDiscipline === activeFilter || p.primaryDiscipline === Discipline.HYBRID);
  }, [activeFilter, projects]);

  // Track project clicks
  const handleProjectClick = useCallback(() => {
    setHasClickedProject(true);
    setShowScrollHint(false);
  }, []);

  // Detect when user has scrolled to see all projects
  useEffect(() => {
    const handleScroll = () => {
      if (!gridRef.current || hasClickedProject) return;

      const grid = gridRef.current;
      const gridRect = grid.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if the bottom of the grid is visible (with some buffer)
      const bottomVisible = gridRect.bottom <= windowHeight + 100;

      if (bottomVisible && !hasReachedBottom) {
        setHasReachedBottom(true);
        // Show hint after a short delay once they've seen everything
        setTimeout(() => {
          if (!hasClickedProject) {
            setShowScrollHint(true);
          }
        }, 1500);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasClickedProject, hasReachedBottom]);

  // Reset hint state when filter changes
  useEffect(() => {
    setHasReachedBottom(false);
    setShowScrollHint(false);
  }, [activeFilter]);

  const filters = [
    { label: 'All', value: 'ALL' },
    { label: 'Software', value: Discipline.SWE },
    { label: 'ML / AI', value: Discipline.ML },
    { label: 'Video', value: Discipline.VIDEO },
  ];

  const handleFilterChange = (val: string) => {
    setActiveFilter(val as any);
    if (val === 'ALL') {
      searchParams.delete('discipline');
    } else {
      searchParams.set('discipline', val);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-28 md:pt-36 pb-16 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl xl:max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-end mb-14 lg:mb-20 gap-10 lg:gap-14 border-b border-[#262626] pb-10 lg:pb-12">
        <div>
          <h1 className="text-[2.7rem] sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white font-space-grotesk mb-6 tracking-tighter leading-[0.9]">
            SELECTED<br /><span className="text-[#2563EB]">WORK</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-2 border border-[#262626] bg-[#0A0A0A] rounded-lg overflow-hidden w-full lg:w-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-4 sm:px-5 lg:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] transition-all duration-200 border-r border-[#262626] last:border-r-0 ${
                activeFilter === f.value
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#0A0A0A] text-[#A3A3A3] hover:bg-white hover:text-black'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl xl:max-w-7xl mx-auto">
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-[#262626] border border-[#262626] rounded-lg overflow-hidden"
        >
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-[#050505] h-full"
              onClick={handleProjectClick}
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-24">
            <p className="text-[#A3A3A3] font-mono text-sm uppercase tracking-widest">No projects found for this filter.</p>
          </div>
        )}

        {/* Scroll-triggered easter egg hint */}
        <button
          onClick={() => setIsEasterEggActive(true)}
          className={`
            mt-16 mx-auto flex items-center gap-2 px-4 py-3
            font-mono text-xs text-[#2563EB]/70 hover:text-[#2563EB]
            border border-[#2563EB]/20 hover:border-[#2563EB]/50
            bg-[#2563EB]/5 hover:bg-[#2563EB]/10
            rounded transition-all duration-500 ease-out
            ${showScrollHint
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
            }
          `}
        >
          <span className="animate-pulse">&gt;_</span>
          <span className="text-[#737373]">looking for something else?</span>
        </button>
      </div>
    </div>
  );
};

export default Work;
