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
      params.set('bbox', query.bbox.join(','));
      if (query.minSeverity != null) params.set('minSeverity', String(query.minSeverity));
      if (query.minConfidence != null) params.set('minConfidence', String(query.minConfidence));
      if (query.types?.length) params.set('types', query.types.join(','));

      try {
        const res = await fetch(`/api/ar-crime/events?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { events: CrimeEvent[] };
        if (!cancelled) setData(json.events);
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    const i = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [query.bbox.join(','), query.minConfidence, query.minSeverity, (query.types ?? []).join(',')]);

  return { data, loading, error };
}
