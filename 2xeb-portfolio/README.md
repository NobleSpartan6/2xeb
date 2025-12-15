# 2xeb Portfolio

A 3D, AI-assisted portfolio showcasing Software Engineering, ML/AI, and Video production work.

**Stack:** React + Vite SPA · Supabase (auth, functions, contact) · Cloudflare Pages · R3F (Three.js)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Create `.env.local` in the project root:

```bash
# Supabase
VITE_SUPABASE_URL=https://zrawfgpjfkohjaqcfgrd.supabase.co
VITE_SUPABASE_FUNCTIONS_URL=https://zrawfgpjfkohjaqcfgrd.supabase.co/functions/v1
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYXdmZ3BqZmtvaGphcWNmZ3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDE4ODYsImV4cCI6MjA4MDQxNzg4Nn0.D9PYBklsgjVjt7g7b7OfJuOGSOZu8tboXZRgBTMrj9g

# For local development with Supabase CLI (optional)
# VITE_SUPABASE_FUNCTIONS_URL=http://localhost:54321/functions/v1
```

> **Note**: The anon key is safe to expose in client-side code. LLM API keys (GROQ_API_KEY, GEMINI_API_KEY) are stored securely in Supabase Edge Functions.

---

## Architecture Overview

### Static Content + Supabase Backend

- **Portfolio content** (projects, timeline, media) = **static TypeScript files** in `/src/data/`
- **Supabase** = auth, contact form, AI Edge Functions, admin CMS
- **Admin CMS** = optional database-backed content management (can deploy without it)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Bundler | Vite |
| Frontend | React 19 + TypeScript |
| Routing | React Router v7 (HashRouter) |
| 3D | Three.js + React Three Fiber + Drei |
| AI | Groq (Llama) + Gemini via Edge Functions |
| Styling | Tailwind CDN (inline utility classes) |
| State | React Context (`ConsoleContext`, `AuthContext`) |
| Auth | Supabase Auth (magic link + password) |

---

## Project Structure

```
/2xeb-portfolio
├── index.html          # Entry HTML
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies
├── .env.local          # Environment variables (gitignored)
│
├── /public
│   ├── _redirects      # Cloudflare SPA routing
│   └── _headers        # Security headers
│
├── /src
│   ├── main.tsx        # React entry point
│   ├── App.tsx         # Router + AuthProvider + layout
│   │
│   ├── /pages
│   │   ├── Home.tsx            # 3D landing (live clock, Spotify)
│   │   ├── Work.tsx            # Project grid
│   │   ├── ProjectDetail.tsx   # Individual project
│   │   ├── MLLab.tsx           # ML projects + AI assistant
│   │   ├── Video.tsx           # Video showreel
│   │   ├── About.tsx           # Bio + timeline
│   │   ├── Contact.tsx         # Contact form
│   │   └── /admin              # Admin CMS pages (protected)
│   │       ├── AdminLogin.tsx
│   │       ├── AuthCallback.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── ProjectsEditor.tsx
│   │       ├── ExperienceEditor.tsx
│   │       ├── CaseStudiesEditor.tsx
│   │       ├── PagesEditor.tsx
│   │       ├── AuditLogViewer.tsx
│   │       ├── PublishContent.tsx
│   │       └── ResetPassword.tsx
│   │
│   ├── /components
│   │   ├── NavBar.tsx
│   │   ├── FooterHUD.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── AskPortfolioWidget.tsx  # AI chat with streaming
│   │   └── /admin                   # Admin UI components
│   │       ├── AdminLayout.tsx
│   │       ├── ProtectedRoute.tsx
│   │       └── DataTable.tsx
│   │
│   ├── /3d                 # React Three Fiber scenes
│   │   ├── ImmersiveScene.tsx       # Full-screen 3D (3 pillars)
│   │   ├── SystemConsoleScene.tsx   # Project browser
│   │   ├── OrbitScene.tsx           # Background animation
│   │   └── CLAUDE.md
│   │
│   ├── /context
│   │   ├── ConsoleContext.tsx  # 3D state + chat history
│   │   ├── AuthContext.tsx     # Supabase auth + admin check
│   │   └── CLAUDE.md
│   │
│   ├── /data               # Static content
│   │   ├── index.ts
│   │   ├── projects.ts
│   │   ├── timeline.ts
│   │   ├── caseStudies.ts
│   │   ├── siteIndex.ts
│   │   └── graph.ts
│   │
│   ├── /lib
│   │   ├── types.ts
│   │   ├── api.ts              # Edge Function helpers
│   │   ├── models.ts           # LLM model config + rate limiting
│   │   ├── supabase.ts         # Supabase client
│   │   ├── database.types.ts   # Generated types
│   │   └── CLAUDE.md
│   │
│   └── /hooks
│       ├── useProjects.ts      # Database-backed projects
│       └── useExperience.ts    # Database-backed experience
│
├── /supabase               # Edge Functions
│   ├── CLAUDE.md
│   └── /functions
│       ├── ask-portfolio/       # AI assistant (multi-model, streaming)
│       ├── submit-contact/      # Contact form + email
│       └── spotify-now-playing/ # Live Spotify status
│
└── /dist                   # Build output (gitignored)
```

---

## Development Checklist

### Phase 1: MVP Refactor ✅
- [x] Restructure to `/src` directory
- [x] Create static data layer (`/src/data/`)
- [x] Update all imports to new paths

### Phase 2: Supabase Integration ✅
- [x] Create Supabase project (`portfolio` - zrawfgpjfkohjaqcfgrd)
- [x] Create `contact_messages` table with RLS
- [x] Implement `submit-contact` Edge Function with email notifications
- [x] Implement `ask-portfolio` Edge Function (multi-model + streaming)
- [x] Implement `spotify-now-playing` Edge Function
- [x] Wire up AskPortfolioWidget with SSE streaming
- [x] Wire up Contact form to Edge Function

### Phase 3: Features ✅
- [x] Performance optimization (bundle reduced from 1.56MB to 1.17MB)
- [x] New immersive 3D visualization with three discipline pillars
- [x] SSE streaming for AI responses (Groq)
- [x] Multi-model support (Llama 3.1 8B, Llama 3.3 70B, Gemini 2.0 Flash)
- [x] Client-side rate limiting
- [x] Live Spotify now-playing integration
- [x] Live clock (EST timezone)
- [x] Admin CMS system (optional, database-backed)
- [x] Magic link + password authentication

### Phase 4: Deployment ⬜
- [x] Add `_redirects` file for SPA routing
- [x] Add `_headers` file for security headers
- [x] Deploy Supabase Edge Functions
- [ ] Configure Cloudflare Pages (see Deployment Guide below)
- [ ] Set environment variables in Cloudflare
- [ ] Configure custom domain

### Required Supabase Secrets

Set these in Supabase Dashboard > Project Settings > Edge Functions:

| Secret | Description |
|--------|-------------|
| `GROQ_API_KEY` | Groq API key (primary AI provider) |
| `GEMINI_API_KEY` | Google Gemini API key (fallback) |
| `RESEND_API_KEY` | Resend API key for email notifications |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret |
| `SPOTIFY_REFRESH_TOKEN` | OAuth refresh token for Spotify |

---

## Performance Optimizations

### Bundle Size Reduction

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Bundle size | 1.56 MB | 1.17 MB | -25% |
| Gzipped | ~430 KB | ~334 KB | -22% |

### State Management Optimizations

**Problem:** `highlightedNodeIds` used `Array.includes()` which is O(n) - called on every node in useFrame loop.

**Solution:** Changed to `Set<string>` with O(1) `.has()` lookup:

```typescript
// Before (O(n) per lookup)
const isHighlighted = highlightedNodeIds.includes(node.id);

// After (O(1) per lookup)
const isHighlighted = isNodeHighlighted(node.id); // Uses Set.has()
```

### 3D Rendering Optimizations

**Pre-computed Geometry:**
```typescript
// Before: Allocating in every render
const points = [
  new THREE.Vector3(x1, y1, z1),  // GC pressure
  new THREE.Vector3(x2, y2, z2),
];

// After: Pre-computed once
const connectionPoints = useMemo(() =>
  edges.map(edge => ({
    points: [new THREE.Vector3(...), ...]
  }))
, []);
```

**Reusable Objects:**
```typescript
// Module-level singletons (no GC in render loop)
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _vec3 = new THREE.Vector3();
```

### Responsive 3D Grid

| Device | Grid Size | Total Cells | DPR | Antialiasing |
|--------|-----------|-------------|-----|--------------|
| Desktop | 40×40 | 1,600 | 1.5 | Enabled |
| Mobile | 24×24 | 576 | 1.0 | Disabled |

```typescript
const getGridConfig = (isMobile: boolean) => ({
  gridSize: isMobile ? 24 : 40,
  cellSize: isMobile ? 0.6 : 0.5,
  gap: 0.08,
});
```

---

## Documentation Files (CLAUDE.md)

This project uses `CLAUDE.md` files for AI-assisted development documentation:

| File | Purpose |
|------|---------|
| `/CLAUDE.md` | Root project documentation, architecture, constraints |
| `/src/3d/CLAUDE.md` | 3D scene patterns, performance guidelines, pillar behaviors |
| `/src/context/CLAUDE.md` | React Context documentation, chat state sync |
| `/src/lib/CLAUDE.md` | API helpers, model config, rate limiting |
| `/src/pages/admin/CLAUDE.md` | Admin CMS system architecture |
| `/supabase/CLAUDE.md` | Edge Functions, database schema, secrets |

### When to Add CLAUDE.md

Add a `CLAUDE.md` file when creating new directories that contain:
- Complex patterns or constraints
- Multiple related files
- Integration requirements
- Performance-critical code

---

## 3D Visualization: Three Pillars

The home page features an immersive 3D visualization with three discipline "pillars":

| Pillar | Discipline | Color | Movement Pattern |
|--------|------------|-------|------------------|
| **SWE** | CODE | Cyan `#06B6D4` | Grid-snapped cross (architectural precision) |
| **ML** | VISION | Lime `#84CC16` | Lissajous curves (organic, neural-like) |
| **VIDEO** | DESIGN | Amber `#F59E0B` | Linear sweep (timeline, scanning) |

**Interaction:**
- Mouse hover creates Swiss Blue (`#2563EB`) accent highlight
- Hovering discipline text filters which pillar is active
- Camera follows mouse with subtle parallax

---

## Routes

### Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | 3D interactive landing (clock, Spotify) |
| `/work` | `Work` | Project grid with filters |
| `/work/:slug` | `ProjectDetail` | Individual project |
| `/ml-lab` | `MLLab` | ML projects + AI assistant |
| `/video` | `Video` | Video showreel + projects |
| `/about` | `About` | Bio + experience timeline |
| `/contact` | `Contact` | Contact form |

### Admin Routes (Protected)

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/login` | `AdminLogin` | Login with email/password |
| `/admin` | `AdminDashboard` | Content overview + quick actions |
| `/admin/projects` | `ProjectsEditor` | CRUD for projects |
| `/admin/experience` | `ExperienceEditor` | CRUD for timeline |
| `/admin/case-studies` | `CaseStudiesEditor` | CRUD for case studies |
| `/admin/pages` | `PagesEditor` | Edit static page content |
| `/admin/audit` | `AuditLogViewer` | View all content changes |
| `/admin/publish` | `PublishContent` | Publish drafted content |

> **Note**: Admin routes require authentication. Users must exist in both Supabase Auth and the `admin_users` table.

---

## Key Files

### Static Content

**`/src/data/projects.ts`** - All project definitions
```typescript
import { PROJECTS, buildProjectContext } from '../data';
```

**`/src/data/timeline.ts`** - Experience/timeline data
```typescript
import { EXPERIENCE } from '../data';
```

**`/src/data/graph.ts`** - Graph generation + COLORS
```typescript
import { GRAPH_DATA, COLORS } from '../data';
```

### 3D Development Guidelines

```typescript
// ✅ DO: Reuse objects outside component
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

// ✅ DO: Use Set for lookups in hot paths
const isHighlighted = highlightedNodeIds.has(id);  // O(1)

// ✅ DO: Pre-compute static data
const gridData = useMemo(() => [...], [deps]);

// ❌ DON'T: Allocate in useFrame
useFrame(() => {
  const vec = new THREE.Vector3();  // GC pressure!
});

// ❌ DON'T: Use Array.includes in hot paths
highlightedNodeIds.includes(id);  // O(n)
```

**Key Constraints:**
- **Single Canvas**: One `<Canvas>` per scene component
- **No router hooks inside Canvas**: Pass callbacks via props
- **Context bridging**: Re-provide ConsoleContext inside Canvas
- **Import pattern**: `import * as THREE from 'three'` (npm only)

---

## Supabase Schema (Deployed)

### contact_messages
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

-- RLS: INSERT only for public
alter table contact_messages enable row level security;
create policy "Allow anonymous insert"
  on contact_messages for insert to public
  with check (true);
```

---

## Deployment Guide (Cloudflare Pages)

### Step 1: Connect Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click "Create a project" → "Connect to Git"
3. Select your GitHub repository
4. Configure build settings:
   - **Build command**: `npm install && npm run build`
   - **Output directory**: `dist`
   - **Node version**: 18 (or later)

### Step 2: Environment Variables

Add these in Cloudflare Pages → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://zrawfgpjfkohjaqcfgrd.supabase.co` |
| `VITE_SUPABASE_FUNCTIONS_URL` | `https://zrawfgpjfkohjaqcfgrd.supabase.co/functions/v1` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

### Step 3: Custom Domain (Optional)

1. Go to Pages project → Custom domains
2. Add your domain (e.g., `2xeb.com`)
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

### Step 4: Verify Deployment

After deployment:
- [ ] Check all routes load correctly
- [ ] Test contact form submission
- [ ] Test AI chat widget
- [ ] Verify Spotify now-playing (if configured)
- [ ] Test admin login at `/admin/login`

### SPA Routing

The `public/_redirects` file handles client-side routing:
```
/*    /index.html   200
```

### Security Headers

The `public/_headers` file adds security headers:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

---

## AI Chat Features

### Multi-Model Support

| Model | Provider | Best For | Daily Limit |
|-------|----------|----------|-------------|
| Llama 3.1 8B | Groq | Fast Q&A (default) | 14,400 |
| Llama 3.3 70B | Groq | Complex reasoning | 1,000 |
| Gemini 2.0 Flash | Google | Multimodal | 1,500 |

### SSE Streaming

The AI widget uses Server-Sent Events for real-time streaming:

```typescript
// Client receives chunks like:
data: {"chunk": "Hello"}
data: {"chunk": " there!"}
data: {"done": true, "projectSlugs": ["project-1"], "model": "llama-3.1-8b-instant"}
```

### Rate Limiting

Client-side rate limiting protects against abuse:
- 2 second cooldown between requests
- 80% of per-minute limits enforced
- 90% of daily limits enforced
- Stored in localStorage, resets daily

---

## Contributing

1. Follow the existing code patterns
2. Test changes with `npm run build` before committing
3. Update relevant CLAUDE.md files when adding new directories
4. Update this README if adding new features

---

## Links

- **Live Site**: (coming soon)
- **Supabase Project**: `zrawfgpjfkohjaqcfgrd`
