import React, { useMemo } from 'react';
import { useProjects } from '../hooks/useProjects';
import { Discipline } from '../lib/types';
import ProjectCard from '../components/ProjectCard';

const Video: React.FC = () => {
  // SWR: static data immediately, DB fetch in background
  const { projects } = useProjects();

  const videoProjects = useMemo(() =>
    projects.filter(p => p.primaryDiscipline === Discipline.VIDEO || p.primaryDiscipline === Discipline.HYBRID),
    [projects]
  );

  // Find specific showreel project "Ephemeral Hours" or fallback to first video
  const showreelProject = useMemo(() =>
    projects.find(p => p.slug === 'ephemeral-hours') || videoProjects[0],
    [projects, videoProjects]
  );

  return (
    <div className="min-h-screen pt-28 md:pt-32 pb-20 px-4 sm:px-6 md:px-12 max-w-[1600px] mx-auto bg-[#050505]">
      <div className="flex flex-col items-center justify-center text-center mb-20 md:mb-24 px-2">
        <h1
          className="font-bold text-white font-space-grotesk mb-6 md:mb-8 tracking-tighter leading-tight max-w-5xl mx-auto"
          style={{ fontSize: 'clamp(2.6rem, 5vw + 1rem, 9rem)' }}
        >
          VISUAL<span className="text-[#2563EB] px-2">///</span>ARTS
        </h1>
        <p className="text-[#A3A3A3] font-mono uppercase tracking-widest text-[11px] md:text-xs">Cinematography · Editing · Motion Design</p>
      </div>

	      {/* Showreel Section */}
		      {showreelProject && (
		        <div className="mb-32 max-w-6xl mx-auto">
		          <div className="aspect-video w-full bg-black overflow-hidden border border-[#262626] relative group">
                  <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                    <iframe
                      loading="lazy"
                      title="Gumlet video player"
                      src="https://play.gumlet.io/embed/693f47fe3cf0cd39b98f6061?autoplay=false&loop=false&disableControls=false"
                      style={{ border: 'none', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%' }}
                      referrerPolicy="origin"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
                    ></iframe>
                  </div>
          </div>
          <div className="flex justify-between mt-4 text-[#525252] font-mono text-[10px] uppercase tracking-widest">
             <span>Featured: {showreelProject.title}</span>
             <span>Reel 2024</span>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="border-t border-[#262626] pt-16">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-2xl text-white font-bold font-space-grotesk uppercase tracking-tighter">Featured Productions</h2>
          <span className="text-[#2563EB] font-mono text-xs">0{videoProjects.length} Items</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videoProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Video;
