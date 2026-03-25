# Ingestion Skill: CKAN

## Purpose
Fetch open datasets from CKAN portals (e.g. Datos Argentina).

## Implementation Details
- Use `package_search` and `package_show` API actions.
- Download resources (CSV/XLSX/PDF).
- For MVP, use `csv-parser` to parse CSV resources.
- Must include proper User-Agent headers.
