# Ingestion Skill: RSS

## Purpose
Ingest news and bulletins using the RSS/Atom protocol.

## Implementation Details
- Use `rss-parser` or `fast-xml-parser`.
- Must implement hard timeouts (e.g., via `AbortController`).
- Extract minimum metadata: `title`, `link`, `pubDate`, `snippet/summary`.
- Gracefully handle schema variations (`content:encoded` vs `description`).
