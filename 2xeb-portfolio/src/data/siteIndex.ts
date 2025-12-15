export interface SitePage {
  path: string;
  title: string;
  description: string;
  keywords: string[];
}

export const SITE_INDEX: SitePage[] = [
  {
    path: '/',
    title: 'Home',
    description: 'Landing page with 3D console visualization',
    keywords: ['home', 'landing', 'overview'],
  },
  {
    path: '/work',
    title: 'Work',
    description: 'All projects across SWE, ML, and Video',
    keywords: ['projects', 'portfolio', 'work'],
  },
  {
    path: '/ml-lab',
    title: 'ML Lab',
    description: 'Machine learning and AI projects',
    keywords: ['ml', 'ai', 'machine learning'],
  },
  {
    path: '/video',
    title: 'Video',
    description: 'Cinematography and video production work',
    keywords: ['video', 'film', 'cinematography'],
  },
  {
    path: '/about',
    title: 'About',
    description: 'Background, skills, and experience',
    keywords: ['about', 'bio', 'skills', 'experience'],
  },
  {
    path: '/contact',
    title: 'Contact',
    description: 'Get in touch form',
    keywords: ['contact', 'email', 'reach out', 'hire'],
  },
  {
    path: '/work/portfolio-console',
    title: 'Case Study: Portfolio Console',
    description: 'Deep dive into how this site was built',
    keywords: ['case study', 'how it works', 'architecture'],
  },
];
