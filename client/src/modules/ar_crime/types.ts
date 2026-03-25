export type CrimeEvent = {
  event_id: string;
  event_time?: string;
  event_type: string;
  summary: string;
  lat?: number;
  lon?: number;
  severity_score: number;
  confidence_score: number;
  sources: Array<{ sourceName: string; title: string; url: string; publishedAt?: string }>;
  admin_area_provincia?: string;
  admin_area_municipio?: string;
};

export type CrimeEventQuery = {
  bbox: [number, number, number, number]; // [west, south, east, north]
  from?: string;
  to?: string;
  types?: string[];
  minSeverity?: number;
  minConfidence?: number;
};
