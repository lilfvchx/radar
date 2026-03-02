import fs from 'fs';

const original = fs.readFileSync('src/routes/geo.ts', 'utf-8');

const importStatement = `import wc from 'which-country';
import iso from 'i18n-iso-countries';
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
`;

const newBody = `        const requestedCategory = req.query.category as string | undefined;

        let detectedRegion = 'INTERNATIONAL';
        const iso3 = wc([lon, lat]); // which-country takes [lon, lat]
        
        if (iso3) {
            let name = iso.getName(iso3, 'en', {select: 'official'});
            if (!name) name = iso.getName(iso3, 'en');
            if (name) {
                let search = name.toUpperCase().replace(/ /g, '_');
                // Handle variations to match JSON keys
                if (search === 'UNITED_STATES_OF_AMERICA') search = 'UNITED_STATES';
                else if (search === 'UNITED_KINGDOM_OF_GREAT_BRITAIN_AND_NORTHERN_IRELAND') search = 'UNITED_KINGDOM';
                else if (search === 'RUSSIAN_FEDERATION') search = 'RUSSIA';
                else if (search === 'SYRIAN_ARAB_REPUBLIC') search = 'SYRIA';
                else if (search.includes('KOREA,_REPUBLIC_OF')) search = 'SOUTH_KOREA';
                else if (search.includes('DEMOCRATIC_PEOPLE\\'S_REPUBLIC')) search = 'NORTH_KOREA';
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

        console.log(\`[OSINT] Region detected: \${detectedRegion} \${requestedCategory ? ' | Category: ' + requestedCategory : ''}\`);
        
        // Build the feed list
        let feedsToFetch: string[] = [];
        const countryData = newsFeeds[detectedRegion];

        if (countryData) {
            if (requestedCategory && requestedCategory !== 'All' && countryData[requestedCategory]) {
                feedsToFetch = countryData[requestedCategory];
            } else if (requestedCategory && requestedCategory !== 'All') {
                // Category requested but not available in this country
                console.log(\`[OSINT] Category \${requestedCategory} not found in \${detectedRegion}, falling back to All.\`);
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
        }`;

// Replace imports
let finalCode = original;
if (!finalCode.includes("import wc from 'which-country'")) {
    finalCode = finalCode.replace("import Parser from 'rss-parser';", "import Parser from 'rss-parser';\n" + importStatement);
}

// Replace body
const lines = finalCode.split('\n');
const startIndex = lines.findIndex(l => l.includes('const NEWS_SOURCES: Record<string, string[]> = {'));
const endIndex = lines.findIndex(l => l.includes('const feedsToFetch = NEWS_SOURCES[detectedRegion] || NEWS_SOURCES["INTERNATIONAL"];'));

if (startIndex !== -1 && endIndex > startIndex) {
    const before = lines.slice(0, startIndex);
    const after = lines.slice(endIndex + 1);
    finalCode = before.join('\n') + '\n' + newBody + '\n' + after.join('\n');
    fs.writeFileSync('src/routes/geo.ts', finalCode);
    console.log('Successfully patched geo.ts logic map!');
} else {
    console.log('Failed to find replacement range', startIndex, endIndex);
}
