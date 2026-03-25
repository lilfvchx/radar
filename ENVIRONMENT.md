# Environment Configuration

Radar requires specific environment variables to function correctly, particularly for intelligence briefings and external data ingestion.

## Core Variables
- `PORT`: Server port (default: 3001)
- `OPENROUTER_API_KEY`: Key for generating LLM-based intelligence briefings. If omitted, a mock brief is generated.

## Argentina Crime / OSINT Variables
- `APIFY_TOKEN`: Token for Apify Web Scraper Actor (only used when explicitly enabled and permitted).
- `AR_CRIME_DB_URL`: Path to SQLite DB (e.g., `sqlite:./data/ar_crime.sqlite`) or Postgres URL.
- `AR_GEOREF_BASE_URL`: API Base URL for GeoRef (default: `https://apis.datos.gob.ar/georef/api`).
- `AR_CRIME_INGEST_ENABLE_MEDIA_SCRAPERS`: Feature flag `true`/`false`. If false, only official APIs/RSS are used.
- `AR_CRIME_RATE_LIMIT_RPS`: Requests per second limit for general scrapers (default `2`).
- `AR_CRIME_SCHEDULER_ENABLED`: Enable background ingestion jobs (`true`/`false`).
