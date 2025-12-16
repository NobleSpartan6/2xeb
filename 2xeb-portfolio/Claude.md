# Claude Code Development Notes

## Project Overview

This is a full-stack portfolio platform built with React 19, TypeScript, React Three Fiber, and Supabase. It features:
- **3D Spatial Interface**: Three distinct WebGL scenes optimized for different use cases
- **AI Assistant**: Multi-model LLM integration (Groq, Gemini) with streaming responses
- **Admin CMS**: Full CRUD interface with authentication, RLS, and audit logging
- **Hybrid Content**: Static TypeScript modules + optional Supabase database backend
- **Performance Optimized**: Code splitting, WebGL optimizations, responsive rendering
- **Production Ready**: Deployed to Cloudflare Pages with security headers

## Architecture Highlights

### Content Management
- **Static Data**: `/src/data/` contains TypeScript modules (projects.ts, timeline.ts, graph.ts, caseStudies.ts)
- **Database Backend**: Optional Supabase tables for admin CMS (projects, experience, case_studies, pages)
- **Hybrid Approach**: Public content uses static files; admin can manage via database

### 3D Scenes
- **ImmersiveScene**: Full-screen home page with discipline-based agent movement (40×40 grid, 24×24 mobile)
- **SystemConsoleScene**: Isometric project browser with graph-based connections
- **OrbitScene**: Animated background grid for secondary pages
- All use InstancedMesh for performance optimization

### AI Integration
- **Multi-Provider**: Supports Groq (Llama 3.1/3.3) and Gemini 2.0 Flash
- **Streaming**: SSE streaming for real-time token rendering
- **Rate Limiting**: Client-side rate limiting with localStorage persistence
- **Context Building**: Dynamic context from static project data

### Security
- **Authentication**: Magic link authentication via Supabase Auth
- **Authorization**: Row Level Security (RLS) policies at database level
- **Audit Logging**: All content changes logged with metadata (IP, user agent, timestamp)
- **Security Headers**: Configured in Cloudflare Pages

### Performance
- **Code Splitting**: React.lazy() for admin routes
- **Bundle Optimization**: Code splitting and tree shaking reduce initial load
- **WebGL Performance**: InstancedMesh rendering for efficient 3D scene rendering
- **Responsive Rendering**: Adaptive grid sizes and quality settings for mobile devices

## Debug Mode

To enable verbose console logging during development, add the following to your `.env.local` file:

```
VITE_DEBUG=true
```

This enables debug output for:
- Supabase configuration status
- Authentication state changes
- Admin status checks
- REST API mutations
- Demo mode warnings

The debug logger is defined in `src/lib/debug.ts` and supports:
- `debug.log()` - General debug messages
- `debug.warn()` - Warning messages
- `debug.info()` - Informational messages

**Note:** `console.error()` calls are NOT behind the debug flag as they indicate actual errors that should always be visible.

## Environment Variables

Required for full functionality:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SUPABASE_FUNCTIONS_URL` - Edge Functions URL

Optional:
- `VITE_DEBUG=true` - Enable debug logging (recommended for development)

## Key Directories

- `/src/data/` - Static TypeScript content modules
- `/src/3d/` - React Three Fiber 3D scenes
- `/src/components/` - Reusable UI components
- `/src/pages/admin/` - Admin CMS pages (protected routes)
- `/src/context/` - React Context providers (ConsoleContext, AuthContext)
- `/src/lib/` - Utilities, API helpers, types
- `/supabase/functions/` - Edge Functions (ask-portfolio, submit-contact, spotify-now-playing)

## Documentation

See individual CLAUDE.md files in subdirectories for detailed documentation:
- `/src/components/CLAUDE.md` - Component documentation
- `/src/3d/CLAUDE.md` - 3D scene architecture
- `/src/pages/admin/CLAUDE.md` - Admin CMS system
- `/src/context/CLAUDE.md` - Context providers
- `/src/lib/CLAUDE.md` - Library utilities
- `/supabase/CLAUDE.md` - Edge Functions

## Deployment

- **Platform**: Cloudflare Pages
- **Routing**: HashRouter for SPA routing
- **Build**: Vite production build
- **Edge Functions**: Supabase Edge Functions (deployed separately)
- **Security**: Headers configured in Cloudflare Pages settings

## Easter Egg: Mr. Robot Terminal

A hidden terminal experience inspired by Mr. Robot, featuring philosophy on creation, authenticity, and breaking from the crowd.

### Activation Methods

| Method | Platform | Action |
|--------|----------|--------|
| Keyboard | Desktop | Type "friend" anywhere on site (outside input fields) |
| Double-click | Desktop | Double-click the 2XEB. logo in footer |
| Long-press | Mobile | Hold the 2XEB. logo for 2 seconds |
| Direct URL | All | Navigate to `/friend` |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │EasterEggListener│  │EasterEggOverlay │  │FriendRoute   │ │
│  │ (useEasterEgg)  │  │(MrRobotTerminal)│  │ Activator    │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘ │
└───────────┼────────────────────┼────────────────── ┼─────────┘
            │                    │                   │
            └──────────┬─────────┴───────────────────┘
                       ▼
              ┌────────────────────┐
              │   ConsoleContext   │
              │ isEasterEggActive  │
              └────────┬───────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
    ┌───────────────┐    ┌───────────────┐
    │  FooterHUD    │    │MrRobotTerminal│
    │ (logo events) │    │ (overlay UI)  │
    └───────────────┘    └───────────────┘
```

### Key Files

- `/src/components/MrRobotTerminal.tsx` - Full terminal UI with CRT effects
- `/src/hooks/useEasterEgg.ts` - Detection hook (keyboard buffer, gestures)
- `/src/context/ConsoleContext.tsx` - State management (`isEasterEggActive`)

### Terminal Commands

**Core Commands:**
- `help` - Available commands (includes hint about hidden files)
- `whoami` - Random identity/philosophy responses
- `ls` - List visible files only (Unix-authentic)
- `ls -a` - List all files including hidden (reveals `.fsociety/`, `.truth`)
- `ls -la` - Detailed listing with hidden files
- `cat <file>` - Read files
- `fsociety` - ASCII art + creation manifesto
- `clear` / `exit` - Terminal controls

**File System (Unix-authentic hidden file behavior):**
```
/home/friend/
├── projects/
├── .fsociety/           <- hidden, use ls -a
│   ├── control.txt      (control is an illusion)
│   ├── freedom.txt      (three ways to live)
│   ├── revolution.txt   (creation as revolution)
│   ├── you.txt          (dynamic: timestamp, resolution, personal message)
│   └── .leap            <- hidden, use ls -a .fsociety
├── readme.txt           (welcome message)
├── manifesto.txt        (creation philosophy)
└── .truth               <- hidden, use ls -a
```

**Unix Navigation (fully functional):**
- `cd .fsociety` → changes directory, updates prompt
- `cd ..` → goes back to parent
- `cd ~` / `cd` → returns to home
- `pwd` → shows current directory
- `ls` → context-aware (shows files in current directory)
- `cat control.txt` → works when inside .fsociety directory

**Discovery Flow:**
1. `ls` → shows visible files only
2. `ls -a` → reveals `.fsociety/` and `.truth`
3. `cd .fsociety` → enter the hidden directory
4. `ls -a` → reveals `.leap`
5. Tab completion also respects hidden files (type `.` to see dotfiles)

**Easter Egg Commands:** `hack`, `robot`, `leap`, `crowd`, `meaning`, `42`, `matrix`, `neo`, `morpheus`, `eb`, `mrrobot`, `2xeb`

### CRT Visual Effects

- Scanlines overlay
- Screen vignette
- Flicker animation
- Noise texture
- Glitch text effect
- Turn-on animation
- Cursor blink with glow

### Philosophy Themes

The terminal explores themes of:
- **Creation over consumption** - "The world has enough consumers. Be a creator."
- **Authenticity** - "The deepest emptiness comes from living as someone you're not."
- **Action over planning** - "You can't think your way into becoming. You have to act."
- **Independent thinking** - "Consensus is not truth. Step outside it."
