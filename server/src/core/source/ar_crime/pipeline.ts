import { randomUUID } from 'crypto';
import { fetchRss } from './connectors/rss';
import { extractCrimeType, extractLocations, extractWeaponPresence } from './normalize/event';
import { normalizeAddress } from './enrich/georef';
import { generateContentHash, generateDedupeKey } from './dedupe/dedupe';
import { calculateConfidence, calculateSeverity } from './score/scoring';
import {
  insertSourceItem,
  upsertCrimeEvent,
  getSourceItemByHash,
  getCrimeEventByDedupeKey,
  insertIngestRun,
  updateIngestRun,
} from './store/db';
import { SourceItem, CrimeEvent, IngestRun } from './types';

const RSS_FEEDS = [
  { url: 'https://www.fiscales.gob.ar/feed/', name: 'MPF Nacion' },
  { url: 'https://www.policiafederal.gov.ar/rss/', name: 'PFA' },
  // Adding a general news RSS for demonstration; in reality needs legal checks
  { url: 'https://www.pagina12.com.ar/rss/secciones/sociedad/notas', name: 'Pagina/12 (Sociedad)' },
];

export async function runIngestionPipeline() {
  const runId = randomUUID();
  const run: IngestRun = {
    run_id: runId,
    source_name: 'Aggregate_RSS_MVP',
    started_at: new Date().toISOString(),
    status: 'running',
    items_fetched: 0,
    items_processed: 0,
  };

  insertIngestRun(run);
  console.log(`[ArCrime] Starting ingestion pipeline run ${runId}`);

  try {
    for (const feed of RSS_FEEDS) {
      console.log(`[ArCrime] Fetching ${feed.name}...`);
      const items = await fetchRss(feed.url, feed.name);
      run.items_fetched += items.length;

      for (const item of items) {
        // Generate a content hash to dedupe raw sources
        const hash = generateContentHash(item.title, item.link);

        // Skip if we already processed this exact article
        if (getSourceItemByHash(hash)) continue;

        const sourceId = randomUUID();
        const sourceItem: SourceItem = {
          source_item_id: sourceId,
          source_type: 'rss',
          source_name: item.sourceName,
          source_url: item.link,
          title: item.title,
          published_at: item.publishedAt,
          fetched_at: new Date().toISOString(),
          raw_payload: JSON.stringify(item),
          content_hash: hash,
        };

        insertSourceItem(sourceItem);

        // --- Processing to Event ---
        const eventText = `${item.title} ${item.summary || ''}`;
        const eventType = extractCrimeType(eventText);

        // Skip purely non-crime news
        if (eventType === 'unknown' && !item.sourceName.includes('MPF')) continue;

        const locationText = extractLocations(eventText);
        const geoInfo = locationText ? await normalizeAddress(locationText) : null;
        const weapon = extractWeaponPresence(eventText);

        const dedupeKey = generateDedupeKey(item.title, locationText, item.publishedAt || null);

        // Check if event already exists to merge sources
        const existingEvent = getCrimeEventByDedupeKey(dedupeKey);
        const sourceIds = existingEvent ? [...new Set([...existingEvent.source_ids, sourceId])] : [sourceId];

        const partialEvent: Partial<CrimeEvent> = {
          event_time: item.publishedAt || new Date().toISOString(),
          event_type: eventType,
          summary: item.summary || item.title,
          location_text: locationText || undefined,
          lat: geoInfo?.lat,
          lon: geoInfo?.lon,
          admin_area_provincia: geoInfo?.provincia,
          admin_area_municipio: geoInfo?.municipio,
          weapon_present: weapon,
          geocode_confidence: geoInfo?.lat ? 0.9 : undefined,
        };

        const severity = calculateSeverity(partialEvent);
        const confidence = calculateConfidence(partialEvent, sourceIds.length);

        const newEvent: CrimeEvent = {
          event_id: existingEvent?.event_id || randomUUID(),
          event_time: partialEvent.event_time,
          event_type: partialEvent.event_type as CrimeEvent['event_type'],
          summary: partialEvent.summary as string,
          location_text: partialEvent.location_text,
          lat: partialEvent.lat,
          lon: partialEvent.lon,
          geocode_confidence: partialEvent.geocode_confidence,
          admin_area_provincia: partialEvent.admin_area_provincia,
          admin_area_municipio: partialEvent.admin_area_municipio,
          weapon_present: partialEvent.weapon_present,
          source_ids: sourceIds,
          severity_score: severity,
          confidence_score: confidence,
          dedupe_key: dedupeKey,
          labels: [],
          created_at: existingEvent?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        upsertCrimeEvent(newEvent);
        run.items_processed++;
      }
    }

    run.status = 'success';
    run.completed_at = new Date().toISOString();
  } catch (error: any) {
    console.error('[ArCrime] Ingestion pipeline failed:', error);
    run.status = 'failed';
    run.completed_at = new Date().toISOString();
    run.error_message = error.message;
  } finally {
    updateIngestRun(run);
    console.log(`[ArCrime] Finished pipeline run ${runId}. Processed: ${run.items_processed}`);
  }
}
