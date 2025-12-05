import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useConsole } from '../context/ConsoleContext';
import { ConsoleLane } from '../lib/types';
import AskPortfolioWidget from './AskPortfolioWidget';

const FooterHUD: React.FC = () => {
  const { isAgentOpen, setIsAgentOpen, setFocusedDiscipline } = useConsole();
  const location = useLocation();

  // Check if we're on ML Lab (has inline widget, so hide trigger there)
  const isMLLabPage = location.pathname === '/ml-lab';

  // Close on route change when navigating to ML Lab (inline widget there) or on mobile
  useEffect(() => {
    if (isMLLabPage || window.innerWidth < 768) {
      setIsAgentOpen(false);
    }
  }, [location, setIsAgentOpen, isMLLabPage]);

  // Escape key to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAgentOpen(false);
    };
    if (isAgentOpen) {
      window.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isAgentOpen, setIsAgentOpen]);

  return (
    <>
      {/* Backdrop when chat is open */}
      <div 
        className={`
          fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${isAgentOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsAgentOpen(false)}
      />

      {/* Footer HUD Container - fixed to bottom */}
      <div className={`fixed bottom-0 left-0 right-0 z-[75] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        
        {/* Expandable Chat Panel */}
        <div 
          className={`
            relative bg-[#0A0A0A] border-t border-[#1f2937] overflow-hidden
            transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${isAgentOpen ? 'h-[70vh] sm:h-[60vh] md:h-[55vh] lg:h-[50vh] opacity-100' : 'h-0 opacity-0'}
          `}
        >
          {/* Blue accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB] to-transparent" />

          {/* Panel body */}
          <div className="h-full flex flex-col">
            {/* Chat header with close */}
            <div className="h-12 bg-[#0B0B0B] border-b border-[#1f2937] flex items-center justify-between px-4">
              <div className="flex items-center gap-2 text-[#a3a3a3] text-[11px] uppercase tracking-[0.15em]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#2563EB]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span>Ask EB</span>
              </div>
              <button
                onClick={() => setIsAgentOpen(false)}
                className="text-[#a3a3a3] hover:text-white transition-colors flex items-center gap-1 text-[11px] uppercase tracking-[0.15em]"
                aria-label="Close chat"
              >
                Close
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat content */}
            <div className="flex-1 min-h-0">
              <AskPortfolioWidget compact autoFocus={isAgentOpen} />
            </div>
          </div>
        </div>

        {/* Footer Bar - always visible */}
        <div className="bg-[#080808] border-t border-[#262626]">
          {/* Top accent line */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent" />
          
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="min-h-16 grid grid-cols-1 sm:grid-cols-3 items-center gap-4 py-2 text-[10px] uppercase tracking-[0.15em] font-mono text-[#737373]">
              
              {/* Left: Branding + Social Icons */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-white font-bold tracking-tight">
                  <span>2XEB</span>
                  <span className="text-[#2563EB]">.</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <a
                    href="https://www.linkedin.com/in/ebenezer-eshetu/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#a3a3a3] hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M5 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM2 8h3v12H2zM9 8H6v12h3v-6.5c0-1.9 2.5-2.1 2.5 0V20h3v-7.5C14.5 8.6 12 8 10.6 9.2V8Z"/>
                    </svg>
                  </a>
                  <a
                    href="https://github.com/2xeb"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#a3a3a3] hover:text-white transition-colors"
                    aria-label="GitHub"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.77.6-3.36-1.34-3.36-1.34-.46-1.17-1.12-1.48-1.12-1.48-.92-.63.07-.62.07-.62 1.02.07 1.56 1.05 1.56 1.05.9 1.55 2.36 1.1 2.94.84.09-.66.35-1.1.63-1.35-2.21-.25-4.54-1.11-4.54-4.95 0-1.1.39-2 .1-2.71 0 0 .83-.27 2.74 1.03a9.5 9.5 0 0 1 5 0c1.9-1.3 2.73-1.03 2.73-1.03.3.71.1 1.61.05 2.71 0 3.85-2.34 4.7-4.57 4.95.36.31.7.94.7 1.9v2.82c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" clipRule="evenodd"/>
                    </svg>
                  </a>
                  <a
                    href="mailto:hello@2xeb.com"
                    className="text-[#a3a3a3] hover:text-white transition-colors"
                    aria-label="Email"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M3.75 5.5h16.5a1 1 0 0 1 .96.74L12 12.56 2.79 6.24a1 1 0 0 1 .96-.74Z"/>
                      <path d="M2.5 8.14V17a1 1 0 0 0 1 1h17a1 1 0 0 0 1-1V8.14l-8.73 5.9a1.5 1.5 0 0 1-1.54 0Z"/>
                    </svg>
                  </a>
                  <a
                    href="https://youtube.com/@2xeb"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#a3a3a3] hover:text-white transition-colors"
                    aria-label="YouTube"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.08 5 12 5 12 5s-6.08 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26.6 26.6 0 0 0 2 12a26.6 26.6 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.92 19 12 19 12 19s6.08 0 7.84-.43A2.5 2.5 0 0 0 21.6 16.8 26.6 26.6 0 0 0 22 12a26.6 26.6 0 0 0-.4-4.8ZM10 15.06V8.94L15 12Z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Middle: Discipline indicators */}
              <div className="flex gap-4 sm:gap-6 md:gap-8 justify-start sm:justify-center">
                <span 
                  className="flex items-center gap-2 hover:text-[#06B6D4] transition-colors cursor-pointer py-2"
                  onMouseEnter={() => setFocusedDiscipline(ConsoleLane.CODE)}
                  onMouseLeave={() => setFocusedDiscipline(null)}
                >
                  <span className="w-2 h-2 bg-[#06B6D4]"></span>
                  <span className="hidden sm:inline">Software</span>
                  <span className="sm:hidden">SWE</span>
                </span>
                <span 
                  className="flex items-center gap-2 hover:text-[#84CC16] transition-colors cursor-pointer py-2"
                  onMouseEnter={() => setFocusedDiscipline(ConsoleLane.VISION)}
                  onMouseLeave={() => setFocusedDiscipline(null)}
                >
                  <span className="w-2 h-2 bg-[#84CC16]"></span>
                  <span className="hidden sm:inline">ML / AI</span>
                  <span className="sm:hidden">ML</span>
                </span>
                <span 
                  className="flex items-center gap-2 hover:text-[#F59E0B] transition-colors cursor-pointer py-2"
                  onMouseEnter={() => setFocusedDiscipline(ConsoleLane.DESIGN)}
                  onMouseLeave={() => setFocusedDiscipline(null)}
                >
                  <span className="w-2 h-2 bg-[#F59E0B]"></span>
                  <span className="hidden sm:inline">Video</span>
                  <span className="sm:hidden">Video</span>
                </span>
              </div>

              {/* Right: AI Chat trigger or indicator */}
              <div className="flex items-center justify-start sm:justify-end gap-3 sm:gap-4">
                {isMLLabPage ? (
                  <span className="text-[#2563EB] inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    EB Active
                  </span>
                ) : (
                  <button
                    onClick={() => setIsAgentOpen(!isAgentOpen)}
                    className={`
                      flex items-center gap-2 px-4 py-2 transition-all border
                      ${isAgentOpen 
                        ? 'bg-[#2563EB] border-[#2563EB] text-white' 
                        : 'bg-transparent border-[#333] text-[#a3a3a3] hover:border-[#2563EB] hover:text-white hover:bg-[#2563EB]/10'
                      }
                    `}
                  >
                    {/* Sparkle icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <span>
                      {isAgentOpen ? 'Close' : 'Ask EB'}
                    </span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={2} 
                      stroke="currentColor" 
                      className={`w-3 h-3 transition-transform duration-300 ${isAgentOpen ? 'rotate-180' : ''}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FooterHUD;

