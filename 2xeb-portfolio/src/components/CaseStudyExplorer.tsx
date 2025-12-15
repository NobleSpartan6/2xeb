import React, { useState } from 'react';
import { CaseStudy } from '../data';

interface CaseStudyExplorerProps {
  caseStudy: CaseStudy;
  onClose?: () => void;
}

type Section = 'problem' | 'solution' | 'timeline' | 'architecture' | 'results';

const CaseStudyExplorer: React.FC<CaseStudyExplorerProps> = ({ caseStudy, onClose }) => {
  const [expandedSection, setExpandedSection] = useState<Section | null>('problem');

  const toggleSection = (section: Section) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const SectionHeader: React.FC<{ 
    section: Section; 
    title: string; 
    icon: React.ReactNode;
  }> = ({ section, title, icon }) => (
    <button
      onClick={() => toggleSection(section)}
      className={`w-full flex items-center justify-between p-4 border-b border-[#1f2937] transition-colors ${
        expandedSection === section ? 'bg-[#0d0d0d]' : 'bg-[#080808] hover:bg-[#0a0a0a]'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-[#2563EB]">{icon}</span>
        <span className="text-[13px] font-mono uppercase tracking-wider text-white">{title}</span>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`w-4 h-4 text-[#525252] transition-transform ${expandedSection === section ? 'rotate-180' : ''}`}
      >
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </button>
  );

  const SectionContent: React.FC<{ section: Section; children: React.ReactNode }> = ({ section, children }) => (
    <div className={`overflow-hidden transition-all duration-300 ${
      expandedSection === section ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
    }`}>
      <div className="p-5 bg-[#0a0a0a] border-b border-[#1f2937]">
        {children}
      </div>
    </div>
  );

  return (
    <div className="bg-[#0A0A0A] border border-[#1f2937] max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-[#1f2937] flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#2563EB] bg-[#2563EB]/10 px-2 py-1">
              Case Study
            </span>
          </div>
          <h2 className="text-2xl font-space-grotesk font-bold text-white mb-1">{caseStudy.title}</h2>
          <p className="text-[#737373] text-sm">{caseStudy.subtitle}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-[#525252] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {/* Tech Stack Pills */}
      <div className="px-6 py-4 border-b border-[#1f2937] flex flex-wrap gap-2">
        {caseStudy.techStack.map((tech, i) => (
          <span key={i} className="text-[10px] font-mono px-2 py-1 bg-[#080808] border border-[#262626] text-[#a3a3a3]">
            {tech}
          </span>
        ))}
      </div>

      {/* Accordion Sections */}
      <div>
        {/* Problem */}
        <SectionHeader
          section="problem"
          title="The Problem"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>}
        />
        <SectionContent section="problem">
          <p className="text-[#d4d4d4] text-[13px] leading-relaxed font-mono">{caseStudy.problem}</p>
        </SectionContent>

        {/* Solution */}
        <SectionHeader
          section="solution"
          title="The Solution"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>}
        />
        <SectionContent section="solution">
          <p className="text-[#d4d4d4] text-[13px] leading-relaxed font-mono">{caseStudy.solution}</p>
        </SectionContent>

        {/* Timeline */}
        <SectionHeader
          section="timeline"
          title="Development Journey"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>}
        />
        <SectionContent section="timeline">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-[#1f2937]" />
            
            <div className="space-y-6">
              {caseStudy.timeline.map((event, i) => (
                <div key={i} className="relative pl-8">
                  {/* Dot */}
                  <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${
                    event.type === 'milestone' ? 'bg-[#2563EB] border-[#2563EB]' :
                    event.type === 'decision' ? 'bg-[#84CC16] border-[#84CC16]' :
                    event.type === 'challenge' ? 'bg-[#F59E0B] border-[#F59E0B]' :
                    'bg-[#06B6D4] border-[#06B6D4]'
                  }`} />
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 ${
                        event.type === 'milestone' ? 'bg-[#2563EB]/10 text-[#2563EB]' :
                        event.type === 'decision' ? 'bg-[#84CC16]/10 text-[#84CC16]' :
                        event.type === 'challenge' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                        'bg-[#06B6D4]/10 text-[#06B6D4]'
                      }`}>
                        {event.type}
                      </span>
                    </div>
                    <h4 className="text-white text-sm font-semibold mb-1">{event.title}</h4>
                    <p className="text-[#737373] text-[12px] leading-relaxed">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionContent>

        {/* Architecture */}
        <SectionHeader
          section="architecture"
          title="System Architecture"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M14 6H6v8h8V6z" /><path fillRule="evenodd" d="M9.25 3V1.75a.75.75 0 011.5 0V3h1.5V1.75a.75.75 0 011.5 0V3h.5A2.75 2.75 0 0117 5.75v.5h1.25a.75.75 0 010 1.5H17v1.5h1.25a.75.75 0 010 1.5H17v1.5h1.25a.75.75 0 010 1.5H17v.5A2.75 2.75 0 0114.25 17h-.5v1.25a.75.75 0 01-1.5 0V17h-1.5v1.25a.75.75 0 01-1.5 0V17h-1.5v1.25a.75.75 0 01-1.5 0V17h-.5A2.75 2.75 0 013 14.25v-.5H1.75a.75.75 0 010-1.5H3v-1.5H1.75a.75.75 0 010-1.5H3v-1.5H1.75a.75.75 0 010-1.5H3v-.5A2.75 2.75 0 015.75 3h.5V1.75a.75.75 0 011.5 0V3h1.5zM4.5 5.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-8.5z" clipRule="evenodd" /></svg>}
        />
        <SectionContent section="architecture">
          <pre className="bg-[#050505] border border-[#1f2937] p-4 overflow-x-auto text-[10px] text-[#a3a3a3] font-mono whitespace-pre">
            {caseStudy.architecture}
          </pre>
        </SectionContent>

        {/* Results */}
        <SectionHeader
          section="results"
          title="Results & Metrics"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" /></svg>}
        />
        <SectionContent section="results">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {caseStudy.results.map((result, i) => (
              <div key={i} className="bg-[#080808] border border-[#1f2937] p-4">
                <p className="text-[#2563EB] text-2xl font-bold font-space-grotesk">{result.value}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#737373] mt-1">{result.metric}</p>
                <p className="text-[10px] text-[#525252] mt-2">{result.description}</p>
              </div>
            ))}
          </div>
          
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Key Lessons</h4>
            <ul className="space-y-2">
              {caseStudy.lessons.map((lesson, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-[#a3a3a3]">
                  <span className="text-[#2563EB] mt-0.5">→</span>
                  {lesson}
                </li>
              ))}
            </ul>
          </div>
        </SectionContent>
      </div>
    </div>
  );
};

export default CaseStudyExplorer;

