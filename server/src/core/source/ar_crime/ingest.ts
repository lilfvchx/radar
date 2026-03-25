import { fetchRss } from './connectors/rss';
import {
  createId,
  contentHash,
  appendSourceItems,
  upsertCrimeEvents,
  createIngestRun,
  finalizeIngestRun,
} from './store/db';
import { inferEventType, extractLocationText } from './normalize/event';
import { normalizeWithGeoRef } from './enrich/georef';
import { makeDedupeKey } from './dedupe/dedupe';
import { computeConfidenceScore, computeSeverityScore } from './score/scoring';
import { getEnabledSources } from './sources';
import type { CrimeEvent, SourceItem } from './types';

function sourceReliability(sourceName: string): number {
  const normalized = sourceName.toLowerCase();
  if (
    normalized.includes('ministerio') ||
    normalized.includes('fiscal') ||
    normalized.includes('gob')
  )
    return 70;
  return 50;
}

export async function runArCrimeIngest() {
  const run = createIngestRun();

  try {
    const allSourceItems: SourceItem[] = [];
    const allEvents: CrimeEvent[] = [];

    for (const source of getEnabledSources()) {
      try {
        const items = await fetchRss(source.feedUrl, source.sourceName);

        for (const item of items.slice(0, 15)) {
          const sourceId = createId('src');
          const payload = `${item.title}|${item.link}|${item.publishedAt ?? ''}`;
          const sourceItem: SourceItem = {
            source_item_id: sourceId,
            source_type: 'rss',
            source_name: source.sourceName,
            source_url: item.link,
            title: item.title,
            published_at: item.publishedAt,
            fetched_at: new Date().toISOString(),
            snippet: item.summary,
            content_hash: contentHash(payload),
          };
          allSourceItems.push(sourceItem);

          const locationText = extractLocationText(`${item.title}. ${item.summary ?? ''}`);
          const geo = locationText
            ? await normalizeWithGeoRef(locationText)
            : { geocode_confidence: 20 };
          const eventType = inferEventType(`${item.title} ${item.summary ?? ''}`);
          const severity = computeSeverityScore(eventType, item.title);
          const confidence = computeConfidenceScore({
            sourceReliability: sourceReliability(source.sourceName),
            corroboratedSources: 1,
            geocodeConfidence: geo.geocode_confidence,
          });

          const event: CrimeEvent = {
            event_id: createId('evt'),
            event_time: item.publishedAt,
            event_type: eventType,
            summary: item.title,
            location_text: locationText,
            geo: {
              lat: geo.lat,
              lon: geo.lon,
              geocode_confidence: geo.geocode_confidence,
              precision_m: geo.lat ? 1000 : undefined,
            },
            admin_area: {
              provincia: geo.provincia,
              municipio: geo.municipio,
              localidad: geo.localidad,
            },
            source_ids: [sourceId],
            severity_score: severity,
            confidence_score: confidence,
            dedupe_key: makeDedupeKey(
              item.title,
              locationText,
              item.publishedAt ?? new Date().toISOString(),
            ),
            labels: [eventType],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          allEvents.push(event);
        }
      } catch (error: any) {
        console.warn('[AR Crime] source failed', source.sourceName, error?.message ?? error);
      }
    }

    appendSourceItems(allSourceItems);
    upsertCrimeEvents(allEvents);

    finalizeIngestRun(run.ingest_run_id, {
      status: 'ok',
      source_count: allSourceItems.length,
      event_count: allEvents.length,
    });

    return {
      sourceCount: allSourceItems.length,
      eventCount: allEvents.length,
      runId: run.ingest_run_id,
    };
  } catch (error: any) {
    finalizeIngestRun(run.ingest_run_id, {
      status: 'error',
      errors: [String(error?.message ?? error)],
    });
    throw error;
  }
}
