import { useQuery } from '@tanstack/react-query';

export interface NewsItem {
    source: string;
    title: string;
    link: string;
    pubDate: string;
    snippet: string;
    type?: string;
}

export interface OsintResponse {
    region_lat: number;
    region_lon: number;
    news: NewsItem[];
    intercepts: NewsItem[];
}

export function useOsintNews(lat: number, lon: number, category: string, enabled: boolean) {
    return useQuery({
        queryKey: ['osint-news', Math.round(lat), Math.round(lon), category], // Round to 1 degree to avoid over-fetching
        queryFn: async () => {
            const res = await fetch(`http://localhost:3001/api/geo/news?lat=${lat}&lon=${lon}&category=${encodeURIComponent(category)}`);
            if (!res.ok) {
                throw new Error('Failed to fetch OSINT news');
            }
            return (await res.json()) as OsintResponse;
        },
        enabled: enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
