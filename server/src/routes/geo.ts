import { Router, Request, Response } from 'express';
import Parser from 'rss-parser';
import fs from 'fs';
// @ts-ignore
import wc from 'which-country';
import iso from 'i18n-iso-countries';
// @ts-ignore
import enLocale from 'i18n-iso-countries/langs/en.json';
import path from 'path';

iso.registerLocale(enLocale);

// Load the massive JSON index once at startup
let newsFeeds: Record<string, any> = {};
try {
    const feedsPath = path.join(__dirname, '..', 'news_feeds.json');
    if (fs.existsSync(feedsPath)) {
        newsFeeds = JSON.parse(fs.readFileSync(feedsPath, 'utf8'));
        console.log('[OSINT] Loaded massive RSS database (' + Object.keys(newsFeeds).length + ' countries)');
    } else {
        console.warn('[OSINT] news_feeds.json not found at ' + feedsPath);
    }
} catch (e) {
    console.error('[OSINT] Failed to load news_feeds.json', e);
}


const rssParser = new Parser();

const router = Router();



/**
 * GET /api/geo/news
 * Fetches regional OSINT/geopolitical news feeds for a given lat/lon.
 */
router.get('/news', async (req: Request, res: Response) => {
    try {
        const lat = parseFloat(req.query.lat as string);
        const lon = parseFloat(req.query.lon as string);

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({ error: "Missing or invalid lat/lon parameters" });
        }

        // Complete GeoSentinel RSS Region Configuration
        const requestedCategory = req.query.category as string | undefined;

        let detectedRegion = 'INTERNATIONAL';
        const iso3 = wc([lon, lat]); // which-country takes [lon, lat]

        if (iso3) {
            let name = iso.getName(iso3, 'en', { select: 'official' });
            if (!name) name = iso.getName(iso3, 'en');
            if (name) {
                let search = name.toUpperCase().replace(/ /g, '_');
                // Handle variations to match JSON keys
                if (search === 'UNITED_STATES_OF_AMERICA') search = 'UNITED_STATES';
                else if (search === 'UNITED_KINGDOM_OF_GREAT_BRITAIN_AND_NORTHERN_IRELAND') search = 'UNITED_KINGDOM';
                else if (search === 'RUSSIAN_FEDERATION') search = 'RUSSIA';
                else if (search === 'SYRIAN_ARAB_REPUBLIC') search = 'SYRIA';
                else if (search.includes('KOREA,_REPUBLIC_OF')) search = 'SOUTH_KOREA';
                else if (search.includes('DEMOCRATIC_PEOPLE\'S_REPUBLIC')) search = 'NORTH_KOREA';
                else if (search.includes('IRAN')) search = 'IRAN';
                else if (search.includes('VENEZUELA')) search = 'VENEZUELA';
                else if (search.includes('BOLIVIA')) search = 'BOLIVIA';
                else if (search.includes('MOLDOVA')) search = 'MOLDOVA';
                else if (search.includes('TANZANIA')) search = 'TANZANIA';
                else if (search.includes('TAIWAN')) search = 'TAIWAN';

                if (newsFeeds[search]) {
                    detectedRegion = search;
                }
            }
        }

        console.log(`[OSINT] Region detected: ${detectedRegion} ${requestedCategory ? ' | Category: ' + requestedCategory : ''}`);

        // Build the feed list
        let feedsToFetch: string[] = [];
        const countryData = newsFeeds[detectedRegion];

        if (countryData) {
            if (requestedCategory && requestedCategory !== 'All' && countryData[requestedCategory]) {
                feedsToFetch = countryData[requestedCategory];
            } else if (requestedCategory && requestedCategory !== 'All') {
                // Category requested but not available in this country
                console.log(`[OSINT] Category ${requestedCategory} not found in ${detectedRegion}, falling back to All.`);
                Object.values(countryData).forEach((urls: any) => feedsToFetch.push(...urls));
            } else {
                // Flatten all categories if not specified or 'All'
                Object.values(countryData).forEach((urls: any) => feedsToFetch.push(...urls));
            }
        }

        // Fallback for International if no country data matched
        if (feedsToFetch.length === 0) {
            if (newsFeeds['INTERNATIONAL']) {
                Object.values(newsFeeds['INTERNATIONAL']).forEach((urls: any) => feedsToFetch.push(...urls));
            } else {
                // Hardcoded ultimate fallback
                feedsToFetch = [
                    'https://www.reuters.com/rssFeed/worldNews',
                    'https://apnews.com/hub/ap-top-news?rss=1',
                    'https://feeds.bbci.co.uk/news/world/rss.xml'
                ];
            }
        }

        // Fetch and parse randomly selected 5 feeds concurrently from the region to save time
        const shuffledFeeds = feedsToFetch.sort(() => 0.5 - Math.random()).slice(0, 5);
        const results = await Promise.allSettled(
            shuffledFeeds.map(url => rssParser.parseURL(url))
        );

        const newsItems: any[] = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const feed = result.value;
                const sourceTitle = feed.title || 'Unknown Source';

                // Take top 5 from each feed
                const topItems = (feed.items || []).slice(0, 5).map(item => ({
                    source: sourceTitle,
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    snippet: item.contentSnippet || item.content || ''
                }));

                newsItems.push(...topItems);
            } else {
                console.warn(`[OSINT] Failed to fetch RSS feed (${shuffledFeeds[index]}): ${result.reason}`);
            }
        });

        // Sort by date descending
        newsItems.sort((a, b) => {
            return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        });

        res.json({
            region_lat: lat,
            region_lon: lon,
            news: newsItems.slice(0, 15),
            intercepts: [],
        });

    } catch (e: any) {
        console.error('[Geo News Error]', e);
        res.status(500).json({ error: String(e) });
    }
});

/**
 * POST /api/geo/intel-brief
 * Generates an intelligence brief using an LLM based on provided news/OSINT items.
 */
router.post('/intel-brief', async (req: Request, res: Response) => {
    try {
        const { news, lat, lon } = req.body;

        if (!news || !Array.isArray(news)) {
            return res.status(400).json({ error: "Missing news array in request body" });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        const region = `Lat: ${Number(lat).toFixed(2)}, Lon: ${Number(lon).toFixed(2)}`;

        // If no API key, return a mock brief
        if (!apiKey) {
            return res.json({
                brief: `MOCK INTELLIGENCE BRIEF - REGION ${region}\n\n` +
                    `Analysis of ${news.length} intercepted signals indicates elevated activity in the designated sector. ` +
                    `Ammassing of intelligence suggests ongoing geopolitical posturing. Ensure OPENROUTER_API_KEY is configured in server/.env for live LLM summarization.`
            });
        }

        // Build prompt
        const headlines = news.slice(0, 10).map((n: any) => `- [${n.source}] ${n.title}`).join('\n');

        const prompt = `You are an AI intelligence analyst for a geospatial defense dashboard called INTELMAP. 
Generate a concise, clinical intelligence briefing (max 3 short paragraphs) summarizing the geopolitical situation in region ${region} based ONLY on the following intercepted headlines. 
Keep the tone professional, objective, and military-styled.

HEADLINES INTERCEPTED:
${headlines}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'INTELMAP'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash-lite-preview', // Fast, cheap model
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`LLM API Error: ${response.status} ${err}`);
        }

        const data = await response.json();
        const brief = data.choices?.[0]?.message?.content || "No intelligence could be synthesized.";

        res.json({ brief });

    } catch (e: any) {
        console.error('[Intel Brief Error]', e);
        res.status(500).json({ error: String(e) });
    }
});

export default router;
