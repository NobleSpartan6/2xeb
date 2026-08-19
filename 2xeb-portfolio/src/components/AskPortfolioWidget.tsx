import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { askPortfolioStreaming } from '../lib/api';
import { buildProjectContext } from '../data';
import { PROJECTS } from '../data';
import { useConsole } from '../context/ConsoleContext';
import { MODELS, getModelByIdOrDefault } from '../lib/models';

interface WidgetProps {
  compact?: boolean;
  autoFocus?: boolean;
}

const SUGGESTIONS = [
  'What ML projects have you worked on?',
  'Tell me about your tech stack',
  'How was this site built?',
];

// Lightweight markdown renderer (~50 lines, no deps)
function renderMarkdown(text: string): string {
  return text
    // Code blocks (```...```)
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-[#0a0a0a] border border-[#1f2937] p-3 my-2 overflow-x-auto text-[11px]"><code>$2</code></pre>')
    // Inline code (`...`)
    .replace(/`([^`]+)`/g, '<code class="bg-[#1a1a1a] px-1.5 py-0.5 text-[#06B6D4] text-[11px]">$1</code>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const safeHref = String(href || '').trim();
      // Allow only http(s) or same-site relative paths; otherwise render plain text.
      if (!/^https?:\/\//i.test(safeHref) && !safeHref.startsWith('/')) {
        return label;
      }
      // BrowserRouter: internal routes use regular paths
      const escapedHref = safeHref.replace(/"/g, '&quot;');
      return `<a class="text-[#2563EB] hover:underline" href="${escapedHref}">${label}</a>`;
    })
    // Bold (**...**)
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Italic (*...*)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // Unordered lists (- item)
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Numbered lists (1. item)
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>' );
}

// Copy to clipboard helper
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Blinking block caret — the agent's "cursor" while thinking/streaming */
const Caret: React.FC = () => (
  <span
    aria-hidden
    className="inline-block w-[7px] h-[14px] translate-y-[2px] bg-[#2563EB] animate-caret-blink"
  />
);

const AskPortfolioWidget: React.FC<WidgetProps> = ({ compact = false, autoFocus = false }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const lastUserMessageRef = useRef<string>('');

  // Use shared state from context
  const {
    setHighlightedNodeIds,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    editMessageAt,
    selectedModelId,
    setSelectedModelId,
  } = useConsole();

  const currentModel = getModelByIdOrDefault(selectedModelId);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [autoFocus]);

  const scrollToBottom = () => {
    // Use scrollTop on container to avoid scrolling the entire page
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM has updated
    requestAnimationFrame(scrollToBottom);
  }, [chatHistory, isLoading, streamingText]);

  const formatFriendlyError = (raw: string) => {
    const lower = raw.toLowerCase();
    const alternatives = MODELS.filter(m => m.id !== selectedModelId).map(m => m.name);
    const suggestion = alternatives.length
      ? `Try switching the model below to ${alternatives.join(' or ')}.`
      : 'Try switching the model below to a different option.';

    if (lower.includes('429') || lower.includes('quota') || lower.includes('rate')) {
      return `The AI hit a quota/rate limit. ${suggestion}`;
    }
    if (lower.includes('unauthorized') || lower.includes('auth')) {
      return `The AI service is temporarily unavailable. ${suggestion}`;
    }
    if (lower.includes('ask portfolio failed')) {
      return `The AI service had an issue. ${suggestion}`;
    }
    return `Something went wrong. ${suggestion}`;
  };

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    lastUserMessageRef.current = messageText;
    const userMsg = { role: 'user' as const, text: messageText };
    addChatMessage(userMsg);
    setQuestion('');
    setIsLoading(true);
    setIsStreaming(currentModel.provider === 'groq');
    setStreamingText('');
    setError(null);

    try {
      const context = buildProjectContext();
      const { answer, projectSlugs } = await askPortfolioStreaming(
        messageText,
        context,
        selectedModelId,
        (chunk) => {
          if (currentModel.provider === 'groq') {
            setStreamingText((prev) => prev + chunk);
          }
        }
      );

      if (answer && answer.trim()) {
        setHighlightedNodeIds(projectSlugs);
        addChatMessage({
          role: 'model',
          text: answer,
          referencedSlugs: projectSlugs,
        });
      } else {
        setError('Received empty response. Please try again or switch models.');
      }
    } catch (err) {
      console.error('AI widget error:', err);
      const rawMsg = err instanceof Error ? err.message : 'System unavailable. Try again.';
      setError(formatFriendlyError(rawMsg));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingText('');
    }
  }, [isLoading, addChatMessage, selectedModelId, setHighlightedNodeIds, formatFriendlyError, currentModel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(question);
  };

  const handleRegenerate = useCallback(() => {
    if (lastUserMessageRef.current && !isLoading) {
      sendMessage(lastUserMessageRef.current);
    }
  }, [isLoading, sendMessage]);

  const handleCopy = useCallback(async (text: string, idx: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  }, []);

  const handleClearChat = useCallback(() => {
    clearChatHistory();
    setError(null);
    lastUserMessageRef.current = '';
    setEditingIdx(null);
    setEditText('');
    setStreamingText('');
    setIsStreaming(false);
  }, [clearChatHistory]);

  const handleSuggestionClick = (text: string) => {
    setQuestion(text);
    if (inputRef.current) inputRef.current.focus();
  };

  // Edit message handlers
  const startEditing = useCallback((idx: number, currentText: string) => {
    // Can't edit while loading or if already editing
    if (isLoading || editingIdx !== null) return;
    // Can only edit user messages
    if (chatHistory[idx]?.role !== 'user') return;

    setEditingIdx(idx);
    setEditText(currentText);
  }, [isLoading, editingIdx, chatHistory]);

  const cancelEditing = useCallback(() => {
    setEditingIdx(null);
    setEditText('');
  }, []);

  const submitEdit = useCallback(async () => {
    // Validation: can't submit empty, while loading, or without valid edit state
    if (editingIdx === null || isLoading) return;
    const trimmedText = editText.trim();
    if (!trimmedText) return;

    // If text unchanged, just cancel
    if (trimmedText === chatHistory[editingIdx]?.text) {
      cancelEditing();
      return;
    }

    // Edit the message (this also removes subsequent messages)
    editMessageAt(editingIdx, trimmedText);
    lastUserMessageRef.current = trimmedText;
    setEditingIdx(null);
    setEditText('');
    setError(null);
    setIsLoading(true);
    setIsStreaming(currentModel.provider === 'groq');
    setStreamingText('');

    // Regenerate AI response with edited message
    try {
      const context = buildProjectContext();
      const { answer, projectSlugs } = await askPortfolioStreaming(
        trimmedText,
        context,
        selectedModelId,
        (chunk) => {
          if (currentModel.provider === 'groq') {
            setStreamingText((prev) => prev + chunk);
          }
        }
      );

      if (answer && answer.trim()) {
        setHighlightedNodeIds(projectSlugs);
        addChatMessage({
          role: 'model',
          text: answer,
          referencedSlugs: projectSlugs,
        });
      } else {
        setError('Received empty response. Please try again or switch models.');
      }
    } catch (err) {
      console.error('AI widget error:', err);
      const rawMsg = err instanceof Error ? err.message : 'System unavailable. Try again.';
      setError(formatFriendlyError(rawMsg));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingText('');
    }
  }, [editingIdx, editText, isLoading, chatHistory, editMessageAt, selectedModelId, setHighlightedNodeIds, addChatMessage, formatFriendlyError, cancelEditing, currentModel]);

  // Handle keyboard events for edit input
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      cancelEditing();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitEdit();
    }
  }, [cancelEditing, submitEdit]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingIdx !== null && editInputRef.current) {
      editInputRef.current.focus();
      // Move cursor to end
      editInputRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [editingIdx, editText.length]);

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
        ref={chatContainerRef}
        className={`flex-grow min-h-0 overflow-y-auto custom-scrollbar flex flex-col ${compact ? 'p-4' : 'p-5'}`}
        aria-live="polite"
      >
        {chatHistory.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            {/* Keyed on the open signal so the entrance replays each time the
                panel opens (the widget stays mounted while hidden) */}
            <div
              key={autoFocus ? 'open' : 'idle'}
              className="flex flex-col items-center text-center px-4 w-full max-w-[340px]"
            >
              {/* Identity mark */}
              <div className="w-12 h-12 bg-[#080808] border border-[#1f2937] grid place-items-center animate-rise-in" style={{ animationDelay: '60ms' }}>
                <span className="text-[#2563EB] font-bold text-sm font-space-grotesk tracking-tight">EB</span>
              </div>

              <p
                className="mt-4 text-[#737373] text-[13px] leading-relaxed animate-rise-in"
                style={{ animationDelay: '120ms' }}
              >
                Ask about Ebenezer's projects, stack, or experience.
              </p>

              {/* Suggestions — animation lives on the wrapper so .pressable's
                  transform on the button never fights the keyframes */}
              <div className="mt-6 grid gap-2 w-full">
                {SUGGESTIONS.map((s, i) => (
                  <div key={s} className="animate-rise-in" style={{ animationDelay: `${180 + i * 60}ms` }}>
                    <button
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full flex items-center gap-2.5 text-left text-[11px] font-mono bg-[#080808] border border-[#1f2937] hover:border-[#2563EB]/70 hover:bg-[#0C0C0C] text-[#8a8a8a] hover:text-white px-3.5 py-3 pressable"
                    >
                      <span className="text-[#2563EB]" aria-hidden>&gt;</span>
                      <span className="flex-1">{s}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
        {/* Messages — transcript style: agent output on a left rail, user
            input on a right rail */}
        {chatHistory.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isLastMessage = idx === chatHistory.length - 1;
          return (
          <div key={idx} className={`flex flex-col animate-message-in ${isUser ? 'items-end' : 'items-start'}`}>
            <span className={`text-[9px] font-mono uppercase tracking-[0.18em] mb-1.5 ${isUser ? 'mr-0.5 text-[#525252]' : 'ml-0.5 text-[#2563EB]'}`}>
              {isUser ? 'You' : 'EB'}
            </span>

            {/* User message - with edit mode */}
            {isUser && editingIdx === idx ? (
              <div className="max-w-[85%] w-full">
                <div className="flex flex-col gap-2 bg-[#2563EB]/[0.08] border border-[#2563EB]/40 p-3">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="w-full bg-[#0A0A0A] border border-[#1f2937] px-3 py-2 text-white focus:outline-none focus:border-[#2563EB] text-[16px] sm:text-[13px] font-mono"
                    placeholder="Edit your message..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 border border-[#262626] text-[#737373] hover:text-white hover:border-[#404040] pressable"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitEdit}
                      disabled={!editText.trim() || isLoading}
                      className="text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-30 disabled:cursor-not-allowed pressable"
                    >
                      Save & Resend
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className={`max-w-[85%] px-4 py-3 text-[13px] leading-relaxed font-mono ${
                  isUser
                    ? 'bg-[#2563EB]/[0.08] border-r-2 border-[#2563EB] text-[#c7d9ff]'
                    : 'bg-[#080808]/70 border-l-2 border-[#1f2937] text-[#d4d4d4]'
                }`}>
                  {isUser ? (
                    msg.text
                  ) : (
                    <div
                      className="prose-sm prose-invert"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                    />
                  )}
                  {!isUser && renderReferencedProjects(msg.referencedSlugs)}
                </div>

                {/* Action row — always visible but quiet, so it works on touch */}
                {!isLoading && editingIdx === null && (
                  <div className={`flex items-center gap-3 mt-1.5 ${isUser ? 'mr-0.5' : 'ml-0.5'}`}>
                    {isUser ? (
                      <button
                        onClick={() => startEditing(idx, msg.text)}
                        className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-[#3f3f46] hover:text-white transition-colors"
                        title="Edit message"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                        </svg>
                        Edit
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCopy(msg.text, idx)}
                          className={`flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest transition-colors ${
                            copiedIdx === idx ? 'text-[#2563EB]' : 'text-[#3f3f46] hover:text-white'
                          }`}
                          title="Copy"
                        >
                          {copiedIdx === idx ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                              <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                              <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                            </svg>
                          )}
                          {copiedIdx === idx ? 'Copied' : 'Copy'}
                        </button>
                        {isLastMessage && (
                          <button
                            onClick={handleRegenerate}
                            className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-[#3f3f46] hover:text-white transition-colors"
                            title="Regenerate"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                            </svg>
                            Retry
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          );
        })}

        {/* Loading state — blinking terminal caret; streamed text keeps the
            caret at its tail so thinking flows into typing */}
        {(isLoading || isStreaming || streamingText) && (
          <div className="flex flex-col items-start animate-message-in">
            <span className="text-[9px] font-mono uppercase tracking-[0.18em] mb-1.5 ml-0.5 text-[#2563EB]">
              EB
            </span>
            <div className="bg-[#080808]/70 border-l-2 border-[#2563EB]/60 px-4 py-3 max-w-[85%] text-[13px] leading-relaxed font-mono text-[#d4d4d4]">
              {streamingText && (
                <div
                  className="prose-sm prose-invert inline"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText) }}
                />
              )}
              {streamingText ? <span className="ml-1"><Caret /></span> : <Caret />}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-start animate-message-in">
            <span className="text-[9px] font-mono uppercase tracking-[0.18em] mb-1.5 ml-0.5 text-red-400/80">System</span>
            <div className="max-w-[85%] px-4 py-3 bg-red-500/[0.04] border-l-2 border-red-500/60 text-[11px] font-mono text-red-300/90 leading-relaxed">
              {error}
              {lastUserMessageRef.current && (
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="block mt-2 text-[9px] font-mono uppercase tracking-widest text-red-300 hover:text-white transition-colors disabled:opacity-40"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="border-t border-[#1f2937] bg-[#080808] p-3 sm:p-4">
        {/* Model segmented control + Clear */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] text-[#525252] font-mono uppercase tracking-widest shrink-0">Model</span>
            <div className="flex border border-[#262626] divide-x divide-[#262626] overflow-x-auto max-w-full">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModelId(model.id)}
                  title={model.description}
                  aria-pressed={selectedModelId === model.id}
                  className={`px-2 sm:px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedModelId === model.id
                      ? 'bg-[#2563EB]/15 text-[#2563EB]'
                      : 'text-[#525252] hover:text-[#a3a3a3] hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="hidden md:inline">{model.name}</span>
                  <span className="md:hidden">{model.shortName}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Clear Chat Button */}
          {chatHistory.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="shrink-0 text-[9px] font-mono uppercase tracking-widest text-[#525252] hover:text-red-400 transition-colors flex items-center gap-1"
              title="Clear chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 3.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
              Clear
            </button>
          )}
        </div>

        {/* Prompt line: > glyph + input + send */}
        <div className="flex items-center bg-[#0A0A0A] border border-[#1f2937] focus-within:border-[#2563EB] transition-colors">
          <span className="pl-3.5 pr-1 text-[#2563EB] font-mono text-[13px] select-none" aria-hidden>&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={editingIdx !== null ? "Finish editing above..." : "Ask about the work..."}
            disabled={editingIdx !== null}
            className="flex-1 min-w-0 bg-transparent px-2 py-3 text-white focus:outline-none text-[16px] sm:text-[13px] font-mono placeholder-[#404040] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Ask EB about this portfolio"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim() || editingIdx !== null}
            className="m-1.5 w-8 h-8 shrink-0 flex items-center justify-center bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-20 disabled:bg-[#262626] pressable"
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
