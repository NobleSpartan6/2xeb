# Context Directory - CLAUDE.md

React Context providers for shared application state.

## ConsoleContext.tsx

Central state management for the portfolio application.

### State

| Property | Type | Description |
|----------|------|-------------|
| `hoveredNodeId` | `string \| null` | Currently hovered 3D node |
| `focusedDiscipline` | `ConsoleLane \| null` | Discipline filter from footer |
| `highlightedNodeIds` | `Set<string>` | Nodes highlighted by AI response |
| `isAgentOpen` | `boolean` | Whether chat panel is open |
| `chatHistory` | `ChatMessage[]` | **Shared chat history** |
| `selectedModelId` | `string` | **Selected LLM model ID** |
| `isEasterEggActive` | `boolean` | **Easter egg terminal visible** |
| `terminalHistory` | `TerminalEntry[]` | **Terminal output history** |
| `terminalCommandHistory` | `string[]` | **Commands for arrow-key nav** |
| `terminalCurrentDir` | `string` | **Terminal current directory** |
| `terminalHasSeenIntro` | `boolean` | **Skip intro on reopening** |

### Usage

```typescript
import { useConsole, TerminalEntry } from '../context/ConsoleContext';

const {
  // 3D scene state
  hoveredNodeId,
  setHoveredNodeId,
  focusedDiscipline,
  setFocusedDiscipline,
  highlightedNodeIds,
  setHighlightedNodeIds,
  isNodeHighlighted,

  // Chat panel state
  isAgentOpen,
  setIsAgentOpen,

  // Shared chat state (synced across widgets)
  chatHistory,
  addChatMessage,
  clearChatHistory,
  editMessageAt,          // Edit message and truncate subsequent
  selectedModelId,
  setSelectedModelId,

  // Easter egg state
  isEasterEggActive,
  setIsEasterEggActive,

  // Terminal state (persists across open/close)
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
} = useConsole();
```

### Chat State Sync

The chat state is shared across all access points:

```
┌─────────────────────────────────────────────────────┐
│                  ConsoleContext                      │
│  ┌──────────────┐  ┌────────────────┐               │
│  │ chatHistory  │  │ selectedModelId│               │
│  └──────┬───────┘  └───────┬────────┘               │
└─────────┼──────────────────┼────────────────────────┘
          │                  │
    ┌─────┴─────┐     ┌──────┴──────┐
    ▼           ▼     ▼             ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│FooterHUD│ │ MLLab │ │NavBar  │ │ Other │
│ Widget │ │ Widget│ │(drawer)│ │        │
└────────┘ └────────┘ └────────┘ └────────┘
```

- Chat history persists when switching between access points
- Model selection is shared (change in one place, reflects everywhere)
- Highlighted nodes from AI responses update the 3D scene

### R3F Canvas Integration

Context must be re-provided inside React Three Fiber Canvas:

```tsx
<Canvas>
  <ConsoleContext.Provider value={consoleCtx}>
    {/* 3D components can now access context */}
  </ConsoleContext.Provider>
</Canvas>
```

### Performance Considerations

- `isNodeHighlighted()` uses Set for O(1) lookup
- Context value is memoized to prevent unnecessary re-renders
- Setters are wrapped in `useCallback`
