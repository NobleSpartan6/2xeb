export enum Discipline {
  SWE = 'SWE',
  ML = 'ML',
  VIDEO = 'VIDEO',
  HYBRID = 'HYBRID'
}

export enum ConsoleLane {
  DESIGN = 'DESIGN', // Was VIDEO
  CODE = 'CODE',     // Was SWE
  VISION = 'VISION'  // Was ML
}

export interface ProjectTag {
  id: number;
  label: string;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  shortDesc: string;
  longDesc?: string;
  primaryDiscipline: Discipline;
  tags: string[];
  createdAt: string;
  videoUrl?: string;
  imageUrl?: string;
  // New Iteration 2 fields
  status?: 'live' | 'wip';
  isExternal?: boolean;
  externalUrl?: string;
  role?: string;
}

export interface ContactFormState {
  name: string;
  email: string;
  message: string;
  reason: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  // Optional list of project slugs referenced by this message
  referencedSlugs?: string[];
}

export interface ExperienceItem {
  id: number;
  company: string;
  role: string;
  date: string;
  location: string;
  desc?: string;
  skills?: string[];
  type: 'SWE' | 'ML' | 'VIDEO' | 'HYBRID' | 'OTHER';
}

// --- GRAPH TYPES ---

export interface GraphNode {
  id: string; // usually project slug
  label: string;
  lane: ConsoleLane;
  x: number;
  z: number;
  project: Project;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number;
}