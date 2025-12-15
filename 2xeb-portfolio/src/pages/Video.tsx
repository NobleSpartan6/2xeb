import React, { useState, useMemo } from 'react';
import { useProjects } from '../hooks/useProjects';
import { Discipline } from '../lib/types';
import ProjectCard from '../components/ProjectCard';

const EPHEMERAL_HOURS_ODYSEE_EMBED =
  'https://odysee.com/%24/embed/%40eb%3Aa%2Fephemeral-hours%3A3?r=2zdYftvSYxTuxhE2pwEBMC4xs2uQSbnC';

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

  const [isPlaying, setIsPlaying] = useState(false);

  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        let videoId = '';
        let startParam = '';

        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
            if (urlObj.searchParams.get('t')) {
                startParam = urlObj.searchParams.get('t')!;
            }
        } else if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v') || '';
            if (urlObj.searchParams.get('t')) {
                startParam = urlObj.searchParams.get('t')!;
            }
        }

        if (!videoId) {
            const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            if (match && match[2].length === 11) {
                videoId = match[2];
            }
        }
        
        if (!videoId) return null;
        
        const params = new URLSearchParams();
        params.set('autoplay', '1');
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

  const isEphemeralHoursShowreel = showreelProject?.slug === 'ephemeral-hours';
  const showreelEmbed = isEphemeralHoursShowreel
    ? EPHEMERAL_HOURS_ODYSEE_EMBED
    : getEmbedUrl(showreelProject?.videoUrl);

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
	            {isPlaying && showreelEmbed ? (
                isEphemeralHoursShowreel ? (
                  <iframe
                    id="odysee-iframe"
                    style={{ width: '100%', aspectRatio: '16 / 9' }}
                    src={showreelEmbed}
                    title={showreelProject.title}
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  ></iframe>
                ) : (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={showreelEmbed}
                    title={showreelProject.title} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0"
                  ></iframe>
                )
              ) : (
	               <div className="absolute inset-0 cursor-pointer" onClick={() => setIsPlaying(true)}>
	                 <img 
	                    src={showreelProject.imageUrl} 
	                    alt="Showreel Cover" 
                    loading="lazy"
                    width="1920"
                    height="1080"
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all duration-500"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-4 bg-black/50 backdrop-blur-sm group-hover:border-[#2563EB] group-hover:scale-110 transition-all duration-300">
                        <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-white border-b-[12px] border-b-transparent ml-1 group-hover:border-l-[#2563EB] transition-colors"></div>
                      </div>
                      <span className="text-white font-bold tracking-widest uppercase text-sm opacity-80 group-hover:opacity-100 group-hover:text-[#2563EB] transition-colors">
                        Play Showreel
                      </span>
                    </div>
                 </div>
               </div>
            )}
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
