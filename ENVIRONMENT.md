# ENVIRONMENT

## Core variables

- `OPENROUTER_API_KEY`: optional LLM briefing for `/api/ar-crime/brief`.
- `APIFY_TOKEN`: optional token for approved scrapers.
- `AR_CRIME_DB_URL`: defaults to local JSON-backed path; accepts `sqlite:` prefix convention for future portability.
- `AR_GEOREF_BASE_URL`: defaults to `https://apis.datos.gob.ar/georef/api`.
- `AR_CRIME_INGEST_ENABLE_MEDIA_SCRAPERS`: `false` by default.
- `AR_CRIME_RATE_LIMIT_RPS`: conservative per-host ceiling.
- `AR_CRIME_SCHEDULER_ENABLED`: `true` by default.
- `AR_CRIME_INGEST_INTERVAL_MS`: default 30 minutes.

## Rotation

- Rotate API keys every 90 days.
- Update corresponding CI/CD secret store and restart workloads.
