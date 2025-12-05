import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PROJECTS } from '../data';
import DisciplineChip from '../components/DisciplineChip';

const ProjectDetail: React.FC = () => {
  const { slug } = useParams();
  const project = PROJECTS.find(p => p.slug === slug);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#050505]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 font-space-grotesk">404</h1>
          <p className="text-[#A3A3A3] mb-8 font-mono">Project not found.</p>
          <Link to="/work" className="text-[#2563EB] hover:text-white transition-colors uppercase tracking-widest text-xs font-bold border-b border-[#2563EB]">Back to Work</Link>
        </div>
      </div>
    );
  }

  // Helper to convert YouTube watch links to embed
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
            // Fallback regex for other formats or simple strings
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

  const embedUrl = getEmbedUrl(project.videoUrl);

  return (
    <article className="min-h-screen pt-32 pb-20 px-6 md:px-12 max-w-6xl mx-auto bg-[#050505]">
      <Link to="/work" className="inline-flex items-center text-[#A3A3A3] hover:text-[#2563EB] mb-12 transition-colors text-xs uppercase tracking-widest font-mono">
        ← Back Index
      </Link>
      
      <header className="mb-16 space-y-6">
        <div className="flex items-center gap-4">
          <DisciplineChip discipline={project.primaryDiscipline} />
          <span className="text-[#A3A3A3] font-mono text-xs">{project.createdAt.split('-')[0]}</span>
          {project.isExternal && (
              <span className="text-[#2563EB] text-xs font-bold uppercase tracking-wider border border-[#2563EB] px-2 py-0.5">External</span>
          )}
        </div>
        <h1
          className="font-bold text-white font-space-grotesk leading-[0.9] tracking-tighter uppercase"
          style={{ fontSize: 'clamp(2.5rem, 6vw + 1rem, 5rem)' }}
        >
          {project.title}
        </h1>
        {project.role && (
            <p className="text-white/60 font-mono text-sm uppercase tracking-widest">{project.role}</p>
        )}
        <p className="text-xl text-[#D4D4D4] leading-relaxed font-light max-w-3xl">
          {project.shortDesc}
        </p>
      </header>

      <div className="w-full aspect-video bg-[#0A0A0A] border border-[#262626] mb-16 relative overflow-hidden group">
        {embedUrl && isPlaying ? (
           <iframe 
             width="100%" 
             height="100%" 
             src={embedUrl}
             title={project.title} 
             frameBorder="0" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
             referrerPolicy="strict-origin-when-cross-origin"
             allowFullScreen
             className="absolute inset-0"
           ></iframe>
        ) : (
           <div className="absolute inset-0 cursor-pointer" onClick={() => embedUrl && setIsPlaying(true)}>
             <img 
               src={project.imageUrl} 
               alt={project.title} 
               loading="lazy"
               width="1920"
               height="1080"
               className="w-full h-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-60" 
             />
             {embedUrl && (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center bg-black/50 backdrop-blur-sm group-hover:scale-110 group-hover:border-[#2563EB] transition-all duration-300">
                   <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent ml-1 group-hover:border-l-[#2563EB] transition-colors"></div>
                 </div>
               </div>
             )}
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 border-t border-[#262626] pt-16">
        <aside className="lg:col-span-4 space-y-12">
          <div>
            <h3 className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-4">Technology</h3>
            <div className="flex flex-wrap gap-2">
              {project.tags.map(tag => (
                <span key={tag} className="text-xs font-mono text-[#D4D4D4] border border-[#262626] px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {project.isExternal && project.externalUrl && (
             <div>
                <h3 className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-4">Launch</h3>
                <a 
                  href={project.externalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#2563EB] text-white hover:bg-white hover:text-black px-6 py-3 transition-all block w-max text-sm font-bold uppercase tracking-widest"
                >
                  Visit Project ↗
                </a>
             </div>
          )}

          {!project.isExternal && project.videoUrl && (
             <div>
                <h3 className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-4">Source</h3>
                <a 
                  href={project.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#2563EB] border-b border-white/20 hover:border-[#2563EB] pb-1 transition-all block w-max text-sm font-bold uppercase tracking-wider"
                >
                  Watch on YouTube ↗
                </a>
             </div>
          )}
        </aside>

        <div className="lg:col-span-8 text-[#D4D4D4] text-lg leading-relaxed space-y-8 font-light">
          <section>
            <h2 className="text-2xl text-white font-bold font-space-grotesk mb-4 tracking-tight">Overview</h2>
            <p>{project.longDesc || project.shortDesc}</p>
          </section>
        </div>
      </div>
    </article>
  );
};

export default ProjectDetail;