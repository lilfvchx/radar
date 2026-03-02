import { useMutation } from '@tanstack/react-query';
import type { NewsItem } from './useOsintNews';

interface IntelBriefRequest {
    news: NewsItem[];
    lat: number;
    lon: number;
}

interface IntelBriefResponse {
    brief: string;
}

export function useIntelBrief() {
    return useMutation({
        mutationFn: async (reqData: IntelBriefRequest) => {
            const res = await fetch('http://localhost:3001/api/geo/intel-brief', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reqData)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Failed to generate brief: ${res.statusText}`);
            }

            return (await res.json()) as IntelBriefResponse;
        }
    });
}
