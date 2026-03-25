export type CrimeEventSource = {
  sourceName: string;
  title: string;
  url: string;
  publishedAt?: string;
};

export type CrimeEvent = {
  event_id: string;
  event_time?: string;
  event_type: string;
  summary: string;
  location_text?: string;
  geo?: { lat?: number; lon?: number };
  severity_score: number;
  confidence_score: number;
  source_ids: string[];
};

export type CrimeEventQuery = {
  bbox: [number, number, number, number];
  minSeverity?: number;
  minConfidence?: number;
  types?: string[];
};
