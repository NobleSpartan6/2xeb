import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { askPortfolio } from '../lib/api';
import { buildProjectContext } from '../data';
import { ChatMessage } from '../lib/types';
import { PROJECTS } from '../data';
import { useConsole } from '../context/ConsoleContext';

interface WidgetProps {
  compact?: boolean;
  autoFocus?: boolean;
}

const AskPortfolioWidget: React.FC<WidgetProps> = ({ compact = false, autoFocus = false }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { setHighlightedNodeIds } = useConsole();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [autoFocus]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: question };
    setHistory(prev => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);
    setError(null);

    try {
      const context = buildProjectContext();
      const { answer, projectSlugs } = await askPortfolio(userMsg.text, context);
      setHighlightedNodeIds(projectSlugs);
      setHistory(prev => [...prev, {
        role: 'model',
        text: answer,
        referencedSlugs: projectSlugs
      }]);
    } catch (err) {
      console.error('AI widget error:', err);
      setError('System unavailable. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setQuestion(text);
    if (inputRef.current) inputRef.current.focus();
  };

  const renderReferencedProjects = (slugs?: string[]) => {
    if (!slugs || slugs.length === 0) return null;
    const refs = PROJECTS.filter(p => slugs.includes(p.slug));
    if (refs.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-[#1f2937]">
        <p className="text-[9px] text-[#525252] uppercase tracking-widest mb-2 font-mono">Referenced:</p>
        <div className="flex flex-wrap gap-1.5">
          {refs.map(p => (
            p.isExternal ? (
              <a 
                key={p.id} 
                href={p.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] border border-[#2563EB]/50 bg-[#2563EB]/10 text-[#2563EB] px-2 py-1 hover:bg-[#2563EB] hover:text-white transition-colors uppercase tracking-wider font-mono"
              >
                {p.title} ↗
              </a>
            ) : (
              <Link 
                key={p.id} 
                to={`/work/${p.slug}`}
                className="text-[10px] border border-[#262626] bg-[#0C0C0C] text-[#a3a3a3] px-2 py-1 hover:border-[#2563EB] hover:text-white transition-colors uppercase tracking-wider font-mono"
              >
                {p.title}
              </Link>
            )
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0A0A]">
      
      {/* Chat Area */}
      <div
        className={`flex-grow min-h-0 overflow-y-auto custom-scrollbar flex flex-col ${compact ? 'p-4' : 'p-5'}`}
        aria-live="polite"
      >
        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center text-center px-4 gap-4 max-w-[320px] animate-fade-in">
              {/* Icon */}
              <div className="w-12 h-12 bg-[#080808] border border-[#1f2937] grid place-items-center text-[#2563EB]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="block">
                  <path d="M10 0L11.12 7.12L17.07 2.93L12.88 8.88L20 10L12.88 11.12L17.07 17.07L11.12 12.88L10 20L8.88 12.88L2.93 17.07L7.12 11.12L0 10L7.12 8.88L2.93 2.93L8.88 7.12L10 0Z" />
                </svg>
              </div>
              <p className="text-[#737373] text-sm leading-relaxed">
                Hi! I can answer questions about Ebenezer's work, skills, and experience.
              </p>
              {/* Suggestion buttons */}
              <div className="grid gap-2 w-full">
                <button 
                  onClick={() => handleSuggestionClick("What ML projects have you worked on?")} 
                  className="text-[11px] text-left bg-[#080808] border border-[#1f2937] hover:border-[#2563EB] hover:bg-[#0C0C0C] text-[#888] hover:text-white px-4 py-3 transition-all group"
                >
                  What ML projects have you worked on?
                </button>
                <button 
                  onClick={() => handleSuggestionClick("Tell me about your tech stack")} 
                  className="text-[11px] text-left bg-[#080808] border border-[#1f2937] hover:border-[#2563EB] hover:bg-[#0C0C0C] text-[#888] hover:text-white px-4 py-3 transition-all group"
                >
                  Tell me about your tech stack
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
        {/* Messages */}
        {history.map((msg, idx) => (
          <div key={idx} className={`flex flex-col animate-fade-in ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className={`text-[9px] font-mono uppercase tracking-[0.15em] mb-1.5 text-[#525252] ${msg.role === 'user' ? 'mr-1' : 'ml-1'}`}>
              {msg.role === 'user' ? 'You' : 'EB'}
            </span>
            <div className={`max-w-[85%] px-4 py-3 text-[13px] leading-relaxed font-mono border ${
              msg.role === 'user' 
                ? 'bg-[#2563EB]/10 border-[#2563EB]/30 text-[#c7d9ff]' 
                : 'bg-[#080808] border-[#1f2937] text-[#d4d4d4]'
            }`}>
              {msg.text}
              {msg.role === 'model' && renderReferencedProjects(msg.referencedSlugs)}
            </div>
          </div>
        ))}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-start animate-fade-in">
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] mb-1.5 text-[#525252] ml-1">EB</span>
            <div className="bg-[#080808] border border-[#1f2937] px-4 py-3 flex gap-2 items-center">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#2563EB] animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-[#2563EB] animate-pulse" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#2563EB] animate-pulse" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-[11px] text-[#737373]">Thinking...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-[11px] text-red-400 font-mono bg-red-500/5 border border-red-500/20 px-4 py-3">
            {error}
          </div>
        )}
        <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-[#1f2937] bg-[#080808] p-4">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask me anything..."
            className="w-full bg-[#0A0A0A] border border-[#1f2937] pl-4 pr-12 py-3 text-white focus:outline-none focus:border-[#2563EB] transition-colors text-[13px] placeholder-[#525252]"
            aria-label="Ask EB about this portfolio"
          />
          <button 
            type="submit" 
            disabled={isLoading || !question.trim()}
            className="absolute right-2 w-8 h-8 flex items-center justify-center bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-20 disabled:bg-[#262626] transition-all"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AskPortfolioWidget;
