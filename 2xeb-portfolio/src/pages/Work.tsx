import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { Discipline } from '../lib/types';
import ProjectCard from '../components/ProjectCard';

const Work: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('discipline') as Discipline | 'ALL' || 'ALL';
  const [activeFilter, setActiveFilter] = useState<Discipline | 'ALL'>(initialFilter);

  // SWR: static data immediately, DB fetch in background
  const { projects } = useProjects();

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'ALL') return projects;
    return projects.filter(p => p.primaryDiscipline === activeFilter || p.primaryDiscipline === Discipline.HYBRID);
  }, [activeFilter, projects]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-[#262626] border border-[#262626] rounded-lg overflow-hidden">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-[#050505] h-full">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-24">
            <p className="text-[#A3A3A3] font-mono text-sm uppercase tracking-widest">No projects found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Work;
