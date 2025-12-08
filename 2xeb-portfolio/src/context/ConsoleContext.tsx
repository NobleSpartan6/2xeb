import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { ConsoleLane, ChatMessage } from '../lib/types';
import { DEFAULT_MODEL_ID } from '../lib/models';

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
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
}

export const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export const ConsoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedDiscipline, setFocusedDiscipline] = useState<ConsoleLane | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIdsState] = useState<Set<string>>(new Set());
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  // Shared chat state - synced across all widget instances
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_MODEL_ID);

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
    selectedModelId,
    setSelectedModelId,
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
    selectedModelId,
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
