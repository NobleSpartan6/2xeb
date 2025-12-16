import { Discipline, Project } from '../lib/types';
import { SITE_INDEX } from './siteIndex';

export const PROJECTS: Project[] = [
  // --- KEY PROJECT (WIP - Internal Route Only) ---
  {
    id: 1,
    slug: 'midimix',
    title: 'Midimix',
    shortDesc: 'An experimental AI tool for music production. Currently in development.',
    longDesc: 'An experimental project exploring AI-assisted music creation. Currently in development.',
    primaryDiscipline: Discipline.HYBRID,
    tags: ['AI', 'Audio', 'WebMIDI', 'ML'],
    createdAt: '2025-01-01',
    imageUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#06B6D4"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs><rect fill="url(#g)" width="800" height="600"/><text x="400" y="290" text-anchor="middle" fill="#fff" font-family="monospace" font-size="56" font-weight="bold" opacity="0.9">MIDIMIX</text><text x="400" y="340" text-anchor="middle" fill="#fff" font-family="monospace" font-size="16" opacity="0.5">AI-POWERED MIDI</text></svg>`)}`,
    status: 'wip',
    isExternal: false,
    // No externalUrl - routes to /work/midimix internally
    role: 'Founder / Lead Engineer'
  },

  // --- SWE PROJECTS ---
  {
    id: 2,
    slug: 'portfolio-console',
    title: 'Portfolio Console',
    shortDesc: 'Full-stack 3D portfolio with AI-powered assistant. Built with React Three Fiber, TypeScript, and Supabase Edge Functions. Optimized for performance (<200KB bundle, 60fps on mobile).',
    longDesc: 'A production-ready portfolio platform featuring a 3D spatial interface built with React Three Fiber and TypeScript. Content is managed through static TypeScript modules in version control, enabling fast iteration through code edits and redeployment. Implements an AI assistant powered by Groq (Llama 3.1 8B, Llama 3.1 70B, Llama 3.3 70B) via Supabase Edge Functions, with streaming responses and context-aware project highlighting. Architecture emphasizes performance: <200KB gzipped bundle, 60fps on mobile devices, <2s time-to-interactive. Includes real-time integrations (Spotify API, time zones) and demonstrates expertise in WebGL optimization, edge computing, and modern React patterns.',
    primaryDiscipline: Discipline.SWE,
    tags: ['React Three Fiber', 'Supabase', 'TypeScript', 'WebGL', 'AI', 'Edge Functions', 'Performance'],
    createdAt: '2025-02-20',
    imageUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563EB"/><stop offset="100%" stop-color="#0A0A0A"/></linearGradient></defs><rect fill="url(#g)" width="800" height="600"/><text x="400" y="290" text-anchor="middle" fill="#fff" font-family="monospace" font-size="48" font-weight="bold" opacity="0.9">CONSOLE</text><text x="400" y="340" text-anchor="middle" fill="#fff" font-family="monospace" font-size="16" opacity="0.5">REACT THREE FIBER</text></svg>`)}`,
    status: 'live',
    role: 'Solo Developer'
  },

  // --- VIDEO / CREATIVE WORK ---
  {
    id: 10,
    slug: 'mirror-shrapnel',
    title: 'mirror shrapnel — fx30 cinematic edit (fakemink "blow me")',
    shortDesc: 'A cinematic edit to the song "blow me" by fakemink. Shot on Sony FX30.',
    longDesc: 'A cinematic edit to the song "blow me" by fakemink. Shot on Sony FX30.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['FX30', 'Cinematography', 'Edit', 'VFX'],
    createdAt: '2024-01-01',
    imageUrl: 'https://video.gumlet.io/693f470a7ada4a23333078f6/693f4b873cf0cd39b98f8ba6/thumbnail-1-0.png?v=1765781824234',
    status: 'live',
    videoUrl: 'https://play.gumlet.io/embed/693f4b873cf0cd39b98f8ba6?autoplay=false&loop=false&disableControls=false',
    role: 'video / edit fx'
  },
  {
    id: 11,
    slug: 'ephemeral-hours',
    title: 'ephemeral hours | nyc cinematic reel • fx30',
    shortDesc: 'NYC Cinematic Reel.',
    longDesc: 'A visual journey through NYC shot on FX30.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['FX30', 'Cinematography', 'Color Grading', 'VFX'],
    createdAt: '2025-12-01',
    imageUrl: 'https://video.gumlet.io/693f470a7ada4a23333078f6/693f47fe3cf0cd39b98f6061/thumbnail-1-0.png?v=1765781953458',
    status: 'live',
    videoUrl: 'https://play.gumlet.io/embed/693f47fe3cf0cd39b98f6061?autoplay=false&loop=false&disableControls=false',
    role: 'video / edit / vfx'
  },
  {
    id: 15,
    slug: 'navy-mannequins',
    title: 'Yuzeren - Navy Mannequins (Official Music Video)',
    shortDesc: 'Official Music Video.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['Color Grading', 'Music Video', 'VFX'],
    createdAt: '2023-01-01',
    imageUrl: 'https://img.youtube.com/vi/U5h2rFqQJ_8/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://youtu.be/U5h2rFqQJ_8',
    role: 'color / edit / vfx'
  },
  {
    id: 12,
    slug: 'souls-odyssey',
    title: "soul's odyssey",
    shortDesc: 'Abstract visual narrative.',
    longDesc: 'Experimental visual project combining VFX and practical footage.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['VFX', 'Editing', 'Abstract'],
    createdAt: '2023-10-01',
    imageUrl: 'https://img.youtube.com/vi/IBw3zPefadM/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://www.youtube.com/watch?v=IBw3zPefadM',
    role: 'video / edit vfx'
  },
  {
    id: 13,
    slug: 'lord-of-chaos',
    title: 'LORD OF CHAOS | Ken Carson Live at Cornell | 4/19/25 Recap',
    shortDesc: 'Live performance recap.',
    longDesc: 'Recap edit of the Ken Carson live performance at Cornell.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['Event', 'Live', 'Edit'],
    createdAt: '2025-04-20',
    imageUrl: 'https://video.gumlet.io/693f470a7ada4a23333078f6/693fbebf7ada4a233337bca8/thumbnail-1-0.png',
    status: 'live',
    videoUrl: 'https://play.gumlet.io/embed/693fbebf7ada4a233337bca8?autoplay=false&loop=false&disableControls=false',
    role: 'video / edit'
  },
  {
    id: 14,
    slug: '2003-recap',
    title: '#2003 friends and family show Brooklyn, NY | recap by eb',
    shortDesc: 'Event recap.',
    longDesc: 'Recap of the #2003 friends and family show in Brooklyn.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['Event', 'Live', 'Edit'],
    createdAt: '2024-02-01',
    imageUrl: 'https://video.gumlet.io/693f470a7ada4a23333078f6/693fb6e4b45f2098f40cad3d/thumbnail-1-0.png?v=1765784424424',
    status: 'live',
    videoUrl: 'https://play.gumlet.io/embed/693fb6e4b45f2098f40cad3d?autoplay=false&loop=false&disableControls=false',
    role: 'video / edit'
  },
  {
    id: 16,
    slug: 'ill-intentions',
    title: 'ILL INTENTIONS [Official Music Video] (4K) [Dir. EB] @whoisatg',
    shortDesc: 'Official Music Video.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['Direction', 'Music Video', '4K'],
    createdAt: '2023-08-15',
    imageUrl: 'https://img.youtube.com/vi/iRv5AC-30iU/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://www.youtube.com/watch?v=iRv5AC-30iU',
    role: 'video'
  },
  {
    id: 17,
    slug: 'outsider-halo-3',
    title: 'Outsider - Halo 3 Edit (clips in desc)',
    shortDesc: 'Halo 3 Edit.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['Gaming', 'Edit', 'VFX'],
    createdAt: '2023-06-20',
    imageUrl: 'https://img.youtube.com/vi/yJLPljlAhO8/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://www.youtube.com/watch?v=yJLPljlAhO8',
    role: 'edit / vfx'
  },
  {
    id: 18,
    slug: 'temptation-halo',
    title: 'Temptation - Noble Halo Infinite Montage',
    shortDesc: 'Halo Infinite Montage.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['VFX', 'Motion Graphics', 'Gaming'],
    createdAt: '2023-05-10',
    imageUrl: 'https://img.youtube.com/vi/HOA457Z7RVY/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://www.youtube.com/watch?v=HOA457Z7RVY',
    role: 'edit / vfx'
  },

  // --- LEGACY / EDITING ---
  {
    id: 20,
    slug: 'deal-wiv-it',
    title: 'DEAL WIV IT - Halo Reach Edit by Noble',
    shortDesc: 'Halo Reach Edit.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['Gaming', 'Montage', 'VFX'],
    createdAt: '2018-01-01',
    imageUrl: 'https://img.youtube.com/vi/P3BFns8bhkg/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://youtu.be/P3BFns8bhkg',
    role: 'edit / vfx / 3d'
  },
  {
    id: 21,
    slug: 'str8-rippin',
    title: 'STR8 RIPPIN HWC 2018 MONTAGE',
    shortDesc: '2018 Championship Montage.',
    longDesc: 'Displayed during 2018 Halo World Championships. 100k+ viewers. (Timestamps 1:37 - 2:16)',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['Esports', 'Live Production', '3D'],
    createdAt: '2018-08-01',
    imageUrl: 'https://img.youtube.com/vi/DNX2WlJMZnc/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://youtu.be/DNX2WlJMZnc?t=96',
    role: 'edit / vfx / 3d'
  },
  {
    id: 22,
    slug: 'dusty-halo-5',
    title: 'Dusty - The Final Halo 5 Montage Edited by Noble',
    shortDesc: 'Halo 5 Montage.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['3D', 'Motion Design', 'VFX', 'Gaming'],
    createdAt: '2019-03-15',
    imageUrl: 'https://img.youtube.com/vi/bGogZrNimSg/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://youtu.be/bGogZrNimSg',
    role: 'edit / 3d / vfx'
  },
  {
    id: 23,
    slug: 'endure-pain',
    title: 'Endure Pain by Noble',
    shortDesc: 'Halo Montage.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['3D', 'Motion Design', 'VFX', 'Gaming'],
    createdAt: '2019-05-20',
    imageUrl: 'https://img.youtube.com/vi/HONo_IgdbWI/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://youtu.be/HONo_IgdbWI',
    role: 'edit / 3d / vfx'
  }
];

/**
 * Build a compact context string for the AI assistant.
 * Used when calling the ask-portfolio Edge Function.
 */
export function buildProjectContext(): string {
  const projectsContext = PROJECTS.map(p => {
    const parts = [
      `${p.title} (${p.slug})`,
      `Discipline: ${p.primaryDiscipline}`,
      `Description: ${p.shortDesc}`,
    ];
    
    if (p.longDesc) {
      parts.push(`Details: ${p.longDesc}`);
    }
    
    if (p.role) {
      parts.push(`Role: ${p.role}`);
    }
    
    if (p.status) {
      parts.push(`Status: ${p.status.toUpperCase()}`);
    }
    
    if (p.isExternal && p.externalUrl) {
      parts.push(`External: ${p.externalUrl}`);
    } else {
      parts.push(`Link: /work/${p.slug}`);
    }
    
    if (p.tags.length > 0) {
      parts.push(`Tags: ${p.tags.join(', ')}`);
    }
    
    return `- ${parts.join(' | ')}`;
  }).join('\n');

  const navContext = SITE_INDEX.map(page =>
    `- ${page.title} (${page.path}): ${page.description}`
  ).join('\n');

  return `PROJECTS:\n${projectsContext}\n\nSITE NAVIGATION:\n${navContext}`;
}
