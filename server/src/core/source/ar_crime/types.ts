import { z } from 'zod';

export const sourceItemSchema = z.object({
  source_item_id: z.string().uuid(),
  source_type: z.enum(['rss', 'html', 'ckan_resource', 'apify_dataset_item', 'wms_feature']),
  source_name: z.string(),
  source_url: z.string(),
  title: z.string(),
  published_at: z.string().nullable().optional(), // ISO datetime
  fetched_at: z.string(), // ISO datetime
  raw_payload: z.string().nullable().optional(), // JSON string
  content_hash: z.string(),
});

export type SourceItem = z.infer<typeof sourceItemSchema>;

export const crimeEventSchema = z.object({
  event_id: z.string().uuid(),
  event_time: z.string().nullable().optional(),
  event_time_start: z.string().nullable().optional(),
  event_time_end: z.string().nullable().optional(),
  event_type: z.enum([
    'homicide',
    'robbery',
    'assault',
    'kidnapping',
    'drug_trafficking',
    'illegal_firearm',
    'gender_violence',
    'human_trafficking',
    'cybercrime',
    'unknown',
  ]),
  event_subtype: z.string().nullable().optional(),
  summary: z.string(),
  location_text: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
  precision_m: z.number().nullable().optional(),
  geocode_confidence: z.number().nullable().optional(),
  admin_area_provincia: z.string().nullable().optional(),
  admin_area_departamento: z.string().nullable().optional(),
  admin_area_municipio: z.string().nullable().optional(),
  admin_area_localidad: z.string().nullable().optional(),
  victim_count: z.number().nullable().optional(),
  suspect_count: z.number().nullable().optional(),
  weapon_present: z.boolean().nullable().optional(),
  source_ids: z.array(z.string().uuid()),
  severity_score: z.number(), // 0-100
  confidence_score: z.number(), // 0-100
  dedupe_key: z.string(),
  labels: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CrimeEvent = z.infer<typeof crimeEventSchema>;

export const ingestRunSchema = z.object({
  run_id: z.string().uuid(),
  source_name: z.string(),
  started_at: z.string(),
  completed_at: z.string().nullable().optional(),
  status: z.enum(['running', 'success', 'failed']),
  items_fetched: z.number().default(0),
  items_processed: z.number().default(0),
  error_message: z.string().nullable().optional(),
});

export type IngestRun = z.infer<typeof ingestRunSchema>;

export interface CrimeEventQuery {
  bbox?: [number, number, number, number]; // [west, south, east, north]
  from?: string; // ISO datetime
  to?: string; // ISO datetime
  types?: string[];
  minSeverity?: number;
  minConfidence?: number;
}
