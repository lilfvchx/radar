CREATE TABLE IF NOT EXISTS source_item (
  source_item_id VARCHAR(255) PRIMARY KEY,
  source_type VARCHAR(50) NOT NULL,
  source_name VARCHAR(255) NOT NULL,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  published_at TIMESTAMP,
  fetched_at TIMESTAMP NOT NULL,
  snippet TEXT,
  raw_payload JSONB,
  content_hash VARCHAR(255) NOT NULL,
  UNIQUE(content_hash, source_url)
);

CREATE TABLE IF NOT EXISTS crime_event (
  event_id VARCHAR(255) PRIMARY KEY,
  event_time TIMESTAMP,
  event_type VARCHAR(50) NOT NULL,
  event_subtype VARCHAR(50),
  summary TEXT NOT NULL,
  location_text TEXT,
  geo JSONB,
  admin_area JSONB,
  victim_count INTEGER,
  suspect_count INTEGER,
  weapon_present BOOLEAN,
  source_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  severity_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  dedupe_key VARCHAR(255) NOT NULL UNIQUE,
  labels JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingest_run (
  ingest_run_id VARCHAR(255) PRIMARY KEY,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb
);
