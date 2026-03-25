# Deduplication & Scoring Skill

## Purpose
Merge duplicate events reported by different sources and calculate severity/confidence.

## Implementation Details
- **Dedupe Key**: Generate hash or normalized string from `title_snippet` + `location_slug` + `date_YYYYMMDD`.
- **Severity**: Compute score (0-100) using keyword dictionaries (`homicide` = high, `theft` = medium).
- **Confidence**: Base score on source reliability (`official_api` > `news_rss`).
