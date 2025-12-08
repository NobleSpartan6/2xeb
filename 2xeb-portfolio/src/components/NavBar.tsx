import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConsole } from '../context/ConsoleContext';

const NavBar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { setIsAgentOpen } = useConsole();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/work', label: 'Work' },
    { path: '/ml-lab', label: 'ML Lab' },
    { path: '/video', label: 'Video' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent scrolling when menu is open + close on Escape for accessibility
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      closeButtonRef.current?.focus();
      window.addEventListener('keydown', onKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Main Header */}
      <nav className="fixed top-0 left-0 w-full z-[100] text-white pointer-events-none">
        <div
          className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 pointer-events-auto"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
        >
          <div className="relative flex items-center justify-between h-[74px] sm:h-[82px] md:h-[100px] rounded-2xl px-4 md:px-6 lg:px-8 bg-gradient-to-b from-[#050505]/85 via-[#050505]/75 to-transparent backdrop-blur-xl border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
            <div className="flex-shrink-0 z-50">
              <Link to="/" className="text-white font-bold text-xl sm:text-2xl tracking-tighter font-space-grotesk hover:text-[#2563EB] transition-colors">
                2XEB
              </Link>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-6 lg:space-x-10">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200 font-mono ${
                      isActive(link.path)
                        ? 'text-[#2563EB]'
                        : 'text-[#A3A3A3] hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden z-50">
              <button
                onClick={() => setIsOpen(true)}
                type="button"
                className="group inline-flex items-center justify-center p-2 text-white focus:outline-none"
                aria-label="Open menu"
              >
                <div className="flex flex-col gap-1.5 items-end">
                   <span className="block w-8 h-[2px] bg-white group-hover:bg-[#2563EB] transition-colors"></span>
                   <span className="block w-5 h-[2px] bg-white group-hover:bg-[#2563EB] transition-colors group-hover:w-8"></span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Side Drawer */}
      <div
          className={`fixed inset-0 z-[110] md:hidden transition-[visibility] duration-500 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none delay-500'}`}
        aria-hidden={!isOpen}
      >
        
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/70 backdrop-blur-lg transition-opacity duration-500 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsOpen(false)}
        />

        {/* Drawer Panel */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-[88vw] max-w-[360px] bg-[#060606] border-l border-[#262626] shadow-[0_0_60px_rgba(0,0,0,0.55)] transform transition-transform duration-500 cubic-bezier(0.22, 1, 0.36, 1) flex flex-col ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
        >
          {/* Header */}
          <div
            className="h-24 flex items-center justify-between px-8 border-b border-[#262626] shrink-0 bg-[#0A0A0A]"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
             <span className="text-[#2563EB] text-[10px] font-mono uppercase tracking-[0.2em]">System Navigation</span>
             <button 
                ref={closeButtonRef}
                onClick={() => setIsOpen(false)}
                className="text-[#666] hover:text-white transition-colors p-2"
                aria-label="Close navigation"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>

          {/* Links */}
          <div className="flex-1 flex flex-col py-12 px-8 space-y-8 overflow-y-auto">
            {navLinks.map((link, i) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block text-4xl font-bold font-space-grotesk uppercase tracking-tighter transition-all duration-500 ${
                  isActive(link.path)
                    ? 'text-[#2563EB] translate-x-4'
                    : 'text-[#333] hover:text-white hover:translate-x-2'
                }`}
                style={{ 
                  transitionDelay: isOpen ? `${i * 50 + 100}ms` : '0ms',
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? undefined : 'translateX(20px)' 
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Divider */}
            <div className="h-px bg-[#262626] w-full my-4" />

            {/* Agent Trigger */}
            <button
               onClick={() => {
                 setIsOpen(false);
                 // Small delay to allow drawer to close
                 setTimeout(() => setIsAgentOpen(true), 300);
               }}
               className="text-left group flex items-center gap-3"
            >
               <div>
                 <span className="block text-white text-sm font-bold font-space-grotesk uppercase tracking-wider group-hover:text-[#2563EB] transition-colors">ASK</span>
                 <span className="block text-[#525252] text-[10px] font-mono uppercase tracking-widest">Portfolio Assistant</span>
               </div>
               <div className="w-10 h-10 border border-[#262626] flex items-center justify-center bg-[#0A0A0A] group-hover:border-[#2563EB] transition-colors">
                 <span className="text-[#2563EB] font-bold text-sm font-space-grotesk tracking-tight">EB</span>
               </div>
            </button>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-[#262626] bg-[#0A0A0A] shrink-0">
             <div className="flex justify-between items-end">
                <div className="flex flex-col">
                   <span className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1">New York, NY</span>
                   <span className="text-[10px] text-[#2563EB] font-mono uppercase tracking-widest">Est. 2025</span>
                </div>
                <span className="text-[10px] text-[#444] font-mono">v2.0.4</span>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavBar;