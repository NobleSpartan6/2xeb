import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ConsoleLane } from '../lib/types';

interface ConsoleContextType {
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  focusedDiscipline: ConsoleLane | null;
  setFocusedDiscipline: (lane: ConsoleLane | null) => void;
  highlightedNodeIds: string[]; // For AI search results
  setHighlightedNodeIds: (ids: string[]) => void;
  isAgentOpen: boolean;
  setIsAgentOpen: (isOpen: boolean) => void;
}

export const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export const ConsoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedDiscipline, setFocusedDiscipline] = useState<ConsoleLane | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  return (
    <ConsoleContext.Provider value={{
      hoveredNodeId,
      setHoveredNodeId,
      focusedDiscipline,
      setFocusedDiscipline,
      highlightedNodeIds,
      setHighlightedNodeIds,
      isAgentOpen,
      setIsAgentOpen
    }}>
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