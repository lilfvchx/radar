export async function runApifyWebScraper(params: {
  token: string;
  startUrls: string[];
  pseudoUrls?: string[];
  maxRequestsPerCrawl?: number;
}) {
  const url = `https://api.apify.com/v2/acts/apify~web-scraper/runs?token=${encodeURIComponent(params.token)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'RadarCrimeOSINT/0.1',
    },
    body: JSON.stringify({
      startUrls: params.startUrls.map((u) => ({ url: u })),
      pseudoUrls: params.pseudoUrls ?? [],
      maxRequestsPerCrawl: params.maxRequestsPerCrawl ?? 100,
      respectRobotsTxtFile: true,
    }),
  });

  if (!res.ok) throw new Error(`Apify actor failed: ${res.status}`);
  const json = (await res.json()) as { data: { id: string; defaultDatasetId: string } };
  return { runId: json.data.id, datasetId: json.data.defaultDatasetId };
}
