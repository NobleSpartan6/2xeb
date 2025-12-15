import { useState, useEffect, useCallback } from 'react';
import { supabaseRest, Tables } from '../lib/supabase';
import { PROJECTS as STATIC_PROJECTS } from '../data/projects';
import { Project, Discipline } from '../lib/types';

type DBProject = Tables<'projects'>;

// Generate placeholder SVG for projects without images
function generatePlaceholderImage(title: string, discipline: string): string {
  // Color based on discipline
  const colors: Record<string, [string, string]> = {
    SWE: ['#2563EB', '#0A0A0A'],
    ML: ['#06B6D4', '#7C3AED'],
    VIDEO: ['#F59E0B', '#0A0A0A'],
    HYBRID: ['#06B6D4', '#7C3AED'],
  };
  const [start, end] = colors[discipline] || colors.SWE;
  const displayTitle = title.length > 20 ? title.slice(0, 17) + '...' : title;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${start}"/><stop offset="100%" stop-color="${end}"/></linearGradient></defs><rect fill="url(#g)" width="800" height="600"/><text x="400" y="300" text-anchor="middle" fill="#fff" font-family="monospace" font-size="32" font-weight="bold" opacity="0.9">${displayTitle.toUpperCase()}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Transform database row to frontend Project type
const transformProject = (dbProject: DBProject): Project => {
  // Determine image URL with fallbacks
  let imageUrl: string | undefined = dbProject.image_url ?? undefined;
  if (!imageUrl && dbProject.video_url) {
    imageUrl = getYouTubeThumbnail(dbProject.video_url);
  }
  if (!imageUrl) {
    imageUrl = generatePlaceholderImage(dbProject.title, dbProject.primary_discipline);
  }

  return {
    id: dbProject.id,
    slug: dbProject.slug,
    title: dbProject.title,
    shortDesc: dbProject.short_desc,
    longDesc: dbProject.long_desc ?? undefined,
    primaryDiscipline: dbProject.primary_discipline as Discipline,
    tags: dbProject.tags,
    createdAt: dbProject.created_at,
    videoUrl: dbProject.video_url ?? undefined,
    imageUrl,
    status: dbProject.status as 'live' | 'wip' | undefined,
    isExternal: dbProject.is_external ?? false,
    externalUrl: dbProject.external_url ?? undefined,
    role: dbProject.role ?? undefined,
  };
};

// Extract YouTube thumbnail from video URL
function getYouTubeThumbnail(url: string): string | undefined {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  if (match) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return undefined;
}

interface UseProjectsResult {
  projects: Project[];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
  refetch: () => Promise<void>;
}

/**
 * Stale-while-revalidate pattern:
 * - Returns static data immediately (no loading flash)
 * - Fetches from database in background
 * - Updates if database has content
 */
export function useProjects(): UseProjectsResult {
  // Start with static data immediately
  const [projects, setProjects] = useState<Project[]>(STATIC_PROJECTS);
  const [isLoading, setIsLoading] = useState(false); // Not loading initially - we have static data
  const [error, setError] = useState<Error | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(true);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabaseRest<DBProject[]>(
        'projects',
        {
          select: '*',
          order: 'sort_order.asc',
        }
      );

      if (fetchError) throw new Error(fetchError);

      if (data && data.length > 0) {
        setProjects(data.map(transformProject));
        setIsUsingFallback(false);
      }
      // If no data in DB, keep using static (already set)
    } catch (err) {
      console.warn('Database fetch failed, using static content:', err);
      setError(err as Error);
      // Keep using static data - already set as initial state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch from DB in background after initial render
    fetchProjects();
  }, [fetchProjects]);

  return { projects, isLoading, error, isUsingFallback, refetch: fetchProjects };
}

// Hook for getting a single project by slug
export function useProject(slug: string): {
  project: Project | null;
  isLoading: boolean;
  error: Error | null;
} {
  // Start with static data immediately
  const staticProject = STATIC_PROJECTS.find((p) => p.slug === slug) || null;
  const [project, setProject] = useState<Project | null>(staticProject);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!slug) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabaseRest<DBProject[]>(
          'projects',
          {
            select: '*',
            filter: `slug=eq.${slug}`,
            limit: 1,
          }
        );

        if (fetchError) throw new Error(fetchError);

        if (data && data.length > 0) {
          setProject(transformProject(data[0]));
        }
        // If not in DB, keep using static (already set)
      } catch (err) {
        console.warn('Database fetch failed, using static content:', err);
        setError(err as Error);
        // Keep using static - already set
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  return { project, isLoading, error };
}
