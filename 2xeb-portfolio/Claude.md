# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Subdirectory Documentation

When creating new directories (e.g., `/supabase`, new feature folders), add a `CLAUDE.md` file in each subdirectory to document its specific purpose, patterns, and constraints.

## Project Overview

A 3D, AI-assisted portfolio SPA for 2xeb (Ebenezer Eshetu) showcasing Software Engineering, ML/AI, and Video production work. Built with React + Vite, React Three Fiber for 3D visualization, and multi-model AI assistant with SSE streaming.

## Philosophy & Constraints

**Non-negotiables:**
- No Next.js, no SSR/RSC — pure client-side SPA
- Reuse MVP styling (same colors, typography, layout, 3D vibe)
- Production-ready: static content for portfolio, minimal Supabase backend (contact + AI function), LLM keys server-side only

**Architecture Decision: Static Content + Supabase Backend**
- Portfolio content (projects, timeline, media metadata) lives as **static TypeScript files** in `/src/data/`
- Supabase used for: contact form, AI Edge Functions, auth, optional admin CMS
- Admin CMS available but optional — can deploy without database content

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
VITE_SUPABASE_URL=https://zrawfgpjfkohjaqcfgrd.supabase.co
VITE_SUPABASE_FUNCTIONS_URL=https://zrawfgpjfkohjaqcfgrd.supabase.co/functions/v1
VITE_SUPABASE_ANON_KEY=your_anon_key

# For local development with Supabase CLI
# VITE_SUPABASE_FUNCTIONS_URL=http://localhost:54321/functions/v1
```

## Project Structure

```
/2xeb-portfolio
├── index.html              # Entry HTML (Tailwind CDN, fonts)
├── vite.config.ts          # Vite config (alias @/ -> src/)
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
│
├── /public
│   ├── _redirects          # Cloudflare SPA routing
│   └── _headers            # Security headers
│
├── /src
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Router + AuthProvider + ConsoleProvider
│   │
│   ├── /pages
│   │   ├── Home.tsx            # 3D landing (live clock, Spotify)
│   │   ├── Work.tsx            # Project grid
│   │   ├── ProjectDetail.tsx
│   │   ├── MLLab.tsx           # ML projects + AI chat
│   │   ├── Video.tsx
│   │   ├── About.tsx
│   │   ├── Contact.tsx
│   │   └── /admin              # Protected CMS pages
│   │       ├── AdminLogin.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── ProjectsEditor.tsx
│   │       ├── ExperienceEditor.tsx
│   │       └── ...
│   │
│   ├── /components
│   │   ├── NavBar.tsx
│   │   ├── FooterHUD.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── AskPortfolioWidget.tsx  # Chat with streaming
│   │   ├── CaseStudyExplorer.tsx
│   │   └── /admin                   # Admin UI components
│   │       ├── AdminLayout.tsx
│   │       ├── ProtectedRoute.tsx
│   │       └── DataTable.tsx
│   │
│   ├── /3d                 # React Three Fiber scenes
│   │   ├── ImmersiveScene.tsx      # Full-screen 3D (3 pillars)
│   │   ├── SystemConsoleScene.tsx  # Interactive project nodes
│   │   └── OrbitScene.tsx
│   │
│   ├── /context
│   │   ├── ConsoleContext.tsx      # 3D state + chat history
│   │   └── AuthContext.tsx         # Supabase auth + admin check
│   │
│   ├── /data               # Static content
│   │   ├── index.ts
│   │   ├── projects.ts
│   │   ├── timeline.ts
│   │   ├── graph.ts
│   │   ├── caseStudies.ts
│   │   └── siteIndex.ts
│   │
│   ├── /lib
│   │   ├── types.ts
│   │   ├── api.ts              # Edge Function helpers
│   │   ├── models.ts           # LLM model config + rate limiting
│   │   ├── supabase.ts         # Supabase client
│   │   └── database.types.ts   # Generated types
│   │
│   └── /hooks
│       ├── useProjects.ts
│       └── useExperience.ts
│
└── /supabase               # Edge Functions
    ├── CLAUDE.md
    └── /functions
        ├── ask-portfolio/       # AI (Groq/Gemini, SSE streaming)
        ├── submit-contact/      # Contact form + email
        └── spotify-now-playing/ # Real-time Spotify status
```

## Key Patterns

### Static Data Imports
```typescript
// Always import from /src/data (barrel export)
import { PROJECTS, EXPERIENCE, COLORS, GRAPH_DATA, SITE_INDEX } from '../data';
import { Discipline, ConsoleLane, Project } from '../lib/types';
```

### Site Navigation Index
- `src/data/siteIndex.ts` lists all routes (path, title, description, keywords)
- Included in `buildProjectContext()` so the assistant can surface navigation links (e.g., [Contact](/contact), [Case Study](/work/portfolio-console))

### 3D Scene Architecture
- `ConsoleContext` manages: `hoveredNodeId`, `focusedDiscipline`, `highlightedNodeIds`, `isAgentOpen`
- Navigation callbacks passed as props (never use router hooks inside Canvas)
- Context re-provided inside Canvas: see `SystemConsoleScene.tsx:7`

### AI Integration Flow
1. SPA builds context from `buildProjectContext()` combining `PROJECTS` + `SITE_INDEX`
2. Sends `{ question, context, model, stream }` to Supabase Edge Function (`/ask-portfolio`)
3. Streaming (Groq): plain-text SSE chunks → final metadata event `{ done: true, projectSlugs, model, provider }`
4. Non-stream (Groq/Gemini): JSON response `{ answer, projectSlugs, model, provider }`
5. `projectSlugs` update `ConsoleContext.highlightedNodeIds` so 3D nodes glow; navigation answers can include markdown links

### Chat Widget Features
- **Streaming**: Plain-text SSE tokens via Groq (no JSON flashing)
- **Copy**: Clipboard copy for AI messages
- **Regenerate**: Re-send last user message
- **Clear**: Reset chat history
- **Markdown**: Lightweight renderer (code, bold, lists) - no external deps
- **Model Selector**: Switch between Llama 3.1 8B, Llama 3.3 70B, Gemini 2.0 Flash

### Case Study Explorer
- Lazy-loaded component (`React.lazy`) for Portfolio Console project
- Accordion sections: Problem, Solution, Timeline, Code Snippets, Architecture, Results
- Access via "Explore Case Study" button on `/work/portfolio-console`

## Important Constraints

### 3D / React Three Fiber
- **Single Canvas**: One `<Canvas>` per scene component
- **Three.js imports**: Always `import * as THREE from 'three'` (npm, not CDN)
- **Router hooks**: Never inside R3F tree — pass callbacks via props
- **Context bridging**: Re-provide ConsoleContext inside Canvas
- **Instanced meshes**: Use for repeated geometry (single draw call)

### Performance Patterns
- **Set for lookups**: Use `highlightedNodeIds.has(id)` not `array.includes(id)`
- **Reuse objects**: Pre-allocate `THREE.Object3D`, `THREE.Color` outside useFrame
- **Pre-compute geometry**: Calculate static positions in `useMemo`
- **Mobile optimization**: Reduce grid size, disable antialiasing, lower DPR

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

## Supabase Integration (Deployed)

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
- `ask-portfolio`: Multi-model AI (Groq/Gemini), SSE streaming support
  - Input: `{ question, context, model?, provider?, stream? }`
  - Output: `{ answer, projectSlugs, model, provider }` or SSE stream
- `submit-contact`: Inserts into `contact_messages`, sends email via Resend
- `spotify-now-playing`: Returns current Spotify track using OAuth refresh token
  - Output: `{ isPlaying, track?, artist?, album?, albumArt? }`

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
2. ✅ Supabase Integration (Edge Functions, auth, admin CMS)
3. ✅ Features (3D visualization, streaming AI, Spotify, rate limiting)
4. ⬜ Deployment (Cloudflare Pages - see README for guide)

## Admin CMS Security

The admin dashboard at `/admin` is secure:
- Requires Supabase Auth (magic link or password)
- User ID must exist in `admin_users` table
- `shouldCreateUser: false` prevents unauthorized signups
- Non-admin users are signed out immediately
- All changes logged in `audit_log` table (if configured)
