import Parser from 'rss-parser';

export type RssItem = {
  title: string;
  link: string;
  publishedAt?: string;
  summary?: string;
  sourceName: string;
};

const parser = new Parser({ timeout: 10000 });

export async function fetchRss(url: string, sourceName: string): Promise<RssItem[]> {
  const feed = await parser.parseURL(url);
  return (feed.items ?? [])
    .map((item) => ({
      title: (item.title ?? '').trim(),
      link: (item.link ?? '').trim(),
      publishedAt: item.isoDate ?? item.pubDate,
      summary: (item.contentSnippet ?? item.content ?? item.summary ?? '').slice(0, 500),
      sourceName,
    }))
    .filter((it) => it.title && it.link);
}
