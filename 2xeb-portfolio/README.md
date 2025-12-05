# 2xeb Portfolio

A 3D, AI-assisted portfolio showcasing Software Engineering, ML/AI, and Video production work.

**Stack:** React + Vite SPA · Static Content · Supabase (contact + functions) · Cloudflare Pages · R3F (Three.js)

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
# Supabase Edge Functions (production)
VITE_SUPABASE_FUNCTIONS_URL=https://zrawfgpjfkohjaqcfgrd.supabase.co/functions/v1
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYXdmZ3BqZmtvaGphcWNmZ3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDE4ODYsImV4cCI6MjA4MDQxNzg4Nn0.D9PYBklsgjVjt7g7b7OfJuOGSOZu8tboXZRgBTMrj9g

# For local development with Supabase CLI (optional)
# VITE_SUPABASE_FUNCTIONS_URL=http://localhost:54321/functions/v1
```

> **Note**: The anon key is safe to expose in client-side code. The GEMINI_API_KEY is now stored securely in Supabase Edge Functions (not in client code).

---

## Architecture Overview

### Hybrid Option B: Static Content + Minimal Supabase

- **Portfolio content** (projects, timeline, media) = **static TypeScript files** in `/src/data/`
- **Supabase** = only for contact form + AI Edge Function (LLM keys server-side)
- **No database queries for content** — version-controlled, fast, simple

### Tech Stack

| Layer | Technology |
|-------|------------|
| Bundler | Vite |
| Frontend | React 19 + TypeScript |
| Routing | React Router v7 (HashRouter) |
| 3D | Three.js + React Three Fiber + Drei |
| AI | Gemini API → (migrating to Supabase Edge Function) |
| Styling | Tailwind CDN (inline utility classes) |
| State | React Context (`ConsoleContext`) |

---

## Project Structure

```
/2xeb-portfolio
├── index.html          # Entry HTML (no CDN import maps)
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies
├── .env.local          # Environment variables (gitignored)
│
├── /src
│   ├── main.tsx        # React entry point
│   ├── App.tsx         # Router + layout
│   │
│   ├── /pages          # Route pages
│   │   ├── Home.tsx
│   │   ├── Work.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── MLLab.tsx
│   │   ├── Video.tsx
│   │   ├── About.tsx
│   │   └── Contact.tsx
│   │
│   ├── /components     # Reusable UI components
│   │   ├── NavBar.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── DisciplineChip.tsx
│   │   ├── AskPortfolioWidget.tsx
│   │   └── SystemAgent.tsx
│   │
│   ├── /3d             # React Three Fiber scenes
│   │   ├── ImmersiveScene.tsx       # Full-screen home visualization
│   │   ├── SystemConsoleScene.tsx   # Project browser (isometric)
│   │   ├── OrbitScene.tsx           # Animated background
│   │   └── CLAUDE.md                # 3D-specific documentation
│   │
│   ├── /context        # React contexts
│   │   └── ConsoleContext.tsx
│   │
│   ├── /data           # Static content (version-controlled)
│   │   ├── index.ts    # Re-exports all data
│   │   ├── projects.ts # Project definitions
│   │   ├── timeline.ts # Experience/timeline
│   │   └── graph.ts    # Graph generation + colors
│   │
│   ├── /lib            # Utilities and API helpers
│   │   ├── types.ts    # TypeScript interfaces
│   │   ├── api.ts      # Edge Function helpers (future)
│   │   └── geminiService.ts  # Current AI service
│   │
│   └── /styles         # CSS files (if needed)
│
├── /supabase           # Supabase Edge Functions (deployed)
│   ├── CLAUDE.md       # Supabase-specific documentation
│   └── /functions
│       ├── ask-portfolio/   # AI assistant endpoint
│       └── submit-contact/  # Contact form endpoint
│
└── /dist               # Build output (gitignored)
```

---

## Development Checklist

### Phase 1: MVP Refactor ✅
- [x] Remove AI Studio CDN import maps
- [x] Restructure to `/src` directory
- [x] Create static data layer (`/src/data/`)
- [x] Update all imports to new paths
- [x] Verify Vite build works with npm dependencies

### Phase 2: Supabase Integration ✅
- [x] Create Supabase project (`portfolio` - zrawfgpjfkohjaqcfgrd)
- [x] Create `contact_messages` table with RLS
- [x] Implement `submit-contact` Edge Function
- [x] Implement `ask-portfolio` Edge Function
- [x] Create `/src/lib/api.ts` integration
- [x] Wire up `AskPortfolioWidget` to Edge Function
- [x] Wire up Contact form to Edge Function
- [x] **ACTION REQUIRED**: Set `GEMINI_API_KEY` secret in Supabase Dashboard

### Phase 3: Deployment ⬜
- [ ] Configure Cloudflare Pages
- [ ] Add `_redirects` file for SPA routing
- [ ] Set environment variables in Cloudflare (VITE_SUPABASE_FUNCTIONS_URL, VITE_SUPABASE_ANON_KEY)
- [x] Deploy Supabase Edge Functions (already deployed)
- [x] Verify production build
- [ ] Configure custom domain

### Phase 4: Polish (In Progress)
- [x] Performance optimization (bundle reduced from 1.56MB to 1.17MB)
- [x] Context state optimized with Set-based O(1) lookups
- [x] Pre-computed geometry to avoid per-frame allocations
- [x] Responsive 3D grid (24x24 mobile, 40x40 desktop)
- [x] New immersive full-screen 3D visualization with Swiss precision
- [ ] Add WebGL context loss handling
- [ ] Add loading/error states for AI widget
- [ ] Add loading/error states for contact form
- [ ] Accessibility audit
- [ ] Final testing

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
| `/supabase/CLAUDE.md` | Edge Functions, database schema, deployment info |

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

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | 3D interactive landing |
| `/work` | `Work` | Project grid with filters |
| `/work/:slug` | `ProjectDetail` | Individual project |
| `/ml-lab` | `MLLab` | ML projects + AI assistant |
| `/video` | `Video` | Video showreel + projects |
| `/about` | `About` | Bio + experience timeline |
| `/contact` | `Contact` | Contact form |

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

## Contributing

1. Follow the existing code patterns
2. Test changes with `npm run build` before committing
3. Update this README if adding new features

---

## Links

- **Live Site**: (coming soon)
- **AI Studio MVP**: https://ai.studio/apps/drive/19q_ywWwZzf0YRKkWMoNLCZua7ZOEfqyH
