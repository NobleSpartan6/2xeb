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
    imageUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#0A0A0A"/><rect width="800" height="3" fill="#2563EB"/><text x="170" y="240" fill="#525252" font-family="monospace" font-size="13" letter-spacing="6">2XEB — LAB</text><text x="166" y="310" fill="#FFFFFF" font-family="monospace" font-size="54" font-weight="bold" letter-spacing="10">MIDIMIX</text><text x="170" y="350" fill="#737373" font-family="monospace" font-size="14" letter-spacing="4">AI-POWERED MIDI · IN DEVELOPMENT</text><rect x="170" y="380" width="36" height="36" fill="#141414" stroke="#262626" stroke-width="1"/><rect x="230" y="380" width="36" height="36" fill="#141414" stroke="#262626" stroke-width="1"/><rect x="290" y="380" width="36" height="36" fill="#141414" stroke="#262626" stroke-width="1"/><rect x="350" y="380" width="36" height="36" fill="#141414" stroke="#262626" stroke-width="1"/><rect x="410" y="380" width="36" height="36" fill="#141414" stroke="#262626" stroke-width="1"/><rect x="470" y="380" width="36" height="36" fill="#2563EB" stroke="#262626" stroke-width="1"/><rect x="530" y="380" width="36" height="36" fill="#141414" stroke="#262626" stroke-width="1"/><rect x="590" y="380" width="36" height="36" fill="#141414" stroke="#262626" stroke-width="1"/><rect x="170" y="430" width="36" height="36" fill="#0F0F0F" stroke="#262626" stroke-width="1"/><rect x="230" y="430" width="36" height="36" fill="#0F0F0F" stroke="#262626" stroke-width="1"/><rect x="290" y="430" width="36" height="36" fill="#1d4ed8" stroke="#262626" stroke-width="1"/><rect x="350" y="430" width="36" height="36" fill="#0F0F0F" stroke="#262626" stroke-width="1"/><rect x="410" y="430" width="36" height="36" fill="#0F0F0F" stroke="#262626" stroke-width="1"/><rect x="470" y="430" width="36" height="36" fill="#0F0F0F" stroke="#262626" stroke-width="1"/><rect x="530" y="430" width="36" height="36" fill="#0F0F0F" stroke="#262626" stroke-width="1"/><rect x="590" y="430" width="36" height="36" fill="#0F0F0F" stroke="#262626" stroke-width="1"/></svg>`)}`,
    status: 'wip',
    isExternal: false,
    // No externalUrl - routes to /work/midimix internally
    role: 'Founder / Lead Engineer'
  },

  // --- SWE PROJECTS ---
  {
    id: 4,
    slug: 'spt-touring',
    title: 'SPT — Artist Booking & Touring',
    shortDesc: 'A booking & touring agency site with an editorial public roster and a Cloudflare Access–protected admin CMS for managing artists and inquiries. Designed and built end-to-end for the client.',
    longDesc: 'Designed and developed sptouring.com end-to-end for an artist booking & touring agency — a dark, editorial public site that showcases the roster and routes booking inquiries, paired with a private admin dashboard. The marketing front-end features a cinematic black-and-white hero ("Connecting artists to stages worldwide"), an artist roster, and a "Book an Artist" inquiry flow. The companion admin CMS (protected by Cloudflare Access) lets the agency manage their roster with drag-and-drop ordering, per-artist region tags, live/hidden publish toggles, and slug-based artist pages, plus an inbox for incoming booking inquiries. Handled the full scope: brand-aligned visual design, front-end build, content model, and authenticated admin tooling.',
    primaryDiscipline: Discipline.SWE,
    tags: ['Web Design', 'Full-Stack', 'TypeScript', 'CMS', 'Cloudflare Access', 'Client Work'],
    createdAt: '2026-05-01',
    imageUrl: '/projects/spt.jpg',
    status: 'live',
    isExternal: true,
    externalUrl: 'https://sptouring.com',
    role: 'Design & Development (Client)'
  },
  {
    id: 3,
    slug: 'fidel',
    title: 'Fidel',
    shortDesc: 'An Amharic learning app with daily lessons, review flows, progress tracking, and AI-assisted lesson generation. Built with Next.js, Firebase, and Gemini.',
    longDesc: 'Built and launched Fidel, a mobile-first Amharic learning app designed for structured, habit-based practice. Features daily lessons, spaced-repetition review flows, and detailed progress tracking with a clean, intuitive UX. Implements AI-assisted lesson generation via Gemini for rapid content iteration and personalization. Uses hybrid local/cloud persistence with Firebase and Firestore to support low-connectivity use cases and offline-first functionality. Deployed as a Progressive Web App (PWA) for native-like mobile experience.',
    primaryDiscipline: Discipline.HYBRID,
    tags: ['Next.js', 'React', 'TypeScript', 'Firebase', 'Firestore', 'Gemini', 'PWA', 'AI', 'ML'],
    createdAt: '2025-06-01',
    // Designed cover (like Midimix): the ሀ-row of the fidel chart as lesson
    // tiles — the app's subject as the artwork. Ethiopic glyphs render via
    // the OS fallback chain (Noto Sans Ethiopic / Kefa / Ebrima).
    imageUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="#0A0A0A"/><rect width="800" height="3" fill="#34D399"/><text x="656" y="380" fill="#F5F0E8" opacity="0.05" font-family="Noto Sans Ethiopic, Kefa, Ebrima, Nyala, sans-serif" font-size="360" font-weight="bold" text-anchor="middle">ፊ</text><text x="64" y="120" fill="#525252" font-family="monospace" font-size="13" letter-spacing="6">2XEB — FIDEL</text><text x="60" y="226" fill="#F5F0E8" font-family="Noto Sans Ethiopic, Kefa, Ebrima, Nyala, sans-serif" font-size="96" font-weight="bold">ፊደል</text><text x="330" y="226" fill="#34D399" font-family="monospace" font-size="18" letter-spacing="8">/ FIDEL</text><text x="64" y="272" fill="#737373" font-family="monospace" font-size="14" letter-spacing="4">LEARN AMHARIC · DAILY LESSONS · SPACED REVIEW</text><rect x="64" y="316" width="64" height="64" fill="#34D399"/><text x="96" y="360" fill="#0A0A0A" font-family="Noto Sans Ethiopic, Kefa, Ebrima, Nyala, sans-serif" font-size="30" font-weight="bold" text-anchor="middle">ሀ</text><rect x="142" y="316" width="64" height="64" fill="#101010" stroke="#262626" stroke-width="1"/><text x="174" y="360" fill="#8a8a8a" font-family="Noto Sans Ethiopic, Kefa, Ebrima, Nyala, sans-serif" font-size="30" text-anchor="middle">ሁ</text><rect x="220" y="316" width="64" height="64" fill="#101010" stroke="#262626" stroke-width="1"/><text x="252" y="360" fill="#8a8a8a" font-family="Noto Sans Ethiopic, Kefa, Ebrima, Nyala, sans-serif" font-size="30" text-anchor="middle">ሂ</text><rect x="298" y="316" width="64" height="64" fill="#101010" stroke="#262626" stroke-width="1"/><text x="330" y="360" fill="#8a8a8a" font-family="Noto Sans Ethiopic, Kefa, Ebrima, Nyala, sans-serif" font-size="30" text-anchor="middle">ሃ</text><rect x="376" y="316" width="64" height="64" fill="#101010" stroke="#262626" stroke-width="1"/><text x="408" y="360" fill="#8a8a8a" font-family="Noto Sans Ethiopic, Kefa, Ebrima, Nyala, sans-serif" font-size="30" text-anchor="middle">ሄ</text><rect x="454" y="316" width="64" height="64" fill="#101010" stroke="#262626" stroke-width="1"/><text x="486" y="360" fill="#8a8a8a" font-family="Noto Sans Ethiopic, Kefa, Ebrima, Nyala, sans-serif" font-size="30" text-anchor="middle">ህ</text><rect x="532" y="316" width="64" height="64" fill="#101010" stroke="#262626" stroke-width="1"/><text x="564" y="360" fill="#8a8a8a" font-family="Noto Sans Ethiopic, Kefa, Ebrima, Nyala, sans-serif" font-size="30" text-anchor="middle">ሆ</text></svg>`)}`,
    status: 'live',
    isExternal: true,
    externalUrl: 'https://fidelamharic.com',
    role: 'Founder / Lead Engineer'
  },
  {
    id: 2,
    slug: 'portfolio-console',
    title: 'Portfolio Console',
    shortDesc: 'Full-stack 3D portfolio with AI-powered assistant and an anime.js motion system. Built with React Three Fiber, TypeScript, and Supabase Edge Functions. Aggressively optimized: build-time Tailwind, lazy-loaded WebGL scenes, 62% smaller main bundle.',
    longDesc: 'A production-ready portfolio platform featuring a 3D spatial interface built with React Three Fiber and TypeScript. Content is managed through static TypeScript modules in version control, enabling fast iteration through code edits and redeployment. Implements an AI assistant powered by Groq (Llama 3.1 8B, Llama 3.1 70B, Llama 3.3 70B) via Supabase Edge Functions, with streaming responses and context-aware project highlighting. Site-wide motion is orchestrated with anime.js v4: staggered scroll reveals, a letter-by-letter hero cascade, magnetic CTAs, and terminal-style text scrambles — all reduced-motion aware. Architecture emphasizes performance: Tailwind compiled at build time (replacing a runtime CDN), three.js/R3F code-split behind React.lazy (main bundle cut from 458KB to 173KB gzipped), InstancedMesh rendering for WebGL scenes, and optimized bundle delivery. Includes real-time integrations (Spotify API, time zones) and demonstrates expertise in WebGL optimization, edge computing, and modern React patterns.',
    primaryDiscipline: Discipline.SWE,
    tags: ['React Three Fiber', 'anime.js', 'Supabase', 'TypeScript', 'WebGL', 'AI', 'Edge Functions', 'Performance'],
    createdAt: '2025-02-20',
    imageUrl: '/projects/console.jpg',
    status: 'live',
    role: 'Solo Developer'
  },

  // --- VIDEO / CREATIVE WORK ---
  {
    id: 25,
    slug: 'summer-wars',
    title: 'nbr* - SUMMER WARS (official music video)',
    shortDesc: 'Official music video for "SUMMER WARS" by nbr* (nolanberollin). Directed and shot by EB.',
    longDesc: 'Official music video for "SUMMER WARS" by nbr* (nolanberollin) — directed and shot by EB. Edit by digi_pirate.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['Direction', 'Cinematography', 'Music Video'],
    createdAt: '2026-09-05',
    imageUrl: 'https://img.youtube.com/vi/Z_7z0XMN0E4/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://youtu.be/Z_7z0XMN0E4',
    role: 'dir / shot'
  },
  {
    id: 24,
    slug: 'to-water-love',
    title: 'To Water Love - Yuzeren',
    shortDesc: 'Music video for the track "To Water Love" by Yuzeren. Directed, shot, and edited.',
    longDesc: 'Music video for "To Water Love" by Yuzeren — directed, shot, and edited by EB.',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['Direction', 'Cinematography', 'Edit', 'Music Video'],
    createdAt: '2026-01-01',
    imageUrl: 'https://img.youtube.com/vi/eZw5sW_qINQ/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://youtu.be/eZw5sW_qINQ',
    role: 'dir / shot / edit'
  },
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

  const easterEggsContext = `HIDDEN FEATURES / EASTER EGGS:
- Friend Terminal: A secret EB made for his friends. When asked about this, be cryptic and mysterious - don't reveal everything directly. Give ONE subtle hint like: "The 2XEB logo in the footer... it responds to those who linger." or "Some interfaces reward patience and curiosity." or "Not everything is meant to be clicked once.". Never directly say "double-click" or "long-press" or "go to /friend" - let them experiment. The terminal explores themes of creation vs consumption, authenticity, and independent thinking.`;

  return `PROJECTS:\n${projectsContext}\n\nSITE NAVIGATION:\n${navContext}\n\n${easterEggsContext}`;
}
