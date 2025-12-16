import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { ConsoleLane, ChatMessage } from '../lib/types';
import { DEFAULT_MODEL_ID } from '../lib/models';

// Terminal entry type for Mr. Robot terminal
export interface TerminalEntry {
  type: 'input' | 'output';
  content: string;
}

interface ConsoleContextType {
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  focusedDiscipline: ConsoleLane | null;
  setFocusedDiscipline: (lane: ConsoleLane | null) => void;
  highlightedNodeIds: Set<string>;
  setHighlightedNodeIds: (ids: string[]) => void;
  isNodeHighlighted: (id: string) => boolean;
  isAgentOpen: boolean;
  setIsAgentOpen: (isOpen: boolean) => void;
  // Shared chat state
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
  editMessageAt: (idx: number, newText: string) => void;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  // Easter egg state
  isEasterEggActive: boolean;
  setIsEasterEggActive: (active: boolean) => void;
  // Terminal state (persists across open/close)
  terminalHistory: TerminalEntry[];
  addTerminalEntry: (entry: TerminalEntry) => void;
  setTerminalHistory: (entries: TerminalEntry[] | ((prev: TerminalEntry[]) => TerminalEntry[])) => void;
  clearTerminalHistory: () => void;
  terminalCommandHistory: string[];
  addTerminalCommand: (cmd: string) => void;
  terminalCurrentDir: string;
  setTerminalCurrentDir: (dir: string) => void;
  terminalHasSeenIntro: boolean;
  setTerminalHasSeenIntro: (seen: boolean) => void;
}

export const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export const ConsoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedDiscipline, setFocusedDiscipline] = useState<ConsoleLane | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIdsState] = useState<Set<string>>(new Set());
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isEasterEggActive, setIsEasterEggActive] = useState(false);

  // Shared chat state - synced across all widget instances
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_MODEL_ID);

  // Terminal state - persists across open/close
  const [terminalHistory, setTerminalHistoryState] = useState<TerminalEntry[]>([]);
  const [terminalCommandHistory, setTerminalCommandHistory] = useState<string[]>([]);
  const [terminalCurrentDir, setTerminalCurrentDir] = useState<string>('/home/friend');
  const [terminalHasSeenIntro, setTerminalHasSeenIntro] = useState<boolean>(false);

  // Memoized setter that converts array to Set
  const setHighlightedNodeIds = useCallback((ids: string[]) => {
    setHighlightedNodeIdsState(new Set(ids));
  }, []);

  // O(1) lookup helper
  const isNodeHighlighted = useCallback((id: string) => {
    return highlightedNodeIds.has(id);
  }, [highlightedNodeIds]);

  // Chat state helpers
  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  }, []);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
  }, []);

  // Edit a message and remove all subsequent messages
  const editMessageAt = useCallback((idx: number, newText: string) => {
    setChatHistory(prev => {
      if (idx < 0 || idx >= prev.length) return prev;
      const updated = prev.slice(0, idx);
      updated.push({ ...prev[idx], text: newText });
      return updated;
    });
  }, []);

  // Terminal state helpers
  const addTerminalEntry = useCallback((entry: TerminalEntry) => {
    setTerminalHistoryState(prev => [...prev, entry]);
  }, []);

  const setTerminalHistory = useCallback((entries: TerminalEntry[] | ((prev: TerminalEntry[]) => TerminalEntry[])) => {
    if (typeof entries === 'function') {
      setTerminalHistoryState(entries);
    } else {
      setTerminalHistoryState(entries);
    }
  }, []);

  const clearTerminalHistory = useCallback(() => {
    setTerminalHistoryState([]);
  }, []);

  const addTerminalCommand = useCallback((cmd: string) => {
    setTerminalCommandHistory(prev => [...prev, cmd]);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    hoveredNodeId,
    setHoveredNodeId,
    focusedDiscipline,
    setFocusedDiscipline,
    highlightedNodeIds,
    setHighlightedNodeIds,
    isNodeHighlighted,
    isAgentOpen,
    setIsAgentOpen,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    editMessageAt,
    selectedModelId,
    setSelectedModelId,
    isEasterEggActive,
    setIsEasterEggActive,
    // Terminal state
    terminalHistory,
    addTerminalEntry,
    setTerminalHistory,
    clearTerminalHistory,
    terminalCommandHistory,
    addTerminalCommand,
    terminalCurrentDir,
    setTerminalCurrentDir,
    terminalHasSeenIntro,
    setTerminalHasSeenIntro,
  }), [
    hoveredNodeId,
    focusedDiscipline,
    highlightedNodeIds,
    setHighlightedNodeIds,
    isNodeHighlighted,
    isAgentOpen,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    editMessageAt,
    selectedModelId,
    isEasterEggActive,
    // Terminal state
    terminalHistory,
    addTerminalEntry,
    setTerminalHistory,
    clearTerminalHistory,
    terminalCommandHistory,
    addTerminalCommand,
    terminalCurrentDir,
    terminalHasSeenIntro,
  ]);

  return (
    <ConsoleContext.Provider value={value}>
      {children}
    </ConsoleContext.Provider>
  );
};

export const useConsole = () => {
  const context = useContext(ConsoleContext);
  if (context === undefined) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return context;
};
