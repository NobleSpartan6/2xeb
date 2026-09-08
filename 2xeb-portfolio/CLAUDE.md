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
- **The Log is the exception**: posts live in Supabase (`posts` table) and are fetched at runtime, so pieces can be written, published, and deleted from a phone with no deploy. See "The Log" below.

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server on port 3000
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build
npm run typecheck # tsc --noEmit for app + worker (runs in CI; build must stay type-clean)
npm run deploy   # build + wrangler deploy (Cloudflare account pinned in wrangler.jsonc)
npm run lint     # ESLint
npm run format   # Prettier --write
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
├── index.html              # Entry HTML (fonts, root div)
├── tailwind.config.js      # Tailwind theme (screens, fonts, colors)
├── postcss.config.js       # PostCSS (tailwindcss + autoprefixer)
├── vite.config.ts          # Vite config (alias @/ -> src/)
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
│
├── /public
│   └── _headers            # Security headers (SPA routing handled by wrangler.jsonc)
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
│   │   ├── Log.tsx             # The Log: short writing (Supabase posts, runtime fetch)
│   │   ├── LogPost.tsx         # One piece (markdown → HTML, share row, prev/next)
│   │   ├── /desk               # The Desk: phone-first composer for the Log (see CLAUDE.md there)
│   │   └── /admin              # Legacy CMS pages (not routed)
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
│   │   ├── ImmersiveScene.tsx      # Full-screen 3D (3 pillars, Home)
│   │   └── ContactScene.tsx        # Interactive grid (Contact)
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
│   │   ├── supabase.ts         # Supabase client (legacy admin only)
│   │   ├── supabaseRest.ts     # Plain-fetch REST + RPC helper (public pages, Log, Desk)
│   │   ├── session.ts          # Desk session: password sign-in, lazy refresh, admin check
│   │   ├── log.ts              # posts data layer + derived text helpers
│   │   ├── markdown.ts         # marked + DOMPurify (log/desk chunks only)
│   │   └── database.types.ts   # Generated types
│   │
│   └── /hooks
│       ├── useProjects.ts
│       ├── useExperience.ts
│       ├── usePosts.ts         # Log reads (sessionStorage-backed index)
│       ├── useSession.ts       # Desk session as React state
│       └── useAutosave.ts      # Debounced single-flight autosave with retry
│
├── /worker                 # Cloudflare Worker: /log/* share previews + RSS (see CLAUDE.md there)
│
└── /supabase               # Edge Functions + sql/ (posts schema)
    ├── CLAUDE.md
    └── /functions
        ├── ask-portfolio/       # AI (Groq, Cerebras 429 fallback, SSE streaming)
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
- Context re-provided inside Canvas: see `ImmersiveScene.tsx`

### AI Integration Flow
1. SPA builds context from `buildProjectContext()` combining `PROJECTS` + `SITE_INDEX`
2. Sends `{ question, context, model, stream }` to Supabase Edge Function (`/ask-portfolio`)
3. Streaming (Groq): plain-text SSE chunks → final metadata event `{ done: true, projectSlugs, model, provider }`
4. Non-stream (Groq): JSON response `{ answer, projectSlugs, model, provider }`
5. `projectSlugs` update `ConsoleContext.highlightedNodeIds` so 3D nodes glow; navigation answers can include markdown links

### Chat Widget Features
- **Streaming**: Plain-text SSE tokens via Groq (no JSON flashing)
- **Copy**: Clipboard copy for AI messages
- **Regenerate**: Re-send last user message
- **Clear**: Reset chat history
- **Markdown**: Lightweight renderer (code, bold, lists) - no external deps
- **Model Selector**: Switch between GPT-OSS 20B, Qwen 3.6 27B, GPT-OSS 120B (default) (all Groq; keep `src/lib/models.ts` and the Edge Function whitelist in sync)
- **Rate-limit Fallback**: if Groq returns 429, the Edge Function retries once on Cerebras `gpt-oss-120b` (needs `CEREBRAS_API_KEY` secret); streaming keeps working and the response reports `provider: 'cerebras'`

### Animations (anime.js)
- All entrance/scroll animations use [anime.js v4](https://animejs.com/) (`animate`, `createTimeline`, `stagger`, `utils`)
- Shared hook: `useScrollReveal` in `src/hooks/useAnimations.ts` — staggered rise+fade of `[data-animate]` descendants via IntersectionObserver; re-plays when `deps` change (e.g. Work grid filters)
- Bespoke timelines: Home hero (letter-by-letter), Contact form + SENT success, NavBar mount + mobile drawer
- Extra hooks: `useTextScramble` (terminal-style decode on mono labels), `useMagnetic` (cursor-pull CTAs, desktop only)
- All animation code must respect `prefers-reduced-motion` (use `prefersReducedMotion()` guard — skip animating, leave content visible)
- Animate `transform`/`opacity` only; avoid targets with Tailwind `transition-all` (inline styles fight CSS transitions), or clear inline styles `onComplete`

### Motion System (CSS transitions)
Standards live in `.claude/skills/` (emil-design-eng, review-animations). Rules:
- Never `transition-all` — list explicit properties (`transition-colors`, `transition-[opacity,transform]`)
- Strong easing tokens (defined in `src/index.css`, exposed via Tailwind): `ease-out-strong`, `ease-in-out-strong`, `ease-drawer` (iOS-style, for drawers/sheets)
- Pressable elements (buttons, link-buttons) get the `.pressable` class: scale(0.97) on `:active` + owns its full transition list — don't combine with `transition-*` utilities, and never put it on an anime.js target (inline transforms fight CSS transitions)
- Hover/color transitions: 150-200ms; UI movement: ≤300ms; drawers/modals: 300-500ms
- `hoverOnlyWhenSupported` is on — `hover:` variants don't fire on touch devices

### The Log (short writing) and the Desk
- Public: `/log` (index of openings) and `/log/:slug` (one piece). Data via `usePosts` → `lib/log.ts` → plain fetch. Unlisted pieces come from the `get_post` RPC and never appear in lists.
- Writing: `/desk` (`src/pages/desk/`). Needs a desk session (`lib/session.ts`): password sign-in, admin_users check, lazy token refresh, no supabase-js. Enter via the `/desk` form or the terminal easter egg (`login`, then `desk`; `log ls|new|edit|pub|hide|draft|rm`).
- Drafts autosave (`useAutosave`); public pieces save on explicit Save; visibility changes save everything. Title/body mirror to localStorage until saved.
- Markdown: `lib/markdown.ts` (marked with `breaks: true` + DOMPurify), styled by `.prose-log` in `index.css`; the reading face is self-hosted Newsreader (`font-serif`). Keep marked/DOMPurify/session out of the main bundle (log/desk routes are `React.lazy`).
- Share previews: `worker/index.ts` rewrites `<head>` meta for `/log/*` at the edge and serves `/log/feed.xml`. Deploy with `npm run deploy`.
- Schema: `supabase/sql/2026-09-08_posts.sql`.

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
- **Code-splitting**: 3D scenes (`ImmersiveScene`, `ContactScene`), `MrRobotTerminal`, `NotFound`, and `CaseStudyExplorer` are `React.lazy` — keep heavy deps (three, R3F, shaders) out of the main bundle

### Styling
- Tailwind compiled at build time (PostCSS): config in `tailwind.config.js`, entry CSS in `src/index.css` (imported by `main.tsx`)
- Do NOT reintroduce the Tailwind CDN script; do NOT construct class names dynamically (JIT scans literal strings only)
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
- `ask-portfolio`: Multi-model AI (Groq primary, Cerebras 429 fallback), SSE streaming support
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
- **SPA routing**: handled by `wrangler.jsonc` (`assets.not_found_handling: "single-page-application"`)

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
