'use client';

import { useEffect, useState } from 'react';
import { fetchFlags } from '@/lib/flags';

/**
 * Hook to fetch and manage feature flags
 * Usage: const flags = useFlags(['damage_photo_upload', 'ai_damage_detection']);
 */
export function useFlags(flagKeys: string[]): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>(() =>
    flagKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadFlags() {
      setLoading(true);
      const results = await fetchFlags(flagKeys);

      if (mounted) {
        setFlags(results);
        setLoading(false);
      }
    }

    loadFlags();

    return () => {
      mounted = false;
    };
  }, [flagKeys.join(',')]);

  return flags;
}
