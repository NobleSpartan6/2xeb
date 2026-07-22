import React from 'react';
import { Link, useViewTransitionState } from 'react-router-dom';
import { Project } from '../lib/types';
import DisciplineChip from './DisciplineChip';
import { useConsole } from '../context/ConsoleContext';

interface ProjectCardProps {
  project: Project;
  /** Position within its grid — rendered as an editorial index mark (01, 02…) */
  index?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const { setHighlightedNodeIds } = useConsole();

  // While navigating to this project, its media box morphs into the detail
  // page's hero (View Transitions API — no-op without browser support).
  // Named only during the transition so the name stays unique per document.
  const detailPath = `/work/${project.slug}`;
  const isMorphing = useViewTransitionState(detailPath);

  const CardContent = () => (
    <>
      <div
        className="aspect-video w-full overflow-hidden bg-black relative"
        style={isMorphing ? { viewTransitionName: 'project-media' } : undefined}
      >
         {project.imageUrl ? (
           <img
              src={project.imageUrl}
              alt={project.title}
              loading="lazy"
              width="800"
              height="450"
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-[opacity,transform] duration-500 ease-out-strong"
              onLoad={(e) => {
                // YouTube serves a 120x90 stub (HTTP 200) when a video has no
                // maxres thumbnail — fall back to the always-present hqdefault
                const img = e.currentTarget;
                if (img.naturalWidth <= 120 && img.src.includes('maxresdefault') && !img.dataset.fallback) {
                  img.dataset.fallback = '1';
                  img.src = img.src.replace('maxresdefault', 'hqdefault');
                }
              }}
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
           <h3
             title={project.title}
             className="text-2xl font-bold text-white font-space-grotesk tracking-tight leading-tight line-clamp-2 group-hover:text-[#2563EB] transition-colors"
           >
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
        <div className="flex flex-wrap items-baseline gap-2 mt-auto pt-4 border-t border-[#262626] group-hover:border-[#2563EB]/30 transition-colors">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-mono">
              {tag}
            </span>
          ))}
          {index !== undefined && (
            <span className="ml-auto text-[10px] font-mono tracking-wider text-[#525252] group-hover:text-[#2563EB]/70 transition-colors">
              {String(index + 1).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>
    </>
  );

  const handleMouseEnter = () => setHighlightedNodeIds([project.slug]);
  const handleMouseLeave = () => setHighlightedNodeIds([]);

  // Press feedback on the whole card (subtle 0.99 — large surface). Gated
  // behind motion-safe; lives on the card root, not the [data-card] wrapper,
  // which is an anime.js reveal target (inline transforms would conflict).
  const containerClass = "group block bg-[#0A0A0A] border border-[#262626] hover:border-[#2563EB] transition-[border-color,transform] duration-200 ease-out-strong motion-safe:active:scale-[0.99] flex flex-col h-full";

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
      to={detailPath}
      viewTransition
      className={containerClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardContent />
    </Link>
  );
};

export default ProjectCard;