# Components Directory - CLAUDE.md

Reusable UI components for the 2xeb portfolio.

## Key Components

### AskPortfolioWidget.tsx
AI-powered chat widget for answering portfolio questions.

**Features:**
- Multi-model support via Groq:
  - `llama-3.1-8b-instant` (fast, high daily limit)
  - `llama-3.1-70b-versatile` (balanced)
  - `llama-3.3-70b-versatile` (powerful, default)
- Model selector UI showing actual model names
- **Shared chat state** via ConsoleContext (synced across all access points)
- Client-side rate limiting with user-friendly error messages
- Project reference links from AI responses
- SSE streaming for real-time responses

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

### MrRobotTerminal.tsx
Easter egg terminal component inspired by Mr. Robot.

**Features:**
- Full Unix command emulation (ls, cat, cd, pwd, echo, grep, etc.)
- Hidden file system with philosophy content
- Tab completion for commands
- Command history navigation (arrow keys)
- Responsive (works on mobile)

**Available Commands:**
- **Navigation**: `ls`, `cd`, `pwd`, `cat`, `find`, `head`, `tail`
- **Standard Unix**: `echo`, `date`, `id`, `uname`, `hostname`, `uptime`, `history`, `env`, `which`, `man`
- **File Ops**: `touch`, `mkdir`, `rm`, `cp`, `mv`, `chmod`, `chown`
- **Network**: `ping`, `curl`, `wget`, `ssh`, `netstat`, `ifconfig`
- **Process**: `ps`, `top`, `htop`, `kill`
- **Dev Tools**: `git`, `npm`, `node`, `python`, `vim`, `nano`, `code`, `make`
- **Special**: `help`, `whoami`, `fsociety`, `clear`, `exit`

**File System:**
```
/home/friend/
├── projects/           # Links to portfolio projects
├── readme.txt          # Welcome message
├── manifesto.txt       # Creation philosophy
├── .truth              # Hidden: authenticity quotes
└── .fsociety/          # Hidden directory
    ├── control.txt     # On control as illusion
    ├── freedom.txt     # Philosophy of freedom
    ├── revolution.txt  # Creation as revolution
    ├── you.txt         # Dynamic: personal message
    └── .leap           # Deepest hidden: on starting
```

**State Management:**
Uses ConsoleContext for persisted state:
- `terminalHistory` - Output entries
- `terminalCommandHistory` - For arrow key navigation
- `terminalCurrentDir` - Current directory
- `terminalHasSeenIntro` - Skip intro on subsequent opens

### SystemAgent.tsx
Legacy component (minimal usage).

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
