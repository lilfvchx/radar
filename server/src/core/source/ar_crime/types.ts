export type SourceType = 'rss' | 'ckan_resource' | 'html' | 'apify_dataset_item';

export interface SourceItem {
  source_item_id: string;
  source_type: SourceType;
  source_name: string;
  source_url: string;
  title: string;
  published_at?: string;
  fetched_at: string;
  snippet?: string;
  raw_payload?: Record<string, unknown>;
  content_hash: string;
}

export type EventType =
  | 'homicide'
  | 'robbery'
  | 'assault'
  | 'kidnapping'
  | 'drug_trafficking'
  | 'illegal_firearm'
  | 'gender_violence'
  | 'human_trafficking'
  | 'cybercrime'
  | 'unknown';

export interface CrimeEvent {
  event_id: string;
  event_time?: string;
  event_type: EventType;
  event_subtype?: string;
  summary: string;
  location_text?: string;
  geo?: { lat?: number; lon?: number; geocode_confidence?: number; precision_m?: number };
  admin_area?: {
    provincia?: string;
    departamento?: string;
    municipio?: string;
    localidad?: string;
  };
  victim_count?: number;
  suspect_count?: number;
  weapon_present?: boolean;
  source_ids: string[];
  severity_score: number;
  confidence_score: number;
  dedupe_key: string;
  labels: string[];
  created_at: string;
  updated_at: string;
}

export interface IngestRun {
  ingest_run_id: string;
  started_at: string;
  finished_at?: string;
  status: 'running' | 'ok' | 'error';
  source_count: number;
  event_count: number;
  errors: string[];
}

export interface StoreData {
  source_items: SourceItem[];
  crime_events: CrimeEvent[];
  ingest_runs: IngestRun[];
}
