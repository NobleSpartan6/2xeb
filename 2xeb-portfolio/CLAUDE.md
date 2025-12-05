# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Subdirectory Documentation

When creating new directories (e.g., `/supabase`, new feature folders), add a `CLAUDE.md` file in each subdirectory to document its specific purpose, patterns, and constraints.

## Project Overview

A 3D, AI-assisted portfolio SPA for 2xeb (Ebenezer Eshetu) showcasing Software Engineering, ML/AI, and Video production work. Built with React + Vite, React Three Fiber for 3D visualization, and AI assistant (currently Gemini, migrating to Edge Functions).

## Philosophy & Constraints

**Non-negotiables:**
- No Next.js, no SSR/RSC — pure client-side SPA
- Reuse MVP styling (same colors, typography, layout, 3D vibe)
- Production-ready: static content for portfolio, minimal Supabase backend (contact + AI function), LLM keys server-side only

**Architecture Decision: Hybrid Option B (Static Content + Minimal Supabase)**
- Portfolio content (projects, timeline, media metadata) lives as **static TypeScript files** in `/src/data/`
- Supabase used **only** for: contact form submissions + AI Edge Function
- No database queries for portfolio content — simpler, faster, version-controlled

## Development Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server on port 3000
npm run build   # Build for production (outputs to dist/)
npm run preview # Preview production build
```

### Supabase Functions (Future)
```bash
supabase functions serve ask-portfolio      # Run AI function locally
supabase functions serve submit-contact     # Run contact function locally
supabase functions deploy ask-portfolio     # Deploy AI function
supabase functions deploy submit-contact    # Deploy contact function
```

## Environment Setup

Create `.env.local` with:
```
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_FUNCTIONS_URL=http://localhost:54321/functions/v1
```

## Project Structure

```
/2xeb-portfolio
├── index.html              # Entry HTML (Tailwind CDN, fonts)
├── vite.config.ts          # Vite config (alias @/ -> src/)
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies (npm, not CDN)
│
├── /src
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Router + ConsoleProvider wrapper
│   │
│   ├── /pages              # Route components
│   │   ├── Home.tsx        # 3D landing with SystemConsoleScene
│   │   ├── Work.tsx        # Project grid
│   │   ├── ProjectDetail.tsx
│   │   ├── MLLab.tsx       # ML projects + AskPortfolioWidget
│   │   ├── Video.tsx
│   │   ├── About.tsx
│   │   └── Contact.tsx
│   │
│   ├── /components         # Reusable UI
│   │   ├── NavBar.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── DisciplineChip.tsx
│   │   ├── AskPortfolioWidget.tsx
│   │   └── SystemAgent.tsx
│   │
│   ├── /3d                 # React Three Fiber scenes
│   │   ├── SystemConsoleScene.tsx  # Interactive project nodes
│   │   └── OrbitScene.tsx          # Animated grid floor
│   │
│   ├── /context
│   │   └── ConsoleContext.tsx      # Shared 3D state
│   │
│   ├── /data               # STATIC CONTENT (version-controlled)
│   │   ├── index.ts        # Re-exports all data
│   │   ├── projects.ts     # PROJECTS array + buildProjectContext()
│   │   ├── timeline.ts     # EXPERIENCE array
│   │   └── graph.ts        # GRAPH_DATA, COLORS, generateGraph()
│   │
│   ├── /lib                # Utilities
│   │   ├── types.ts        # TypeScript interfaces
│   │   ├── api.ts          # Edge Function helpers (future)
│   │   └── geminiService.ts # Current AI service (client-side)
│   │
│   └── /styles             # CSS (if needed)
│
└── /supabase               # (future) Edge Functions
    └── /functions
```

## Key Patterns

### Static Data Imports
```typescript
// Always import from /src/data (barrel export)
import { PROJECTS, EXPERIENCE, COLORS, GRAPH_DATA } from '../data';
import { Discipline, ConsoleLane, Project } from '../lib/types';
```

### 3D Scene Architecture
- `ConsoleContext` manages: `hoveredNodeId`, `focusedDiscipline`, `highlightedNodeIds`, `isAgentOpen`
- Navigation callbacks passed as props (never use router hooks inside Canvas)
- Context re-provided inside Canvas: see `SystemConsoleScene.tsx:7`

### AI Integration Flow
1. SPA builds context string from `/src/data/projects.ts` using `buildProjectContext()`
2. Sends `{ question, context }` to Edge Function (or current Gemini service)
3. Returns `{ answer, relatedSlugs }`
4. `relatedSlugs` written to `ConsoleContext.highlightedNodeIds` → 3D nodes glow

## Important Constraints

### 3D / React Three Fiber
- **Single Canvas**: One `<Canvas>` per scene component
- **Three.js imports**: Always `import * as THREE from 'three'` (npm, not CDN)
- **Router hooks**: Never inside R3F tree — pass callbacks via props
- **Performance**: Reuse `THREE.Vector3`, `THREE.Color` in `useFrame` (no allocations)
- **Instanced meshes**: Use for repeated geometry

### Styling
- Currently using Tailwind CDN in index.html
- Keep MVP styling as-is (do not redesign)

### Discipline/Lane Mapping

| Discipline | ConsoleLane | Color |
|------------|-------------|-------|
| VIDEO | DESIGN | #F59E0B |
| SWE | CODE | #06B6D4 |
| ML | VISION | #84CC16 |
| HYBRID | VISION | varies |

## Supabase Integration (Planned)

### contact_messages Table
```sql
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  message text not null,
  reason text,
  source_page text,
  created_at timestamptz default now()
);
```

### RLS Policy
```sql
-- INSERT only, no SELECT for anon
create policy "Allow anonymous insert"
on contact_messages for insert to public with check (true);
```

### Edge Functions
- `ask-portfolio`: Input `{ question, context }`, calls LLM, returns `{ answer, relatedSlugs }`
- `submit-contact`: Inserts into `contact_messages`

### SPA Integration
```typescript
// /src/lib/api.ts
const FUNCTIONS_BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export async function askPortfolio(question: string, context: string) {
  const res = await fetch(`${FUNCTIONS_BASE_URL}/ask-portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  });
  return res.json();
}
```

## Deployment (Cloudflare Pages)

- **Build command**: `npm install && npm run build`
- **Output directory**: `dist`
- **Environment variables**: `VITE_SUPABASE_FUNCTIONS_URL`
- **SPA routing**: Add `public/_redirects` with `/*   /index.html   200`

## Development Checklist

See `README.md` for the full checklist with phases:
1. ✅ MVP Refactor (CDN removal, /src structure)
2. ⬜ Supabase Integration
3. ⬜ Deployment
4. ⬜ Polish
