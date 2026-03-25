
Cada prompt debe ser ejecutado en sesiones limpias o ramas separadas, asegurando que la IA tenga el contexto previo consolidado.

---

## 🏗 FASE 1: FOUNDATION & SOURCE DISCOVERY (3 a 5 Días)

### Prompt 1.1: Configuración de Base de Datos y Modelos Core (Drizzle/Prisma + PostgreSQL)

**Rol:** Eres el Lead Data Architect de una plataforma OSINT para Argentina. Tu enfoque es "Source-first" y "Provenance-first".
**Contexto:** Basado en la SECCIÓN 8 del `OSINT_ARCHITECTURE_ARGENTINA.md`, necesitamos definir el esquema de base de datos relacional para el Data Lake Operacional. El motor será PostgreSQL usando un ORM moderno (preferentemente Drizzle ORM o Prisma). Todo registro debe tener linaje (`source_id`, `fetched_at`) y no borramos nada (Soft Deletes obligatorios).
**Misión:** Escribe el código del esquema del ORM (`schema.ts`) que incluya las siguientes tablas con sus respectivas relaciones (Foreign Keys) y constraints fuertes:
1. `source_registry` (Metadatos de la fuente, `source_classification` enum, `priority`).
2. `raw_records` (Almacén del payload JSONB original inmutable, con PK `record_id`, FK a `source_id`, hash SHA256 para deduplicación).
3. `normalized_entities` (Entidades lógicas: `cuit`, `razon_social`, `entity_type` enum).
4. `normalized_addresses` (Domicilios con `province`, `municipality`, `lat`, `lon`, `geocode_confidence` float).
**Restricciones:** El `cuit` debe ser un `varchar(11)` y admitir nulos (hay ministerios sin CUIT explícito). `fetched_at` debe ser autogenerado e inmutable. Incluye comentarios JSDoc explicando por qué se usa cada campo según la realidad OSINT argentina.
**Entregable:** Código TypeScript del ORM (`schema.ts`) y un script de migración inicial vacío o equivalente.

### Prompt 1.2: Cliente SDK y Wrapper Interno para API Georef Argentina

**Rol:** Eres un Ingeniero Backend Especialista en GIS e integraciones.
**Contexto:** La API oficial de Datos Argentina (apis.datos.gob.ar/georef/api) es nuestro estándar oro de normalización territorial (Fase 1).
**Misión:** Construye un SDK interno en TypeScript (`src/modules/georef/client.ts`) para consumir la API Georef con foco en resiliencia.
**Requerimientos:**
1. Métodos tipados para `direcciones`, `provincias`, `municipios`.
2. Implementar Throttling/Rate Limiting (max 5 requests/sec).
3. Retries exponenciales para códigos HTTP 5xx.
4. Fallback de Graceful Degradation: Si la API de Georef devuelve 404 o 500 tras los retries, debe devolver un objeto que simule la estructura pero con un `geocode_confidence` asignado en `0.1` y un flag `fallback_used: true`.
**Restricciones:** Usa `fetch` nativo de Node.js o `axios`. Valida la respuesta con `Zod` o `TypeBox` para asegurar el Data Contract. Escribe un test unitario con Vitest (`georef.test.ts`) que simule un 500 del servidor.

### Prompt 1.3: Conector Genérico CKAN (Datos Argentina / PBA)

**Rol:** Eres un Data Engineer experto en extracción de Open Data.
**Contexto:** Necesitamos un orquestador para descargar metadatos de los portales gubernamentales CKAN (Datos Argentina, PBA).
**Misión:** Crea un servicio en TypeScript (`src/modules/ingestion/ckanConnector.ts`) que ejecute el flujo de Discovery.
**Flujo:**
1. Hace GET a `package_search` con un keyword (ej. "seguridad").
2. Itera sobre los resultados y hace GET a `package_show` por cada `id`.
3. Extrae la lista de `resources.url` válidos (CSVs, JSONs).
4. Si el checksum o `last_modified` del dataset cambió frente a la base de datos (simula una consulta a DB devolviendo un boolean falso), procede a descargar el archivo a disco (o a un bucket S3 si inyectamos el cliente).
**Restricciones:** Rate limit de 10 req/s. Manejo de excepciones. Si un resource.url da 404, alerta por logger pero NO rompe el pipeline de los demás recursos.
**Entregable:** El código completo del servicio y un script ejecutable que loguee por consola los resultados de buscar "estadisticas criminales".

---

## 🏭 FASE 2: NORMALIZATION & PROCUREMENT LAYER (5 a 7 Días)

### Prompt 2.1: Scraper Crawler para COMPR.AR con Kill Switch

**Rol:** Eres un Lead Web Scraper Developer. Escribes código "Defensivo".
**Contexto:** COMPR.AR es el portal de compras nacionales (ASPX web forms). Su estructura es frágil y aplican WAFs que bloquean IPs agresivas. Es un conector de alto valor pero alta fragilidad (SECCIÓN 7).
**Misión:** Crea un script usando `Puppeteer` o `Playwright` (`src/modules/ingestion/scrapers/comprar.ts`) para la Búsqueda Pública Avanzada de contrataciones de COMPR.AR.
**Requerimientos:**
1. Navegar a la tabla de resultados de licitaciones públicas del día.
2. Extraer "Número de Expediente", "Organismo", "Objeto" y "Monto".
3. **Throttling estricto:** 1 request cada 3-5 segundos (randomizado).
4. **Kill Switch:** Antes de ejecutarse, la función debe chequear un environment variable `KILL_SWITCH_COMPRAR=true`. Si está en true, aborta silenciosamente.
5. **Autoprotección:** Si el selector CSS maestro (ej. la tabla `#resultados`) no existe, asume que la web cambió de diseño, lanza un error tipado `SchemaDriftError`, detiene el scraper y envía un log de severidad CRÍTICA (simulado por console.error o Winston).
**Entregable:** El crawler defensivo, tipado estricto de las interfaces extraídas, y un timeout absoluto por página de 30s.

### Prompt 2.2: Parser Diario del Boletín Oficial (BORA)

**Rol:** Eres un Ingeniero de Datos especializado en NLP básico y Regex.
**Contexto:** El Boletín Oficial (BORA) en su Sección 1 y 2 es vital para capturar cambios de autoridades, edictos societarios y multas. (SECCIÓN 3.C de la arquitectura).
**Misión:** Crea un servicio (`src/modules/ingestion/parsers/bora.ts`) que procese el JSON de índice diario público del boletín oficial o un PDF/HTML descargado.
**Requerimientos:**
1. Una función que reciba el texto crudo de un Edicto de la "Sección Segunda (Sociedades)".
2. Aplica Expresiones Regulares (Regex) complejas probadas para extraer:
   a) Tipo de Sociedad (S.A., S.R.L., S.A.S).
   b) Razón Social (asumiendo que viene antes del tipo de sociedad).
   c) Nombres de personas físicas involucradas como socios/directores.
3. El output debe ser un objeto tipado `BoraNoticeEntity` listo para ser normalizado e insertado en la base de datos de la Fase 1.
**Entregable:** El código del parser Regex, una batería de 3 tests unitarios con textos falsos de edictos similares a la realidad argentina, y métricas de error si no logra matchear el patrón.

---

## 🔍 FASE 3: ENTITY RESOLUTION & SEARCH API (4 a 6 Días)

### Prompt 3.1: Algoritmo de Resolución de Entidades (Entity Merge Logic)

**Rol:** Eres un Data Scientist / Data Engineer experto en Master Data Management.
**Contexto:** Tenemos miles de registros crudos en PostgreSQL de IGJ, BORA y COMPR.AR. Necesitamos consolidar "Quién es Quién" usando el CUIT como ancla principal y "Razón Social + Provincia" como ancla secundaria débil. (Ver SECCIÓN 9 de la Arquitectura OSINT).
**Misión:** Escribe una función de negocio transaccional (`src/core/entityResolution.ts`) que reciba un nuevo registro (e.g. un Contrato adjudicado a "EMPRESA X" con CUIT `30-11111111-2`) e intente buscar y unir (merge) con entidades lógicas existentes.
**Lógica requerida:**
- **Matching Exacto:** Si el `CUIT` coincide con un `normalized_entity` existente, el confidence es `1.0`. Asigna el ID existente y actualiza la fecha `update_date`.
- **Matching Probabilístico:** Si el CUIT es nulo, usa similitud de Levenshtein o Trigramas (simulados en TS o usando queries de SQL crudos `pg_trgm`) sobre la Razón Social Y que la Provincia (Georef) sea idéntica.
  - Si Score > 0.85: Devuelve `status: 'NEEDS_REVIEW'`, lo inserta como entidad nueva pero la vincula a una tabla de sugerencias de colisión para que un humano lo audite.
  - Si la provincia es distinta: Score sufre penalidad severa (-0.5).
**Restricciones:** Evitar a toda costa los falsos positivos (Falso Merge). Es preferible tener dos entidades duplicadas que una entidad mezclada incorrectamente.
**Entregable:** La lógica Typescript pura de resolución, algoritmos de string similarity y tests unitarios de colisión con los casos "Panadería Central CABA" vs "Panadería Central Tucumán".

### Prompt 3.2: API de Búsqueda de Entidades (Dossier Unificado)

**Rol:** Eres un Backend API Developer (Node.js/Express).
**Contexto:** Necesitamos exponer la información unificada al Frontend de los analistas OSINT.
**Misión:** Escribe las rutas y controladores (`src/routes/entities.ts`) para una API RESTFUL que busque y entregue un "Dossier 360".
**Endpoints:**
1. `GET /api/v1/entities?q={cuit_o_nombre}&jurisdiction={caba}` -> Búsqueda full-text o exacta.
2. `GET /api/v1/entities/:uuid/dossier` -> Devuelve un JSON consolidado con: Datos Maestros (CUIT, Nombres), Array de Domicilios Normalizados, Array de Novedades BORA relacionadas, y Array de Licitaciones Adjudicadas (COMPR.AR).
**Restricciones:**
- La consulta SQL (o mediante ORM) para el endpoint `/dossier` debe ser eficiente (uso de LEFT JOINs correctos).
- Si el CUIT no existe, 404 limpio.
- Throttling a la API: 10 requests / seg.
**Entregable:** Archivo de rutas de Express/Fastify, esquemas de validación de Request/Response usando Zod, e inyección de dependencias para los repositorios.

---

## ⚡ FASE 4: WORKFLOWS, ALERTAS & WATCHLISTS (3 a 5 Días)

### Prompt 4.1: Motor Asíncrono de Watchlists (Event-Driven Alerting)

**Rol:** Eres un Arquitecto Backend de Sistemas Distribuidos.
**Contexto:** Los analistas crean "Watchlists" de entidades (Ej: "Avisame si el CUIT X gana un contrato"). Necesitamos procesar el stream de nuevos registros y disparar notificaciones asíncronas sin bloquear la ingesta (SECCIÓN 14 y 15).
**Misión:** Construye un sistema de procesamiento de eventos en background (`src/workers/alertEngine.ts`) asumiendo que leemos de una cola Redis o BullMQ.
**Flujo:**
1. El Job recibe un evento: `{ type: 'CONTRACT_AWARDED', cuit: '30-xxxx', data: {...} }`.
2. El Worker consulta a la BD si el CUIT está en la tabla `active_watchlists`.
3. Si hay match, genera un registro en `notifications` (Idempotencia obligatoria: asegurar por hash único que no insertamos 2 notificaciones por la misma licitación).
4. (Simula) El envío de un email o webhook de Slack con la novedad operativa.
**Entregable:** Código del Worker/Job processor (usando una librería tipo BullMQ o in-memory si es mock), manejo de reintentos en fallos de red y test unitario de Idempotencia (`test_watchlist_idempotency`).

---

## 🕸 FASE 5: RISK SCORING EXPLICABLE & LEGAL COMPLIANCE (4 a 6 Días)

### Prompt 5.1: Motor Determinístico de Riesgo (Risk Scoring Rule Engine)

**Rol:** Eres un Experto en Compliance / Due Diligence y Software Engineer.
**Contexto:** La SECCIÓN 11 y 15 de la arquitectura prohíbe las "Cajas Negras de Machine Learning". Todo puntaje de riesgo asignado a un proveedor del Estado debe ser determinístico, basado en reglas duras, y 100% explicable para evitar demandas o juicios (Explainability requirement).
**Misión:** Escribe un `RiskScoringEngine` (`src/core/riskEngine.ts`) que calcule el nivel de riesgo de 0 a 100 de una `Entity` basándose en un catálogo de factores configurables.
**Reglas de negocio a implementar (Ejemplos):**
- Si la entidad tiene una licitación > 1,000,000 ARS y fue constituida hace menos de 6 meses (Cruce COMPR.AR + IGJ): +40 puntos de riesgo (Motivo: "POSIBLE_EMPRESA_FANTASMA_RECIENTE").
- Si el "Health Check" indica que el CUIT tiene la clave fiscal desactivada (Simulado): +50 puntos de riesgo.
- Si tiene novedades en BORA por Cambio de Directorio 3 veces en el último año: +20 puntos.
**Entregable:**
La clase/función del motor que reciba un objeto Entidad totalmente hidratado (con historial), aplique las reglas, devuelva el Score Total, y un Array obligatorio de `reasons: string[]` explicando exactamente cada punto sumado. Incluye Tests Unitarios exhaustivos demostrando el `test_scoring_explainability` estipulado en el documento arquitectónico.
