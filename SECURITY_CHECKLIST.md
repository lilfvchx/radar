# SECURITY_CHECKLIST

- [ ] `.env` is gitignored and no credential literals are in tracked files.
- [ ] `OPENROUTER_API_KEY` and `APIFY_TOKEN` accessed only through env vars.
- [ ] Sources include legal matrix entries (robots + terms + license notes).
- [ ] Scraping disabled by default when legal status is unclear.
- [ ] Rate limiting and user-agent are configured.
- [ ] PII minimization: store event metadata/snippet only.
- [ ] Ingest runs store errors for auditability.
