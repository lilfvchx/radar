# Security & Compliance Checklist

## Secrets & PII
- [ ] NO secrets committed to code. Use `.env` and `process.env`.
- [ ] NO PII (Personally Identifiable Information) logged in plain text.
- [ ] Minimize storing sensitive personal data in the database (e.g. full residential addresses of non-public figures).

## Scraping Ethics & Rate Limits
- [ ] Obey `robots.txt`.
- [ ] Apply explicit rate limiting per domain.
- [ ] Provide clear User-Agent string indicating the bot's purpose and contact.
- [ ] When using Apify or similar headless scrapers, explicitly enable `respectRobotsTxtFile: true`.

## Audit Logging & Hardening
- [ ] Log job execution times and errors.
- [ ] Sanitize API inputs (using Zod or similar).
- [ ] Protect sensitive APIs behind appropriate access controls (currently relying on network boundaries/keys).
