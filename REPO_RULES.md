# REPO_RULES

## Structure

- `server/src/core/source/*` for source adapters and processing logic.
- `server/src/routes/*` for HTTP interface only.
- `client/src/modules/*` for feature modules.

## Conventions

- TypeScript strict mode, explicit return types for exported functions.
- Small pure helpers for dedupe/scoring logic.
- Feature flags for legally-sensitive ingestion sources.
- Persist metadata, not full copyrighted article body, unless licensed.

## Logging

- Prefix logs by domain (`[AR Crime]`, `[Scheduler]`).
- Never log secrets or full personally identifying sensitive payloads.
