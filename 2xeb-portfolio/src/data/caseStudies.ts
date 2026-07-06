/**
 * Case Study Data
 * Static content for interactive case study explorer
 */

export interface TimelineEvent {
  title: string;
  description: string;
  type: 'decision' | 'milestone' | 'challenge' | 'learning';
}

export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  problem: string;
  solution: string;
  techStack: string[];
  timeline: TimelineEvent[];
  results: {
    metric: string;
    value: string;
    description: string;
  }[];
  architecture: string;
  lessons: string[];
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'portfolio-console',
    title: 'Portfolio Console',
    subtitle: 'Full-stack portfolio with WebGL visuals and an AI assistant',

    problem: `Most portfolio sites are either overly simple or rely on heavy CMS platforms. I wanted something that felt more like a product than a template. Something interactive that could actually show what I build, not just list it.`,

    solution: `A React + Three.js SPA with three WebGL scenes, an AI chat assistant powered by Groq, and content managed through TypeScript files (no CMS, everything in git).

The 3D scenes use InstancedMesh for performance. Rendering 1600+ grid cells at 60fps on mobile required some tuning. The AI assistant streams responses via Supabase Edge Functions, with client-side rate limiting to stay within free-tier API limits.

Motion is handled by anime.js v4: a shared IntersectionObserver-driven scroll-reveal hook staggers content in as you browse, the home hero cascades in letter by letter, CTAs are magnetic on desktop, and mono labels decode with a terminal-style text scramble. Everything animates transform/opacity only and backs off under prefers-reduced-motion.

Deployed on Cloudflare Workers with aggressive code splitting: Tailwind is compiled at build time (it originally ran as a runtime CDN script), and three.js/R3F plus the easter-egg terminal are lazy chunks — cutting the main bundle by 62%. The architecture is intentionally simple: static content, serverless functions, no database for public content.`,

    techStack: [
      'React 19 + TypeScript',
      'React Three Fiber',
      'Supabase Edge Functions',
      'Groq API (Llama 3.1/3.3)',
      'anime.js v4',
      'Cloudflare Workers',
      'Tailwind CSS',
      'Vite',
    ],

    timeline: [
      {
        title: 'Skipped the CMS',
        description:
          'Content lives in TypeScript modules. No database roundtrips, everything type-safe, and changes go through git like regular code. Simpler to maintain and deploy.',
        type: 'decision',
      },
      {
        title: 'Mobile performance issues',
        description:
          'Initial 40×40 grid was dropping frames on phones. Switched to InstancedMesh rendering and scaled down to 24×24 on mobile. Now holds 60fps across devices.',
        type: 'challenge',
      },
      {
        title: 'R3F context gotcha',
        description:
          'React context doesn\'t cross the R3F Canvas boundary. Had to re-provide context inside Canvas and use callbacks instead of router hooks for navigation.',
        type: 'learning',
      },
      {
        title: 'AI assistant with streaming',
        description:
          'Edge Function that hits Groq\'s API with project context. Streams tokens back via SSE so responses feel responsive. Added model selection (8B for speed, 70B for depth).',
        type: 'milestone',
      },
      {
        title: 'Rate limiting without a backend',
        description:
          'Client-side rate limiting using localStorage. Tracks requests per model, enforces cooldowns, shows usage stats. Complements server-side validation.',
        type: 'milestone',
      },
      {
        title: 'Spotify + live clock',
        description:
          'Edge Function handles Spotify OAuth refresh flow. Polls every 30s, shows what I\'m listening to. Small detail but adds some life to the page.',
        type: 'milestone',
      },
      {
        title: 'Motion system with anime.js',
        description:
          'Replaced static CSS entrances with orchestrated anime.js timelines: staggered scroll reveals, a letter-by-letter hero, magnetic CTAs, and terminal-style text scrambles. One shared hook drives reveals site-wide.',
        type: 'milestone',
      },
      {
        title: 'The site felt sluggish',
        description:
          'Tailwind was compiling CSS in the browser via the Play CDN, and three.js shipped in the main bundle to every page. Moved Tailwind to build time and lazy-loaded the WebGL scenes + easter-egg terminal: main JS went from 458KB to 173KB gzipped.',
        type: 'challenge',
      },
    ],

    results: [
      {
        metric: 'Frame rate',
        value: '60fps',
        description: 'InstancedMesh + responsive grid sizing. Tested on iPhone SE and low-end Android.',
      },
      {
        metric: 'First token',
        value: '< 1s',
        description: 'Streaming via Groq. Plain text output avoids JSON parsing delays.',
      },
      {
        metric: 'Main bundle',
        value: '173KB gzip',
        description: 'Down 62% — build-time Tailwind, lazy three.js/R3F, lazy easter-egg terminal.',
      },
      {
        metric: 'Monthly cost',
        value: '$0',
        description: 'Cloudflare Pages free tier + Groq free tier + Supabase free tier.',
      },
    ],

    architecture: `
┌─────────────────────────────────────────────────────────────┐
│                 Client (Cloudflare Pages)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   React Router ─── R3F Canvas ─── ConsoleContext            │
│                         │                                   │
│                         ▼                                   │
│              Static Data (TypeScript)                       │
│         projects.ts / caseStudies.ts / etc                  │
│                                                             │
│              Rate Limiting (localStorage)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase Edge Functions                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ask-portfolio ──► Groq API (streaming)                    │
│   spotify-now-playing ──► Spotify API                       │
│   submit-contact ──► Resend + DB                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
`,

    lessons: [
      'InstancedMesh is essential for WebGL on mobile. Batching draw calls made the difference between 20fps and 60fps.',
      'React context doesn\'t propagate into R3F Canvas. Plan for that boundary early.',
      'Static TypeScript > CMS for small sites. Faster, type-safe, version controlled, free.',
      'Client-side rate limiting pairs well with server-side validation for defense in depth.',
      'Streaming makes AI feel fast even when it\'s not. First token time > total time.',
      'Never ship a runtime CSS compiler. The Tailwind Play CDN is great for prototypes and terrible for production.',
      'Animate transform and opacity only, and always respect prefers-reduced-motion.',
      'Free tiers are underrated. This whole stack costs nothing to run.',
    ],
  },
];

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((cs) => cs.slug === slug);
}
