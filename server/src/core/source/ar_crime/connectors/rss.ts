import Parser from 'rss-parser';

export type RssItem = {
  title: string;
  link: string;
  publishedAt?: string; // ISO
  summary?: string;
  sourceName: string;
};

const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded'],
      ['description', 'description'],
    ],
  },
  timeout: 10000,
});

export async function fetchRss(
  url: string,
  sourceName: string,
  timeoutMs = 10000,
): Promise<RssItem[]> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RadarCrimeOSINT/0.1 (+contact: security@example.com)',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1',
      },
    });

    if (!res.ok) {
      console.warn(`[ArCrime] RSS fetch failed ${res.status} for ${url}`);
      return [];
    }

    const xml = await res.text();
    const parsed = await rssParser.parseString(xml);

    const results: RssItem[] = [];
    for (const item of parsed.items || []) {
      const title = (item.title || '').trim();
      const link = (item.link || item.guid || '').trim();

      if (!title || !link) continue;

      const rawSummary =
        item.contentSnippet || item.description || item.contentEncoded || item.content || '';
      const summary = rawSummary.replace(/<[^>]*>/g, '').trim().slice(0, 500);

      const pubDate = item.isoDate || item.pubDate || undefined;

      results.push({
        title,
        link,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
        summary,
        sourceName,
      });
    }

    return results;
  } catch (error) {
    console.error(`[ArCrime] Error fetching RSS ${url}:`, error);
    return [];
  } finally {
    clearTimeout(t);
  }
}
