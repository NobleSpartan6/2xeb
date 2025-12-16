import { useState, useCallback } from 'react';
import { PROJECTS as STATIC_PROJECTS } from '../data/projects';
import { Project } from '../lib/types';

interface UseProjectsResult {
  projects: Project[];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
  refetch: () => Promise<void>;
}

/**
 * Returns static project data only.
 * Database integration is disabled - all projects come from static TypeScript data.
 */
export function useProjects(): UseProjectsResult {
  // Use static data only
  const [projects] = useState<Project[]>(STATIC_PROJECTS);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [isUsingFallback] = useState(true);

  const refetch = useCallback(async () => {
    // No-op: static data doesn't need refetching
    return Promise.resolve();
  }, []);

  return { projects, isLoading, error, isUsingFallback, refetch };
}

// Hook for getting a single project by slug
export function useProject(slug: string): {
  project: Project | null;
  isLoading: boolean;
  error: Error | null;
} {
  // Use static data only
  const project = STATIC_PROJECTS.find((p) => p.slug === slug) || null;
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  return { project, isLoading, error };
}
