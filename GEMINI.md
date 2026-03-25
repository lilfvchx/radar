# Gemini Model Guidelines for Radar

- Strict TypeScript adherence. Strongly type all external data parsing interfaces (e.g. Zod).
- Avoid `any` types wherever possible.
- Focus on defensive programming when scraping or calling external APIs (handle timeouts, non-200 responses, invalid JSON).
- Emphasize modularity. Keep route handlers thin; push business logic into `src/core/`.
