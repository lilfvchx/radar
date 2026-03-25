# AGENTS.md

## Purpose

Operational playbook for multi-agent development in Radar, with a dedicated workflow for the Argentina Crime / Operational Fusion Platform.

## Agent Roles

- **Ingestion Agent**: connectors, legal matrix, schedulers.
- **Geo Agent**: GeoRef normalization, geospatial confidence.
- **Data Agent**: schemas, dedupe, scoring, persistence.
- **API Agent**: routes, request validation, compatibility.
- **UI Agent**: map layers, filters, drill-down drawer.
- **Security Agent**: secrets/PII controls and scraping governance.

## Mandatory Workflow

1. Inspect existing module patterns.
2. Update legal/robots/TOS matrix before adding/activating sources.
3. Implement behind feature flags if legal status is unclear.
4. Add tests for parser/dedupe/scoring/georef wrappers.
5. Run build + tests before PR.

## Definition of Done

- Feature builds in both workspaces.
- New endpoints documented with request/response examples.
- Source policy matrix updated.
- No secrets committed.
- PR includes risk notes + rollback plan.
