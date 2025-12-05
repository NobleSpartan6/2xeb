import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../lib/types';
import DisciplineChip from './DisciplineChip';
import { useConsole } from '../context/ConsoleContext';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { setHighlightedNodeIds } = useConsole();

  const CardContent = () => (
    <>
      <div className="aspect-video w-full overflow-hidden bg-black relative">
         {project.imageUrl ? (
           <img 
              src={project.imageUrl} 
              alt={project.title} 
              loading="lazy"
              width="800"
              height="450"
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
           />
         ) : (
           <div className="w-full h-full bg-[#111] flex items-center justify-center text-[#333] font-mono text-xs">
             NO SIGNAL
           </div>
         )}
         
         <div className="absolute top-4 left-4 flex gap-2">
            <DisciplineChip discipline={project.primaryDiscipline} />
            {project.status === 'wip' && (
              <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-2 py-1 text-[9px] font-bold tracking-widest uppercase font-mono">
                WIP
              </span>
            )}
         </div>

         {project.isExternal && (
           <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-2 py-1 border border-white/20">
             <span className="text-white text-[10px] font-bold uppercase tracking-widest">EXT ↗</span>
           </div>
         )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-3">
           <h3 className="text-2xl font-bold text-white font-space-grotesk tracking-tight leading-none group-hover:text-[#2563EB] transition-colors flex items-center gap-2">
             {project.title}
           </h3>
           {project.role && (
             <span className="text-[10px] text-[#525252] uppercase tracking-widest font-mono block mt-1">
               {project.role}
             </span>
           )}
        </div>
        
        <p className="text-[#A3A3A3] text-sm leading-relaxed mb-6 font-sans flex-grow">
          {project.shortDesc}
        </p>
        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-[#262626] group-hover:border-[#2563EB]/30 transition-colors">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-mono">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  );

  const handleMouseEnter = () => setHighlightedNodeIds([project.slug]);
  const handleMouseLeave = () => setHighlightedNodeIds([]);

  const containerClass = "group block bg-[#0A0A0A] border border-[#262626] hover:border-[#2563EB] transition-colors duration-300 flex flex-col h-full";

  if (project.isExternal && project.externalUrl) {
    return (
      <a 
        href={project.externalUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className={containerClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardContent />
      </a>
    );
  }

  return (
    <Link 
      to={`/work/${project.slug}`}
      className={containerClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardContent />
    </Link>
  );
};

export default ProjectCard;