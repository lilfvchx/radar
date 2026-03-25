import crypto from 'crypto';
import type { CrimeEvent, IngestRun, SourceItem } from '../types';
import { query } from '../../../db/postgres';

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function contentHash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function appendSourceItems(items: SourceItem[]): Promise<SourceItem[]> {
  if (items.length === 0) return items;

  for (const item of items) {
    try {
      await query(
        `
        INSERT INTO source_item (
          source_item_id, source_type, source_name, source_url, title,
          published_at, fetched_at, snippet, raw_payload, content_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (content_hash, source_url) DO NOTHING
        `,
        [
          item.source_item_id,
          item.source_type,
          item.source_name,
          item.source_url,
          item.title,
          item.published_at ? new Date(item.published_at) : null,
          new Date(item.fetched_at),
          item.snippet,
          item.raw_payload ? JSON.stringify(item.raw_payload) : null,
          item.content_hash,
        ],
      );
    } catch (e) {
      console.error('Failed to insert source_item', e);
    }
  }

  return items;
}

export async function upsertCrimeEvents(events: CrimeEvent[]): Promise<void> {
  if (events.length === 0) return;

  for (const next of events) {
    try {
      await query(
        `
        INSERT INTO crime_event (
          event_id, event_time, event_type, event_subtype, summary, location_text,
          geo, admin_area, victim_count, suspect_count, weapon_present,
          source_ids, severity_score, confidence_score, dedupe_key, labels, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT (dedupe_key) DO UPDATE SET
          source_ids = (
            SELECT jsonb_agg(DISTINCT elem)
            FROM jsonb_array_elements_text(crime_event.source_ids || EXCLUDED.source_ids) AS elem
          ),
          updated_at = EXCLUDED.updated_at,
          confidence_score = GREATEST(crime_event.confidence_score, EXCLUDED.confidence_score),
          severity_score = GREATEST(crime_event.severity_score, EXCLUDED.severity_score),
          labels = (
            SELECT jsonb_agg(DISTINCT elem)
            FROM jsonb_array_elements_text(crime_event.labels || EXCLUDED.labels) AS elem
          ),
          geo = COALESCE(crime_event.geo, EXCLUDED.geo)
        `,
        [
          next.event_id,
          next.event_time ? new Date(next.event_time) : null,
          next.event_type,
          next.event_subtype || null,
          next.summary,
          next.location_text || null,
          next.geo ? JSON.stringify(next.geo) : null,
          next.admin_area ? JSON.stringify(next.admin_area) : null,
          next.victim_count ?? null,
          next.suspect_count ?? null,
          next.weapon_present ?? null,
          JSON.stringify(next.source_ids),
          next.severity_score,
          next.confidence_score,
          next.dedupe_key,
          JSON.stringify(next.labels),
          new Date(next.created_at),
          new Date(next.updated_at),
        ],
      );
    } catch (e) {
      console.error('Failed to upsert crime_event', e);
    }
  }
}

export async function createIngestRun(): Promise<IngestRun> {
  const run: IngestRun = {
    ingest_run_id: createId('run'),
    started_at: new Date().toISOString(),
    status: 'running',
    source_count: 0,
    event_count: 0,
    errors: [],
  };

  await query(
    `
    INSERT INTO ingest_run (
      ingest_run_id, started_at, status, source_count, event_count, errors
    ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      run.ingest_run_id,
      new Date(run.started_at),
      run.status,
      run.source_count,
      run.event_count,
      JSON.stringify(run.errors),
    ],
  );

  return run;
}

export async function finalizeIngestRun(runId: string, data: Partial<IngestRun>): Promise<void> {
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.status) {
    updates.push(`status = $${idx++}`);
    values.push(data.status);
  }
  if (data.source_count !== undefined) {
    updates.push(`source_count = $${idx++}`);
    values.push(data.source_count);
  }
  if (data.event_count !== undefined) {
    updates.push(`event_count = $${idx++}`);
    values.push(data.event_count);
  }
  if (data.errors) {
    updates.push(`errors = $${idx++}`);
    values.push(JSON.stringify(data.errors));
  }

  updates.push(`finished_at = $${idx++}`);
  values.push(new Date());

  values.push(runId); // where clause

  const queryText = `
    UPDATE ingest_run
    SET ${updates.join(', ')}
    WHERE ingest_run_id = $${idx}
  `;

  await query(queryText, values);
}

export async function getCrimeEvents(): Promise<CrimeEvent[]> {
  const res = await query(`
    SELECT * FROM crime_event
    ORDER BY created_at DESC
  `);

  return res.rows.map(row => ({
    ...row,
    source_ids: row.source_ids || [],
    labels: row.labels || [],
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    event_time: row.event_time ? row.event_time.toISOString() : undefined,
    severity_score: Number(row.severity_score),
    confidence_score: Number(row.confidence_score)
  }));
}

export async function getCrimeEvent(id: string): Promise<CrimeEvent | undefined> {
  const res = await query(`SELECT * FROM crime_event WHERE event_id = $1`, [id]);
  if (res.rows.length === 0) return undefined;

  const row = res.rows[0];
  return {
    ...row,
    source_ids: row.source_ids || [],
    labels: row.labels || [],
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    event_time: row.event_time ? row.event_time.toISOString() : undefined,
    severity_score: Number(row.severity_score),
    confidence_score: Number(row.confidence_score)
  };
}

export async function getSourceItems(): Promise<SourceItem[]> {
  const res = await query(`
    SELECT * FROM source_item
    ORDER BY fetched_at DESC
  `);

  return res.rows.map(row => ({
    ...row,
    published_at: row.published_at ? row.published_at.toISOString() : undefined,
    fetched_at: row.fetched_at.toISOString(),
  }));
}
