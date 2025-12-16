import React, { useMemo, useState, useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { Discipline, Project } from '../lib/types';
import ProjectCard from '../components/ProjectCard';

// Helper to convert YouTube watch links to embed
const getEmbedUrl = (url?: string) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');

    if (hostname === 'play.gumlet.io') {
      return url;
    }
    let videoId = '';
    let startParam = '';

    if (hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
      if (urlObj.searchParams.get('t')) {
        startParam = urlObj.searchParams.get('t')!;
      }
    } else if (hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
      if (urlObj.searchParams.get('t')) {
        startParam = urlObj.searchParams.get('t')!;
      }
    }

    if (!videoId) {
      // Fallback regex for other formats or simple strings
      const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      if (match && match[2].length === 11) {
        videoId = match[2];
      }
    }
    
    if (!videoId) return null;
    
    const params = new URLSearchParams();
    params.set('autoplay', '0');
    params.set('rel', '0');
    
    // Important: Adding origin fixes "Error 153" and other embedding permission issues
    if (typeof window !== 'undefined' && window.location.origin) {
      params.set('origin', window.location.origin);
    }

    if (startParam) params.set('start', startParam.replace('s','')); 

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  } catch (e) {
    return null;
  }
};

const Video: React.FC = () => {
  // SWR: static data immediately, DB fetch in background
  const { projects } = useProjects();

  const videoProjects = useMemo(() =>
    projects.filter(p => (p.primaryDiscipline === Discipline.VIDEO || p.primaryDiscipline === Discipline.HYBRID) && p.videoUrl),
    [projects]
  );

  // Find specific showreel project "Ephemeral Hours" or fallback to first video
  // Search within videoProjects to ensure it has a videoUrl
  const initialShowreelProject = useMemo(() =>
    videoProjects.find(p => p.slug === 'ephemeral-hours') || videoProjects[0],
    [videoProjects]
  );

  const [showreelProject, setShowreelProject] = useState<Project | undefined>(initialShowreelProject);

  // Update when initial project changes
  useEffect(() => {
    setShowreelProject(initialShowreelProject);
  }, [initialShowreelProject]);

  const shuffleFeatured = () => {
    if (videoProjects.length === 0) return;
    const randomIndex = Math.floor(Math.random() * videoProjects.length);
    setShowreelProject(videoProjects[randomIndex]);
  };

  const embedUrl = useMemo(() => getEmbedUrl(showreelProject?.videoUrl), [showreelProject?.videoUrl]);

  return (
    <div className="min-h-screen pt-28 md:pt-32 pb-20 px-4 sm:px-6 md:px-12 max-w-[1600px] mx-auto bg-[#050505]">
      <div className="flex flex-col items-center justify-center text-center mb-20 md:mb-24 px-2">
        <h1
          className="font-bold text-white font-space-grotesk mb-6 md:mb-8 tracking-tighter leading-tight max-w-5xl mx-auto"
          style={{ fontSize: 'clamp(2.6rem, 5vw + 1rem, 9rem)' }}
        >
          VISUAL<span className="text-[#2563EB] px-2">///</span>ARTS
        </h1>
        <p className="text-[#A3A3A3] font-mono uppercase tracking-widest text-[12px] md:text-xs">Cinematography · Editing · Motion Design</p>
      </div>

	      {/* Showreel Section */}
		      {showreelProject && embedUrl && (
		        <div className="mb-32 max-w-6xl mx-auto w-full overflow-hidden">
		          <div className="aspect-video w-full bg-black overflow-hidden border border-[#262626] relative group">
                  <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                    <iframe
                      key={showreelProject.id}
                      loading="lazy"
                      title={showreelProject.title}
                      src={embedUrl}
                      style={{ border: 'none', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%' }}
                      referrerPolicy="origin"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
                    ></iframe>
                  </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mt-4 text-[#525252] font-mono text-[10px] sm:text-[10px] uppercase tracking-widest w-full">
             <span className="flex-1 pr-2 break-words">Featured: {showreelProject.title}</span>
             <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-shrink-0">
               <button
                 onClick={shuffleFeatured}
                 className="px-3 py-1.5 border border-[#525252] hover:border-white text-[#525252] hover:text-white transition-colors uppercase tracking-widest text-[10px] sm:text-[10px] whitespace-nowrap flex-shrink-0"
                 aria-label="Shuffle featured video"
               >
                 Shuffle
               </button>
               <span className="whitespace-nowrap flex-shrink-0">Reel 2025</span>
             </div>
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
