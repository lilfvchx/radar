# Argentina Crime OSINT — Legal / Robots / TOS matrix (MVP)

| Source               | robots.txt                             | Terms                                              | License                                         | Status                     | Default |
| -------------------- | -------------------------------------- | -------------------------------------------------- | ----------------------------------------------- | -------------------------- | ------- |
| MPF CABA RSS         | https://mpfciudad.gob.ar/robots.txt    | N/D                                                | Institucional                                   | Allowed RSS-first          | ON      |
| Página12 RSS         | https://www.pagina12.com.ar/robots.txt | https://www.pagina12.com.ar/terminos-y-condiciones | No licencia de republicación automática en repo | Requires agreement         | OFF     |
| Apify generic crawls | Per-domain robots                      | Per-domain terms                                   | Per-domain                                      | Requires explicit approval | OFF     |

## Guardrails

- RSS/API first.
- Explicit user-agent.
- Conservative rate limits.
- Metadata + snippet only by default.
