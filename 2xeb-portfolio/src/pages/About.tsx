import React from 'react';
import { EXPERIENCE } from '../data';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] pt-28 md:pt-36 pb-20 px-4 sm:px-6 lg:px-12">
      {/* Header */}
      <div className="max-w-5xl xl:max-w-6xl mx-auto mb-20 lg:mb-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        <div className="flex flex-col items-start gap-5">
           <h1 className="font-bold text-white font-space-grotesk tracking-tighter leading-[0.85]" style={{ fontSize: 'clamp(3rem, 5vw + 1rem, 8rem)' }}>
            EBENEZER<br/>ESHETU
          </h1>
          <div className="inline-flex flex-wrap items-center gap-5 mt-2 text-[#a3a3a3]">
            <a
              href="https://www.linkedin.com/in/ebenezer-eshetu/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="hover:text-white transition-colors"
            >
              <span className="w-6 h-6 grid place-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                  <path d="M5 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM2 8h3v12H2zM9 8H6v12h3v-6.5c0-1.9 2.5-2.1 2.5 0V20h3v-7.5C14.5 8.6 12 8 10.6 9.2V8Z"/>
                </svg>
              </span>
            </a>
            <a
              href="https://github.com/2xeb"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="hover:text-white transition-colors"
            >
              <span className="w-6 h-6 grid place-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                  <path fillRule="evenodd" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.77.6-3.36-1.34-3.36-1.34-.46-1.17-1.12-1.48-1.12-1.48-.92-.63.07-.62.07-.62 1.02.07 1.56 1.05 1.56 1.05.9 1.55 2.36 1.1 2.94.84.09-.66.35-1.1.63-1.35-2.21-.25-4.54-1.11-4.54-4.95 0-1.1.39-2 .1-2.71 0 0 .83-.27 2.74 1.03a9.5 9.5 0 0 1 5 0c1.9-1.3 2.73-1.03 2.73-1.03.3.71.1 1.61.05 2.71 0 3.85-2.34 4.7-4.57 4.95.36.31.7.94.7 1.9v2.82c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" clipRule="evenodd"/>
                </svg>
              </span>
            </a>
            <a
              href="mailto:hello@2xeb.com"
              aria-label="Email"
              className="hover:text-white transition-colors"
            >
              <span className="w-6 h-6 grid place-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                  <path d="M3.75 5.5h16.5a1 1 0 0 1 .96.74L12 12.56 2.79 6.24a1 1 0 0 1 .96-.74Z"/>
                  <path d="M2.5 8.14V17a1 1 0 0 0 1 1h17a1 1 0 0 0 1-1V8.14l-8.73 5.9a1.5 1.5 0 0 1-1.54 0Z"/>
                </svg>
              </span>
            </a>
            <a
              href="https://youtube.com/@2xeb"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="hover:text-white transition-colors"
            >
              <span className="w-6 h-6 grid place-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                  <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.08 5 12 5 12 5s-6.08 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26.6 26.6 0 0 0 2 12a26.6 26.6 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.92 19 12 19 12 19s6.08 0 7.84-.43A2.5 2.5 0 0 0 21.6 16.8 26.6 26.6 0 0 0 22 12a26.6 26.6 0 0 0-.4-4.8ZM10 15.06V8.94L15 12Z"/>
                </svg>
              </span>
            </a>
          </div>
        </div>
        <div className="flex items-end">
           <p className="text-lg md:text-2xl text-[#D4D4D4] leading-relaxed font-light border-l-2 border-[#2563EB] pl-6 md:pl-8">
            Software Engineer based in New York City. <br/>
            Specializing in high-performance financial systems, machine learning applications, and creative visual media.
          </p>
        </div>
      </div>

      {/* Experience Section */}
      <div className="border-t border-[#262626]">
        <div className="max-w-5xl xl:max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12">
          
          {/* Section Label */}
          <div className="lg:col-span-3 py-10 md:py-12 border-b lg:border-b-0 lg:border-r border-[#262626] border-opacity-50 pr-0 lg:pr-8">
            <h2 className="text-sm font-bold text-[#2563EB] uppercase tracking-[0.2em] lg:sticky lg:top-32">
              Experience
            </h2>
          </div>

          {/* List */}
          <div className="lg:col-span-9">
            {EXPERIENCE.map((item, idx) => (
              <div key={item.id} className={`group grid md:grid-cols-12 gap-6 md:gap-8 py-10 md:py-12 px-6 md:px-8 hover:bg-[#0A0A0A] transition-colors ${idx !== EXPERIENCE.length - 1 ? 'border-b border-[#262626]' : ''}`}>
                {/* Date */}
                <div className="md:col-span-3">
                  <span className="font-mono text-xs text-[#A3A3A3] uppercase tracking-wider block mb-1 group-hover:text-white transition-colors">
                    {item.date}
                  </span>
                  <span className="text-[10px] text-[#525252] font-mono uppercase tracking-wider">
                    {item.location}
                  </span>
                </div>

                {/* Details */}
                <div className="md:col-span-9">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-3">
                    <h3 className="text-2xl md:text-3xl font-bold text-white font-space-grotesk tracking-tight group-hover:text-[#2563EB] transition-colors">
                      {item.company}
                    </h3>
                    <span className="text-base md:text-lg text-[#A3A3A3] font-light">
                      — {item.role}
                    </span>
                  </div>
                  
                  <p className="text-[#D4D4D4] leading-relaxed mb-6 max-w-3xl font-light text-sm md:text-base">
                    {item.desc}
                  </p>
                  
                  {item.skills && (
                    <div className="flex flex-wrap gap-2">
                      {item.skills.map(skill => (
                        <span key={skill} className="text-[10px] font-bold font-mono text-[#2563EB] border border-[#262626] px-2 py-1 bg-[#050505] uppercase tracking-wider">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default About;
