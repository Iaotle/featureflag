'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchFlags } from '@/lib/flags';

interface UseFlagsResult extends Record<string, boolean> {
  isLoading: boolean;
}

// Cache storage with timestamps
const cache = new Map<string, { data: Record<string, boolean>; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

/**
 * Hook to fetch and manage feature flags with SWR pattern
 * Returns flags with isLoading state
 * Usage: const { damage_photo_upload, isLoading } = useFlags(['damage_photo_upload']);
 */
export function useFlags(flagKeys: string[]): UseFlagsResult {
  const cacheKey = flagKeys.sort().join(',');
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    // Return cached data immediately if available
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached.data;
    }
    return flagKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {});
  });
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    // If we have fresh cache, use it and don't revalidate
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      setFlags(cached.data);
      setIsLoading(false);
      return;
    }

    // If we have stale cache, show it immediately but revalidate in background
    if (cached) {
      setFlags(cached.data);
      setIsLoading(false);
    }

    // Revalidate in background
    async function revalidate() {
      try {
        const results = await fetchFlags(flagKeys);

        if (mountedRef.current) {
          setFlags(results);
          cache.set(cacheKey, { data: results, timestamp: Date.now() });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch flags:', error);
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    revalidate();

    return () => {
      mountedRef.current = false;
    };
  }, [cacheKey]);

  return {
    ...flags,
    isLoading,
  };
}
