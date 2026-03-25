# Tasks Backlog

## Phase 1 (MVP) - 90 Days
- **Ingestion**: Integrate Datos Argentina (SNIC/SAT), GeoRef, and at least 1 RSS feed (e.g., MPF).
- **Enrichment**: Normalize addresses to GeoRef `provincia`/`municipio`.
- **Dedupe**: Deterministic deduplication key based on title, date, and location bucket.
- **Scoring**: Base severity scoring based on keywords (homicide, weapon, etc.).
- **UI**: Add layer on Radar's MapLibre map with side-panel drill-downs.

## Phase 2 - 180 Days
- **Ingestion**: Expand to provincial CKAN portals (PBA).
- **Dedupe**: Semantic similarity via embeddings/TF-IDF.
- **Observability**: Add dashboard for ingestion metrics.
- **Alerts**: Watchlists for specific geographic polygons.

## Phase 3 - 365 Days
- **Integrations**: SIEM/institutional integrations.
- **Forecasting**: Analytical models for trend prediction.
- **Governance**: Automated formal tracking of media licenses.
