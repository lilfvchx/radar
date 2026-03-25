import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { CrimeEvent, IngestRun, SourceItem, StoreData } from '../types';

const STORE_PATH = process.env.AR_CRIME_DB_URL?.startsWith('sqlite:')
  ? process.env.AR_CRIME_DB_URL.replace('sqlite:', '')
  : path.join(process.cwd(), 'server', 'data', 'ar_crime_store.json');

const EMPTY_STORE: StoreData = { source_items: [], crime_events: [], ingest_runs: [] };

function ensureStoreFile() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH))
    fs.writeFileSync(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2));
}

function readStore(): StoreData {
  ensureStoreFile();
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  try {
    return JSON.parse(raw) as StoreData;
  } catch {
    return { ...EMPTY_STORE };
  }
}

function writeStore(data: StoreData) {
  ensureStoreFile();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function contentHash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function appendSourceItems(items: SourceItem[]) {
  const db = readStore();
  db.source_items.push(...items);
  writeStore(db);
  return items;
}

export function upsertCrimeEvents(events: CrimeEvent[]) {
  const db = readStore();

  for (const next of events) {
    const existing = db.crime_events.find((ev) => ev.dedupe_key === next.dedupe_key);
    if (existing) {
      existing.source_ids = Array.from(new Set([...existing.source_ids, ...next.source_ids]));
      existing.updated_at = new Date().toISOString();
      existing.confidence_score = Math.max(existing.confidence_score, next.confidence_score);
      existing.severity_score = Math.max(existing.severity_score, next.severity_score);
      existing.labels = Array.from(new Set([...existing.labels, ...next.labels]));
      if (!existing.geo?.lat && next.geo?.lat) existing.geo = next.geo;
      continue;
    }
    db.crime_events.push(next);
  }

  writeStore(db);
}

export function createIngestRun(): IngestRun {
  const db = readStore();
  const run: IngestRun = {
    ingest_run_id: createId('run'),
    started_at: new Date().toISOString(),
    status: 'running',
    source_count: 0,
    event_count: 0,
    errors: [],
  };
  db.ingest_runs.push(run);
  writeStore(db);
  return run;
}

export function finalizeIngestRun(runId: string, data: Partial<IngestRun>) {
  const db = readStore();
  const run = db.ingest_runs.find((r) => r.ingest_run_id === runId);
  if (!run) return;
  Object.assign(run, data, { finished_at: new Date().toISOString() });
  writeStore(db);
}

export function getCrimeEvents() {
  return readStore().crime_events;
}

export function getCrimeEvent(id: string) {
  return readStore().crime_events.find((e) => e.event_id === id);
}

export function getSourceItems() {
  return readStore().source_items;
}
