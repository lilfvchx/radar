# Ingestion Skill: Apify

## Purpose
Scrape unstructured HTML only when permitted and RSS/APIs are unavailable.

## Implementation Details
- Call Apify API (`/v2/acts/apify~web-scraper/runs`).
- **MUST** set `respectRobotsTxtFile: true`.
- Implement local rate limit delays or `maxRequestsPerCrawl` configurations to avoid swamping target servers.
- Extract minimal information to respect copyright, avoid storing full article text.
