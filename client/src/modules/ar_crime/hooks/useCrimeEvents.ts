import { useEffect, useState } from 'react';
import type { CrimeEvent, CrimeEventQuery } from '../types';

export function useCrimeEvents(query: CrimeEventQuery) {
  const [data, setData] = useState<CrimeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query.bbox.length === 4) params.set('bbox', query.bbox.join(','));
      if (query.from) params.set('from', query.from);
      if (query.to) params.set('to', query.to);
      if (query.types?.length) params.set('types', query.types.join(','));
      if (query.minSeverity != null) params.set('minSeverity', String(query.minSeverity));
      if (query.minConfidence != null) params.set('minConfidence', String(query.minConfidence));

      try {
        const res = await fetch(`/api/ar-crime/events?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { events: CrimeEvent[] };
        if (!cancelled) {
          // Filter to only items with coordinates to be displayed on map
          setData((json.events || []).filter(e => e.lat != null && e.lon != null));
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [
    query.bbox.join(','),
    query.from,
    query.to,
    (query.types ?? []).join(','),
    query.minSeverity,
    query.minConfidence,
  ]);

  return { data, loading, error };
}
