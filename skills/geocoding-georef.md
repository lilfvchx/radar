# Geocoding Skill: GeoRef

## Purpose
Normalize locations and extract coordinates using Argentina's official GeoRef API.

## Implementation Details
- Call endpoints such as `/api/direcciones` or `/api/localidades`.
- Parse responses to standardized internal fields (`admin_area.provincia`, `admin_area.municipio`).
- Cache results locally if possible to avoid hammering the API.
