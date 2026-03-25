# Radar Agentic Workflows & Multi-Agent Guidelines

This document provides guidelines for multi-agent software engineering on the Radar platform, specifically governing the ingestion, fusion, and visualization of intelligence data.

## Roles & Responsibilities

1. **Ingestion Agent**: Focuses on `server/src/core/source/`. Connects to external data sources (RSS, CKAN, apify) safely, following rules of rate-limiting, scraping ethics, and caching.
2. **Data & Geo Agent**: Focuses on `server/src/core/source/*/normalize`, `enrich`, `dedupe`, and `store`. Handles schema design, geographic enrichment (e.g. GeoRef), and data deduplication.
3. **API & Security Agent**: Focuses on `server/src/routes/`. Exposes enriched data via REST endpoints. Enforces authentication, payload validation, and read-only query boundaries.
4. **UI/UX Agent**: Focuses on `client/src/modules/`. Implements React components, MapLibre layers, and popups for the visual operational fusion center.

## Workflow Rules
- **Verification**: Always verify changes after modifying the codebase using read tools.
- **Pull Requests**: PRs must include unit tests for deterministic data parsing and deduplication.
- **Source Governance**: Do not scrape without explicit check against `robots.txt`. Prefer RSS or Open Data over HTML scraping. Always store origin URL and metadata.

## Acceptance Criteria Template
- Code compiles without TypeScript errors.
- Tests run and pass.
- Ingestion jobs do not block the event loop or violate rate limits.
- Features are observable (log when job starts/finishes).
