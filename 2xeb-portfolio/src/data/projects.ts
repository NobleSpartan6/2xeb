import { Discipline, Project } from '../lib/types';

export const PROJECTS: Project[] = [
  // --- KEY EXTERNAL PROJECT ---
  {
    id: 1,
    slug: 'midimix',
    title: 'Midimix',
    shortDesc: 'AI-powered MIDI creative tool.',
    longDesc: 'A standalone platform utilizing machine learning to assist in MIDI generation and routing. Currently in active development.',
    primaryDiscipline: Discipline.HYBRID,
    tags: ['AI', 'Audio', 'WebMIDI', 'ML'],
    createdAt: '2025-01-01',
    imageUrl: 'https://picsum.photos/seed/midimix/800/600',
    status: 'wip',
    isExternal: true,
    externalUrl: 'https://midimix.app',
    role: 'Founder / Lead Engineer'
  },

  // --- SWE PROJECTS ---
  {
    id: 2,
    slug: 'portfolio-console',
    title: 'Portfolio Console',
    shortDesc: 'The 3D system you are exploring.',
    longDesc: 'A React Three Fiber application visualizing my professional graph as a 3D console. Features a Gemini-powered AI agent for natural language navigation.',
    primaryDiscipline: Discipline.SWE,
    tags: ['React Three Fiber', 'Gemini API', 'TypeScript', 'WebGL'],
    createdAt: '2025-02-20',
    imageUrl: 'https://picsum.photos/seed/console/800/600',
    status: 'live',
    role: 'Solo Developer'
  },
  {
    id: 3,
    slug: 'midi-mapper',
    title: 'MIDI Mapper',
    shortDesc: 'Browser-based MIDI routing tool.',
    longDesc: 'A comprehensive tool for musicians to route MIDI signals between devices directly in the browser using the Web MIDI API. It features a visual node-based editor and low-latency processing.',
    primaryDiscipline: Discipline.SWE,
    tags: ['Next.js', 'WebMIDI', 'React Flow', 'React'],
    createdAt: '2024-01-15',
    imageUrl: 'https://picsum.photos/seed/midi/800/600',
    status: 'live',
    role: 'Engineer'
  },

  // --- VIDEO / CREATIVE WORK ---
  {
    id: 10,
    slug: 'mirror-shrapnel',
    title: 'mirror shrapnel — fx30 cinematic edit (fakemink "blow me")',
    shortDesc: 'Cinematic edit for fakemink "blow me". Shot on Sony FX30.',
    longDesc: 'A cinematic edit created for fakemink "blow me".',
    primaryDiscipline: Discipline.VIDEO,
    tags: ['FX30', 'Cinematography', 'Edit', 'VFX'],
    createdAt: '2024-01-01',
    imageUrl: 'https://img.youtube.com/vi/3R7lUPyvs5o/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://www.youtube.com/watch?v=3R7lUPyvs5o',
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
    createdAt: '2023-12-01',
    imageUrl: 'https://img.youtube.com/vi/aVBqUZ_9oEU/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://www.youtube.com/watch?v=aVBqUZ_9oEU',
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
    imageUrl: 'https://img.youtube.com/vi/AtV5yvNgPJs/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://www.youtube.com/watch?v=AtV5yvNgPJs',
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
    imageUrl: 'https://img.youtube.com/vi/B25u850MDNA/maxresdefault.jpg',
    status: 'live',
    videoUrl: 'https://www.youtube.com/watch?v=B25u850MDNA',
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
  return PROJECTS.map(p =>
    `- ${p.title} (${p.slug}): ${p.primaryDiscipline} | ${p.shortDesc} | Tags: ${p.tags.join(', ')}`
  ).join('\n');
}
