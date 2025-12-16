# Components Directory - CLAUDE.md

Reusable UI components for the 2xeb portfolio.

## Key Components

### AskPortfolioWidget.tsx
AI-powered chat widget for answering portfolio questions.

**Features:**
- Multi-model support via Groq (Llama 3.1 8B, Llama 3.1 70B, Llama 3.3 70B)
- Model selector UI showing actual model names
- **Shared chat state** via ConsoleContext (synced across all access points)
- Client-side rate limiting with user-friendly error messages
- Project reference links from AI responses

**Props:**
```typescript
interface WidgetProps {
  compact?: boolean;   // Compact layout mode
  autoFocus?: boolean; // Auto-focus input on mount
}
```

**Shared State (via ConsoleContext):**
- `chatHistory` - Synced across FooterHUD and MLLab widget
- `selectedModelId` - Selected model persists across sessions
- Switching models mid-conversation is seamless

### NavBar.tsx
Main navigation with responsive mobile drawer.

**Features:**
- Desktop: Horizontal nav links
- Mobile: Side drawer with nav links + "Ask EB" button
- "Ask EB" uses EB block branding (not icons)

### FooterHUD.tsx
Global footer with chat panel and discipline indicators.

**Features:**
- Expandable chat panel (uses AskPortfolioWidget)
- "Ask EB" button with EB block branding
- Discipline hover states connected to 3D scene
- Hides Ask EB button on ML Lab page (inline widget there)

### ProjectCard.tsx
Card component for displaying project previews in grids.

### DisciplineChip.tsx
Small chip/tag for displaying discipline labels (SWE, ML, VIDEO).

## Design Language

**Branding:**
- Use "EB" block instead of AI-related icons (stars, lightning bolts)
- Consistent with portfolio's minimal, technical aesthetic
- Avoids flashy/corny AI iconography

**EB Block Pattern:**
```tsx
<div className="w-6 h-6 bg-[#0A0A0A] border border-[#1f2937] grid place-items-center">
  <span className="text-[#2563EB] font-bold text-[10px] font-space-grotesk tracking-tight">EB</span>
</div>
```

**Color Palette:**
- Primary: `#2563EB` (Swiss Blue)
- Background: `#0A0A0A`, `#080808`, `#050505`
- Borders: `#262626`, `#1f2937`
- Text: `#ffffff`, `#a3a3a3`, `#737373`, `#525252`

**Typography:**
- Headings: `font-space-grotesk`
- Body/Code: `font-mono`
- Uppercase labels: `text-[10px] uppercase tracking-widest`

## Context Integration

Components use `ConsoleContext` for shared state:
```typescript
const {
  setIsAgentOpen,
  setHighlightedNodeIds,
  chatHistory,
  addChatMessage,
  selectedModelId,
  setSelectedModelId,
} = useConsole();
```

## Chat Session Sync

Chat sessions are synced across:
1. **FooterHUD** - Global bottom panel
2. **MLLab** - Inline widget
3. **NavBar mobile drawer** - Opens FooterHUD

All use the same `chatHistory` and `selectedModelId` from ConsoleContext.
