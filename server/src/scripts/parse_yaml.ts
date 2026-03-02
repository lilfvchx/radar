import fs from 'fs';
import yaml from 'yaml';
import path from 'path';

// This script runs relative to the server/ package root
const YAML_FILE_PATH = path.join(__dirname, '..', '..', '..', 'all.sources.rss.yaml');
const OUTPUT_JSON_PATH = path.join(__dirname, '..', 'news_feeds.json'); // save directly into src

async function parseFeeds() {
    console.log(`Loading ${YAML_FILE_PATH}...`);
    try {
        const fileContent = fs.readFileSync(YAML_FILE_PATH, 'utf8');
        const data = yaml.parse(fileContent);

        console.log(`Loaded YAML with ${Object.keys(data).length} countries.`);

        // We will restructure this slightly to be a flat Country -> URL list AND a Country -> Category mapping
        // to make querying as fast as possible.
        // We will output exactly the object, eliminating nulls and blanks.
        const cleaned: Record<string, Record<string, string[]>> = {};

        let counter = 0;
        for (const [country, categories] of Object.entries(data as any)) {
            const countryStr = country.toUpperCase().replace(/ /g, '_');
            cleaned[countryStr] = {};

            for (const [category, feeds] of Object.entries(categories as any)) {
                if (feeds && Array.isArray(feeds)) {
                    const validFeeds = feeds.filter(f => f && typeof f === 'string' && f.startsWith('http'));
                    if (validFeeds.length > 0) {
                        cleaned[countryStr][category] = validFeeds;
                        counter += validFeeds.length;
                    }
                }
            }
        }

        fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(cleaned, null, 2));
        console.log(`Saved output to ${OUTPUT_JSON_PATH} with ${counter} valid feeds.`);

    } catch (e) {
        console.error("Error parsing YAML:", e);
    }
}

parseFeeds();
