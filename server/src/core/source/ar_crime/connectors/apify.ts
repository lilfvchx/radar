type ApifyRunResponse = { data: { id: string; defaultDatasetId: string } };

export async function runApifyWebScraper(params: {
  token: string;
  startUrls: string[];
  pseudoUrls?: string[];
  maxRequestsPerCrawl?: number;
}) {
  const url = `https://api.apify.com/v2/acts/apify~web-scraper/runs?token=${encodeURIComponent(
    params.token,
  )}`;

  const body = {
    startUrls: params.startUrls.map((u) => ({ url: u })),
    pseudoUrls: params.pseudoUrls?.map((u) => ({ purl: u })) ?? [],
    maxRequestsPerCrawl: params.maxRequestsPerCrawl ?? 100,
    respectRobotsTxtFile: true, // IMPORTANT: explicitly enable
    useChrome: false,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'RadarCrimeOSINT/0.1' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify run failed ${res.status}: ${text}`);
  }
  const json = (await res.json()) as ApifyRunResponse;

  return { runId: json.data.id, datasetId: json.data.defaultDatasetId };
}

export async function getApifyDataset(datasetId: string, token: string): Promise<any[]> {
  const url = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RadarCrimeOSINT/0.1' },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify dataset fetch failed ${res.status}: ${text}`);
  }

  return await res.json();
}
