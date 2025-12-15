import { useState, useEffect, useCallback } from 'react';
import { supabaseRest, Tables } from '../lib/supabase';
import { EXPERIENCE as STATIC_EXPERIENCE } from '../data/timeline';

type DBExperience = Tables<'experience'>;

// Frontend experience type
export interface Experience {
  id: number;
  company: string;
  role: string;
  date: string;
  location: string;
  desc?: string;
  skills: string[];
  type: 'SWE' | 'ML' | 'VIDEO' | 'HYBRID' | 'OTHER';
}

// Transform database row to frontend type
const transformExperience = (dbExp: DBExperience): Experience => ({
  id: dbExp.id,
  company: dbExp.company,
  role: dbExp.role,
  date: dbExp.date_range,
  location: dbExp.location,
  desc: dbExp.description ?? undefined,
  skills: dbExp.skills ?? [],
  type: dbExp.type as Experience['type'],
});

interface UseExperienceResult {
  experience: Experience[];
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
export function useExperience(): UseExperienceResult {
  // Start with static data immediately
  const [experience, setExperience] = useState<Experience[]>(STATIC_EXPERIENCE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(true);

  const fetchExperience = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabaseRest<DBExperience[]>(
        'experience',
        {
          select: '*',
          order: 'sort_order.asc',
        }
      );

      if (fetchError) throw new Error(fetchError);

      if (data && data.length > 0) {
        setExperience(data.map(transformExperience));
        setIsUsingFallback(false);
      }
      // If no data in DB, keep using static
    } catch (err) {
      console.warn('Database fetch failed, using static content:', err);
      setError(err as Error);
      // Keep using static data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperience();
  }, [fetchExperience]);

  return { experience, isLoading, error, isUsingFallback, refetch: fetchExperience };
}
