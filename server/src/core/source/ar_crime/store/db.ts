import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { SourceItem, CrimeEvent, IngestRun } from '../types';

// Use environment variable or fallback to local SQLite file
const dbPathUrl = process.env.AR_CRIME_DB_URL || 'sqlite:./data/ar_crime.sqlite';
const dbPath = dbPathUrl.startsWith('sqlite:') ? dbPathUrl.slice(7) : './data/ar_crime.sqlite';

// Ensure directory exists
const resolvedPath = path.resolve(__dirname, '../../../../../', dbPath);
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Initialize database
let db: Database.Database;
try {
  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS source_items (
      source_item_id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      title TEXT NOT NULL,
      published_at TEXT,
      fetched_at TEXT NOT NULL,
      raw_payload TEXT,
      content_hash TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS crime_events (
      event_id TEXT PRIMARY KEY,
      event_time TEXT,
      event_time_start TEXT,
      event_time_end TEXT,
      event_type TEXT NOT NULL,
      event_subtype TEXT,
      summary TEXT NOT NULL,
      location_text TEXT,
      lat REAL,
      lon REAL,
      precision_m REAL,
      geocode_confidence REAL,
      admin_area_provincia TEXT,
      admin_area_departamento TEXT,
      admin_area_municipio TEXT,
      admin_area_localidad TEXT,
      victim_count INTEGER,
      suspect_count INTEGER,
      weapon_present INTEGER,
      source_ids TEXT NOT NULL, -- JSON array of strings
      severity_score INTEGER NOT NULL,
      confidence_score INTEGER NOT NULL,
      dedupe_key TEXT NOT NULL UNIQUE,
      labels TEXT NOT NULL, -- JSON array of strings
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ingest_runs (
      run_id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT NOT NULL,
      items_fetched INTEGER DEFAULT 0,
      items_processed INTEGER DEFAULT 0,
      error_message TEXT
    );
  `);
} catch (error) {
  console.error('[AR Crime DB] Initialization failed:', error);
}

// Repository Methods

export function insertSourceItem(item: SourceItem): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO source_items (
      source_item_id, source_type, source_name, source_url, title, published_at, fetched_at, raw_payload, content_hash
    ) VALUES (
      @source_item_id, @source_type, @source_name, @source_url, @title, @published_at, @fetched_at, @raw_payload, @content_hash
    )
  `);
  stmt.run(item);
}

export function getSourceItemByHash(hash: string): SourceItem | undefined {
  const stmt = db.prepare('SELECT * FROM source_items WHERE content_hash = ?');
  return stmt.get(hash) as SourceItem | undefined;
}

export function getSourceItemsByIds(ids: string[]): SourceItem[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`SELECT * FROM source_items WHERE source_item_id IN (${placeholders})`);
  return stmt.all(...ids) as SourceItem[];
}

export function upsertCrimeEvent(event: CrimeEvent): void {
  const stmt = db.prepare(`
    INSERT INTO crime_events (
      event_id, event_time, event_time_start, event_time_end, event_type, event_subtype, summary,
      location_text, lat, lon, precision_m, geocode_confidence,
      admin_area_provincia, admin_area_departamento, admin_area_municipio, admin_area_localidad,
      victim_count, suspect_count, weapon_present, source_ids, severity_score, confidence_score,
      dedupe_key, labels, created_at, updated_at
    ) VALUES (
      @event_id, @event_time, @event_time_start, @event_time_end, @event_type, @event_subtype, @summary,
      @location_text, @lat, @lon, @precision_m, @geocode_confidence,
      @admin_area_provincia, @admin_area_departamento, @admin_area_municipio, @admin_area_localidad,
      @victim_count, @suspect_count, @weapon_present, @source_ids, @severity_score, @confidence_score,
      @dedupe_key, @labels, @created_at, @updated_at
    )
    ON CONFLICT(dedupe_key) DO UPDATE SET
      event_time = excluded.event_time,
      event_type = excluded.event_type,
      summary = excluded.summary,
      lat = COALESCE(excluded.lat, crime_events.lat),
      lon = COALESCE(excluded.lon, crime_events.lon),
      source_ids = excluded.source_ids,
      severity_score = excluded.severity_score,
      confidence_score = excluded.confidence_score,
      labels = excluded.labels,
      updated_at = excluded.updated_at
  `);

  const params = {
    ...event,
    weapon_present: event.weapon_present ? 1 : 0,
    source_ids: JSON.stringify(event.source_ids),
    labels: JSON.stringify(event.labels),
  };

  stmt.run(params);
}

export function getCrimeEventByDedupeKey(key: string): CrimeEvent | undefined {
  const stmt = db.prepare('SELECT * FROM crime_events WHERE dedupe_key = ?');
  const row = stmt.get(key) as any;
  if (!row) return undefined;

  return {
    ...row,
    weapon_present: row.weapon_present === 1,
    source_ids: JSON.parse(row.source_ids),
    labels: JSON.parse(row.labels),
  };
}

export function getCrimeEvents(filters: {
  bbox?: [number, number, number, number];
  from?: string;
  to?: string;
  types?: string[];
  minSeverity?: number;
  minConfidence?: number;
}): CrimeEvent[] {
  let query = 'SELECT * FROM crime_events WHERE 1=1';
  const params: any[] = [];

  if (filters.bbox) {
    query += ' AND lat >= ? AND lat <= ? AND lon >= ? AND lon <= ?';
    params.push(filters.bbox[1], filters.bbox[3], filters.bbox[0], filters.bbox[2]);
  }
  if (filters.from) {
    query += ' AND event_time >= ?';
    params.push(filters.from);
  }
  if (filters.to) {
    query += ' AND event_time <= ?';
    params.push(filters.to);
  }
  if (filters.types && filters.types.length > 0) {
    const placeholders = filters.types.map(() => '?').join(',');
    query += ` AND event_type IN (${placeholders})`;
    params.push(...filters.types);
  }
  if (filters.minSeverity !== undefined) {
    query += ' AND severity_score >= ?';
    params.push(filters.minSeverity);
  }
  if (filters.minConfidence !== undefined) {
    query += ' AND confidence_score >= ?';
    params.push(filters.minConfidence);
  }

  query += ' ORDER BY event_time DESC LIMIT 500';

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  return rows.map((row) => ({
    ...row,
    weapon_present: row.weapon_present === 1,
    source_ids: JSON.parse(row.source_ids),
    labels: JSON.parse(row.labels),
  }));
}

export function insertIngestRun(run: IngestRun): void {
  const stmt = db.prepare(`
    INSERT INTO ingest_runs (
      run_id, source_name, started_at, completed_at, status, items_fetched, items_processed, error_message
    ) VALUES (
      @run_id, @source_name, @started_at, @completed_at, @status, @items_fetched, @items_processed, @error_message
    )
  `);
  stmt.run({
    ...run,
    completed_at: run.completed_at || null,
    error_message: run.error_message || null,
  });
}

export function updateIngestRun(run: IngestRun): void {
  const stmt = db.prepare(`
    UPDATE ingest_runs SET
      completed_at = @completed_at,
      status = @status,
      items_fetched = @items_fetched,
      items_processed = @items_processed,
      error_message = @error_message
    WHERE run_id = @run_id
  `);
  stmt.run({
    ...run,
    completed_at: run.completed_at || null,
    error_message: run.error_message || null,
  });
}
