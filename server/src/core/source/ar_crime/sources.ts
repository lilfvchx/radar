export interface SourcePolicy {
  sourceName: string;
  feedUrl: string;
  sourceType: 'official' | 'institutional' | 'media';
  robotsUrl: string;
  termsUrl?: string;
  license?: string;
  allowed: boolean;
  rateLimitRps: number;
  notes: string;
}

export const AR_CRIME_SOURCES: SourcePolicy[] = [
  {
    sourceName: 'Ministerio Público Fiscal CABA',
    feedUrl: 'https://mpfciudad.gob.ar/rss.xml',
    sourceType: 'institutional',
    robotsUrl: 'https://mpfciudad.gob.ar/robots.txt',
    allowed: true,
    rateLimitRps: 0.3,
    notes: 'RSS-first institucional.',
  },
  {
    sourceName: 'Página12 Política RSS',
    feedUrl: 'https://www.pagina12.com.ar/rss/portada',
    sourceType: 'media',
    robotsUrl: 'https://www.pagina12.com.ar/robots.txt',
    termsUrl: 'https://www.pagina12.com.ar/terminos-y-condiciones',
    allowed: false,
    rateLimitRps: 0.1,
    notes: 'Requiere revisión legal/licencia antes de habilitar en producción.',
  },
];

export function getEnabledSources() {
  const includeMedia = process.env.AR_CRIME_INGEST_ENABLE_MEDIA_SCRAPERS === 'true';
  return AR_CRIME_SOURCES.filter(
    (source) => source.allowed || (includeMedia && source.sourceType === 'media'),
  );
}
