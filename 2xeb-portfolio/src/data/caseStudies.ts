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
    subtitle: 'Full-stack 3D portfolio platform with AI integration and performance optimization',

    problem: `Traditional portfolio sites flatten complex work into linear lists, making it difficult to showcase interdisciplinary skills and technical depth.
Most portfolios either rely on heavy CMS platforms (adding complexity and cost) or sacrifice interactivity for simplicity.
I needed a solution that demonstrates full-stack capabilities, modern web technologies, and production-ready performance—while maintaining developer-friendly architecture and deployment simplicity.`,

    solution: `Built a production-ready, full-stack portfolio platform featuring a 3D spatial interface using React Three Fiber and WebGL optimization techniques.
Architected a developer-first content approach: static TypeScript data modules in src/data/ provide version-controlled, type-safe content that deploys with the codebase. This eliminates CMS overhead, keeps content changes in version control, and enables fast iteration through code edits and redeployment.
Integrated AI capabilities via Supabase Edge Functions, supporting multiple Groq models (Llama 3.1 8B, Llama 3.1 70B, Llama 3.3 70B) with streaming responses, context-aware project highlighting, and client-side rate limiting to prevent API abuse.
Built three distinct 3D scenes: immersive home scene with discipline-based agent movement, isometric project browser with graph-based connections, and animated background grid. Each optimized for performance with instanced meshing and responsive rendering.
Implemented client-side rate limiting system with localStorage persistence, cooldown periods, and per-model request tracking to respect free-tier API limits while providing smooth UX.
Deployed to Cloudflare Pages with BrowserRouter for SPA routing, security headers, and edge-optimized asset delivery. Code splitting via React.lazy() reduces initial bundle size.
Added contact form with Supabase Edge Function integration, email notifications via Resend API, and database persistence with RLS policies ensuring data privacy.
Created graph data structure for visualizing project relationships based on shared tags, enabling dynamic connection rendering in 3D space and demonstrating data modeling skills.
Note: An optional admin CMS exists for database-backed content management, but the primary workflow uses static TypeScript modules for simplicity and version control.`,

    techStack: [
      'React 19 + TypeScript',
      'React Three Fiber + drei',
      'WebGL Performance Optimization',
      'Supabase Edge Functions',
      'Groq API (Llama 3.1/3.3)',
      'Llama 3.1 70B',
      'Cloudflare Pages',
      'BrowserRouter (SPA Routing)',
      'Tailwind CSS',
      'Vite',
      'Serverless Architecture',
      'Code Splitting (React.lazy)',
    ],

    timeline: [
      {
        title: 'Architecture: SPA with static data modules',
        description:
          'Designed a client-side Vite/React application using static TypeScript modules for content management. This approach eliminates CMS dependencies, maintains type safety, enables version control for content, and simplifies deployment while keeping bundle size minimal.',
        type: 'decision',
      },
      {
        title: 'WebGL performance optimization',
        description:
          'Identified performance bottleneck: initial 40×40 grid (1600 cells) caused frame drops on mobile devices. Implemented InstancedMesh rendering and responsive grid scaling (40×40 desktop, 24×24 mobile), maintaining visual consistency while achieving consistent 60fps across devices.',
        type: 'challenge',
      },
      {
        title: 'React context and R3F Canvas boundaries',
        description:
          'Resolved architectural challenge where React context does not propagate across React Three Fiber Canvas boundaries. Solution: re-provide context within Canvas component and implement callback-based navigation pattern instead of router hooks, maintaining clean separation of concerns.',
        type: 'learning',
      },
      {
        title: 'Multi-provider AI integration',
        description:
          'Built ask-portfolio Edge Function supporting multiple Groq models (Llama 3.1 8B, Llama 3.1 70B, Llama 3.3 70B) with model selection and abstraction. Implemented context building from static data, model validation, streaming responses, and error handling. Demonstrates serverless architecture and API integration patterns.',
        type: 'milestone',
      },
      {
        title: 'Streaming UI and UX polish',
        description:
          'Implemented streaming response UI with token-by-token rendering, copy/regenerate actions, custom markdown renderer (~50 lines), and typing indicators. Focused on keeping AI assistant present but non-intrusive, demonstrating attention to UX and performance.',
        type: 'milestone',
      },
      {
        title: 'Real-time API integrations',
        description:
          'Integrated Spotify API with OAuth refresh token flow and timezone-aware clock via Supabase Edge Functions. Demonstrates serverless API integration, token management, and real-time data handling while maintaining minimal UI footprint.',
        type: 'milestone',
      },
      {
        title: 'Client-side rate limiting',
        description:
          'Implemented sophisticated rate limiting system using localStorage to track requests per model, enforce cooldown periods, and respect free-tier API limits. Includes usage stats display and user-friendly error messages, preventing API abuse while maintaining smooth UX.',
        type: 'milestone',
      },
      {
        title: 'Graph data structure and 3D visualization',
        description:
          'Created graph data structure generating nodes and edges based on project tag relationships. Implemented three distinct 3D scenes (ImmersiveScene, SystemConsoleScene, OrbitScene) each optimized for different use cases, demonstrating WebGL expertise and performance optimization.',
        type: 'milestone',
      },
      {
        title: 'Production deployment',
        description:
          'Deployed to Cloudflare Pages with BrowserRouter for SPA routing, security headers, and edge-optimized delivery. Implemented code splitting via React.lazy() for admin routes, reducing initial bundle size. Configured environment variables and edge function integrations.',
        type: 'milestone',
      },
    ],

    results: [
      {
        metric: 'Bundle size',
        value: '< 200KB',
        description: 'Gzipped JavaScript stays under 200KB by avoiding heavy UI and markdown dependencies.',
      },
      {
        metric: 'Frame rate',
        value: '≈60fps',
        description: 'The main scene holds 60fps on an iPhone 12+ under normal interaction.',
      },
      {
        metric: 'Time to interactive',
        value: '< 2s',
        description: 'On a throttled 3G profile, the console becomes interactive in under two seconds.',
      },
      {
        metric: 'AI response time',
        value: '< 1.5s',
        description: 'Plain-text streaming via Groq (Llama 3.1 8B) to avoid JSON flashing and keep first token fast.',
      },
    ],

    architecture: `
┌─────────────────────────────────────────────────────────────┐
│                    Client (SPA - Cloudflare Pages)         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   React     │  │   R3F       │  │  ConsoleContext     │ │
│  │ BrowserRouter│  │   Canvas    │  │  (shared state)     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                  │
│  ┌───────────────────────┴───────────────────────────────┐ │
│  │              Static Data (/src/data/)                 │ │
│  │   projects.ts │ timeline.ts │ graph.ts │ caseStudies  │ │
│  │   TypeScript modules - version controlled, type-safe  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Rate Limiting (Client-Side)                          │ │
│  │  localStorage-based request tracking per model        │ │
│  │  Cooldown periods, RPM limits, daily limits          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ fetch()
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Edge Functions                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │  ask-portfolio  │  │ spotify-now-    │  │  submit-   │  │
│  │  (Groq)         │  │ playing         │  │  contact   │  │
│  │  Streaming SSE   │  │ OAuth Refresh  │  │  + Email   │  │
│  └────────┬────────┘  └────────┬────────┘  └─────┬──────┘  │
│           │                    │                  │         │
│           ▼                    ▼                  ▼         │
│      Groq                 Spotify API         Supabase DB   │
└─────────────────────────────────────────────────────────────┘
`,

    lessons: [
      'Performance-first architecture: InstancedMesh rendering enables rendering thousands of objects at 60fps by batching GPU draw calls, essential for WebGL applications targeting mobile devices.',
      'React patterns: Understanding React context boundaries and component lifecycle across different rendering contexts (DOM vs WebGL) is crucial for complex applications.',
      'Developer-first content management: Static TypeScript modules provide version control, type safety, and zero runtime overhead. Content changes are code changes, enabling fast iteration and keeping everything in git history.',
      'Client-side rate limiting: Implementing rate limiting in the client prevents API abuse and respects free-tier limits while maintaining smooth UX, complementing server-side validation.',
      'Code splitting strategy: Lazy loading admin routes reduces initial bundle size for public users while keeping admin functionality available when needed, demonstrating performance-conscious architecture.',
      'Serverless architecture: Edge Functions enable secure API integrations, secret management, and external service communication without maintaining dedicated infrastructure, reducing operational overhead.',
      'Graph data modeling: Creating graph structures for relationships (project tags → connections) enables dynamic visualizations and demonstrates data modeling skills beyond simple CRUD.',
      'Production metrics matter: Tracking bundle size, frame rate, and time-to-interactive provides concrete performance targets and demonstrates production-readiness to stakeholders.',
      'Multi-scene optimization: Different 3D scenes optimized for different use cases (immersive home, isometric browser, background animation) demonstrate understanding of performance trade-offs and user experience design.',
    ],
  },
];

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((cs) => cs.slug === slug);
}
