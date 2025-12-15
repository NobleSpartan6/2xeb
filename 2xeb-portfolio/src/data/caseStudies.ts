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
    subtitle: 'A single-screen 3D console for code, ML/AI, and video',

    problem: `Most portfolio sites reduce years of work into a vertical list.
They make it hard to see how skills relate, and they rarely reflect how I actually think about tools, systems, and visuals in one space.
I wanted a single-screen console where software, ML/AI, and video live together, without adding a heavy CMS or backend.`,

    solution: `I designed a single "console" view where projects appear as nodes in a 3D field, built with React Three Fiber.
Instead of scrolling past cards, you move through a small system: nodes, connections, and lanes for software, ML, and video.
Static TypeScript data powers the AI layer (Groq/Gemini via Supabase Edge Functions). The assistant answers in plain text, streams tokens, and highlights related work in the console.
Quiet real-time touches (Spotify now playing, local clock) keep the page feeling lived-in without competing with the work itself.`,

    techStack: [
      'React 19 + TypeScript',
      'React Three Fiber + drei',
      'Supabase Edge Functions',
      'Groq API (Llama 3.1/3.3)',
      'Gemini 2.0 Flash',
      'Tailwind CSS',
      'Vite',
    ],

    timeline: [
      {
        title: 'Architecture decision: keep it a SPA',
        description:
          'Chose a client-side Vite/React app instead of a framework stack. Static TypeScript modules hold project data so everything stays versioned alongside the code, and deployment stays simple.',
        type: 'decision',
      },
      {
        title: 'First R3F performance wall',
        description:
          'The initial 40×40 grid (1600 cells) looked clean but dropped frames on mobile. Moving to InstancedMesh plus a responsive grid (40×40 on desktop, 24×24 on smaller screens) kept the visual language while restoring smooth interaction.',
        type: 'challenge',
      },
      {
        title: 'Context and Canvas boundaries',
        description:
          'Learned (the hard way) that React context does not cross the R3F Canvas boundary. The fix was to re-provide context inside Canvas and pass navigation in as a simple callback instead of trying to use router hooks inside the scene graph.',
        type: 'learning',
      },
      {
        title: 'Ask‑portfolio arrives',
        description:
          'Shipped an ask-portfolio Edge Function that can talk to Groq and Gemini. The client builds a compact context string from static project data, and the function is responsible for validating model selection and prompting.',
        type: 'milestone',
      },
      {
        title: 'Conversation refinements',
        description:
          'Tuned the chat UI: streaming responses, copy/regenerate actions, a minimal markdown renderer in ~50 lines, and a quiet typing indicator. The goal was to keep the assistant present but not dominant.',
        type: 'milestone',
      },
      {
        title: 'Small real‑time touches',
        description:
          'Added a now playing integration over an Edge Function (Spotify API with refresh tokens) and a New York clock. Both are intentionally understated; they exist to hint at the person behind the work, not to shout.',
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
│                         Client (SPA)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   React     │  │   R3F       │  │  ConsoleContext     │ │
│  │   Router    │  │   Canvas    │  │  (shared state)     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                  │
│  ┌───────────────────────┴───────────────────────────────┐ │
│  │              Static Data (/src/data/)                 │ │
│  │   projects.ts │ timeline.ts │ graph.ts │ caseStudies  │ │
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
│  │  (Groq/Gemini)  │  │ playing         │  │  contact   │  │
│  └────────┬────────┘  └────────┬────────┘  └─────┬──────┘  │
│           │                    │                  │         │
│           ▼                    ▼                  ▼         │
│      Groq/Gemini         Spotify API         Supabase DB   │
└─────────────────────────────────────────────────────────────┘
`,

    lessons: [
      'Instanced meshes are a good default when many similar objects need to exist without overwhelming the GPU.',
      'React context and the R3F Canvas live in different worlds; re-providing context inside the Canvas keeps the mental model clear.',
      'For this kind of site, static TypeScript modules are simpler than introducing a full CMS or database for content.',
      'A small, well-targeted helper can replace a heavy dependency when the use case is narrow and understood.',
      'Edge Functions provide enough "backend" to hold secrets and talk to external APIs without maintaining a full server.',
    ],
  },
];

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((cs) => cs.slug === slug);
}
