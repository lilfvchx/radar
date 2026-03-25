# Reporte Ejecutivo: Plataforma Argentina de Fusión Operacional y Crime OSINT

## Executive summary

Se ha diseñado e implementado con éxito la base técnica y normativa para la extensión "Argentina Crime OSINT", introduciendo una arquitectura *agentic* con infraestructura completa para ingestar, procesar, enriquecer y visualizar eventos de criminalidad en la plataforma Radar.

El repositorio ahora cuenta con las guías necesarias (roles, checklist de seguridad, dependencias ambientales) y la infraestructura inicial de un centro de fusión operacional en el backend (`express` + `better-sqlite3` + `rss-parser`) y el frontend (`React` + `MapLibre`).

## Plan de integración

El diseño consideró un enfoque gradual:
- **Priorización de Fuentes:** Integración principal orientada a fuentes oficiales (MPF, PFA, Datos Argentina), para minimizar riesgos legales.
- **Normalización y Enriquecimiento:** Conexión programada a GeoRef para normalizar áreas administrativas.
- **Deduplicación de Registros:** Clave determinística generada por combinaciones de metadatos para consolidar múltiples alertas en un único "Crime Event".

## Arquitectura elegida

1. **Storage:** Se incorporó `better-sqlite3` junto a esquemas `zod` (`crime_events`, `source_items`, `ingest_runs`). Esto ofrece la persistencia relacional necesaria con un tamaño mínimo, ideal para prototipado rápido y extensible a Postgres.
2. **Pipelines de Ingesta:** Nuevos conectores para RSS, CKAN y Apify (`server/src/core/source/ar_crime/connectors/`).
3. **Scheduler:** Se registró en el scheduler de Radar un proceso en segundo plano (corriendo cada 30 min) para realizar el backfill y la ingestión.
4. **Endpoint REST:** `GET /api/ar-crime/events` con soporte de filtrado y bbox.
5. **Frontend:** React Hooks dedicados, estado local, y renderización como capas interactivas de MapLibre (marcadores con colores por severidad).

## Archivos creados/modificados

**Infraestructura Multi-Agente (Raíz):**
- `AGENTS.md`, `REPO_RULES.md`, `SECURITY_CHECKLIST.md`, `ENVIRONMENT.md`, `.env.example`, `TODO.md`, `TASKS.md`, `CLAUDE.md`, `GEMINI.md`
- `.cursor/rules.md`
- `skills/` (ingestion-rss.md, geocoding-georef.md, etc.)

**Backend (`server/`):**
- `server/package.json` (modificado: `better-sqlite3`, `zod`, `vitest`)
- `server/src/index.ts` (modificado: registro `arCrimeRouter`)
- `server/src/core/scheduler.ts` (modificado: registro cronjob)
- `server/src/routes/ar_crime.ts` (nuevo)
- `server/src/core/source/ar_crime/types.ts` (nuevo)
- `server/src/core/source/ar_crime/store/db.ts` (nuevo)
- `server/src/core/source/ar_crime/connectors/rss.ts`, `ckan.ts`, `apify.ts` (nuevos)
- `server/src/core/source/ar_crime/enrich/georef.ts` (nuevo)
- `server/src/core/source/ar_crime/normalize/event.ts` (nuevo)
- `server/src/core/source/ar_crime/dedupe/dedupe.ts` (nuevo)
- `server/src/core/source/ar_crime/score/scoring.ts` (nuevo)
- `server/src/core/source/ar_crime/pipeline.ts` (nuevo)
- `server/src/core/source/ar_crime/__tests__/pipeline.test.ts` (nuevo)

**Frontend (`client/`):**
- `client/src/modules/monitor/components/layerIds.ts` (modificado)
- `client/src/modules/monitor/components/MonitorMap.tsx` (modificado: ArCrime popup y layer)
- `client/src/modules/ar_crime/types.ts` (nuevo)
- `client/src/modules/ar_crime/hooks/useCrimeEvents.ts` (nuevo)
- `client/src/modules/ar_crime/components/CrimeLayer.tsx` (nuevo)

## Código Destacado

Ejemplo de Deduplicación y Hash:
```typescript
export function generateDedupeKey(title: string, locationText: string | null, dateIso: string | null): string {
  const t = normalizeString(title).split(' ').slice(0, 5).join('_'); // Primeras 5 palabras
  const loc = locationText ? normalizeString(locationText).substring(0, 10) : 'unknown_loc';
  const d = dateIso ? dateIso.slice(0, 10) : 'unknown_date'; // YYYY-MM-DD

  const rawKey = `${t}__${loc}__${d}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex').slice(0, 16);
}
```

## Variables de entorno
Nuevas variables expuestas en `ENVIRONMENT.md` y `.env.example`:
- `APIFY_TOKEN` (Scraping autorizado)
- `AR_CRIME_DB_URL` (`sqlite:./data/ar_crime.sqlite`)
- `AR_GEOREF_BASE_URL` (`https://apis.datos.gob.ar/georef/api`)
- `AR_CRIME_INGEST_ENABLE_MEDIA_SCRAPERS` (`false`)
- `AR_CRIME_SCHEDULER_ENABLED` (`true`)

## Cómo probarlo

1. **Instalación:** Las dependencias fueron agregadas a `server/package.json`. Ya están instaladas en el contenedor.
2. **Tests:** Correr `cd server && npm run test`. Verificar que el pipeline test pase.
3. **Ingestión manual:**
   ```bash
   curl -X POST http://localhost:3001/api/ar-crime/ingest/run
   ```
4. **Verificación visual:** En la interfaz de Radar (por default centrada en Argentina si se compila), se observarán los puntos georreferenciados en el mapa (marcadores con borde, pintados según `severity_score`). Clickeando el marcador se abre el nuevo popup `ArCrimePopupCard` mostrando severidad, confianza y cantidad de fuentes correlacionadas.

## Pendientes / mejoras futuras
- Incorporar **embeddings semánticos** y un LLM (e.g. vía la key `OPENROUTER_API_KEY`) para deduplicación fuzzy.
- Reemplazar la extracción *naive* de ubicaciones (`regex` en español) con llamadas a un LLM pequeño o Spacy (NER).
- Habilitar scraping a medios locales de noticias en base a un acuerdo de Licencias que justifique cambiar `respectRobotsTxtFile=false`.
- Refinar la jerarquía administrativa en el Frontend permitiendo filtros nativos por *Provincia* y *Municipio*.
