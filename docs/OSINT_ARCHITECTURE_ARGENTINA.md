# ARCHITECTURE: OSINT / RISK INTELLIGENCE PLATFORM (ARGENTINA)

## SECCIÓN 1 — RESUMEN ESTRATÉGICO DEL PROBLEMA

- **Qué se puede construir de verdad en Argentina con fuentes abiertas:**
  Una plataforma estructurada de inteligencia territorial, due diligence corporativo, y monitoreo de contrataciones públicas basada en fuentes primarias inmutables (BO, IGJ, COMPR.AR, Datos Argentina). Es posible trazar el ciclo de vida de una empresa (constitución, autoridades, adjudicaciones, normativas aplicables) y cruzarla con variables geográficas normalizadas (Georef) y estadísticas criminales agregadas (SNIC).
- **Qué NO se puede construir honestamente:**
  Sistemas automatizados de atribución inmediata de titularidad vehicular (DNRPA no ofrece bulk data abierto y tiene restricciones legales duras), resolución mágica de dominios WHOIS .ar sin rate limits severos, ni una base de datos masiva de antecedentes penales o causas judiciales individuales a nivel nacional lista para query masivo.
- **Dónde está el mayor valor operacional:**
  En la fusión determinística de entidades (CUIT) cruzando el universo societario (IGJ/Boletín Oficial) con el flujo de fondos estatales (COMPR.AR, portales de transparencia provinciales), y enriqueciendo esto con contexto geográfico hiperlocal (BA APIs) y normativo (Infoleg/BORA).
- **Dónde está el mayor riesgo legal:**
  En la ingesta y uso no auditado de la Central de Deudores del BCRA para propósitos masivos de scoring crediticio automatizado sin explicar la lógica, y en cualquier intento de armar padrones vehiculares (DNRPA) o recolectar PII de menores desde edictos o boletines sin un proceso de minimización de datos.
- **Qué subset permite un MVP serio:**
  Un pipeline centrado en la entidad jurídica (CUIT/Razón Social). Las fuentes ancla del MVP deben ser: IGJ (Datos Justicia) como semilla de entidades, Georef/BA APIs para estandarizar direcciones, BORA para tracking de novedades societarias/legales, y COMPR.AR para tracking económico.
- **Por qué una plataforma OSINT argentina debe arrancar por datos duros y no por scraping indiscriminado:**
  El scraping web de portales gubernamentales argentinos es inherentemente frágil (cambios de UI sin previo aviso, protecciones anti-bot básicas, caídas frecuentes). Depender de ellos como columna vertebral genera deuda técnica inmediata. Los datos duros (CKAN, CSV, dumps oficiales, APIs JSON) garantizan linaje (provenance), permiten auditoría, posibilitan retrocesos seguros y aseguran integridad estructural.
- **Cuáles son las fuentes ancla del sistema:**
  Datos Argentina (Registry CKAN), API Georef, IGJ (Datos Justicia), COMPR.AR, Boletín Oficial (BORA), SNIC, BCRA (Catálogo de APIs controladas) y las BA APIs (CABA).
- **Cuáles son las limitaciones estructurales del país en materia de open data:**
  Ausencia de identificadores únicos transversales en todos los datasets (muchos no exponen el CUIT, sólo Razón Social), heterogeneidad provincial (cada provincia usa formatos o portales distintos, desde Andino hasta Excel sueltos), publicación de datos en formatos agregados (PDF, tableros BI interactivos) en lugar de datasets crudos o APIs transaccionales, y la intermitencia en la actualización de catálogos oficiales.

## SECCIÓN 2 — PRINCIPIOS ARQUITECTÓNICOS NO NEGOCIABLES

- **source-first:** El diseño de la base de datos se adapta a la realidad de la fuente, no al revés. Si un dataset no tiene CUIT, no se inventa uno en la ingesta cruda.
- **provenance-first:** Todo registro, entidad o arista debe conservar obligatoriamente el `source_id`, la URL de extracción y el `fetched_at`. Sin linaje, el dato no vale nada operativamente.
- **legal-by-design:** Toda fuente o subfuente ingresa al sistema con una etiqueta de clasificación legal dura (e.g., OPEN_DATA, LEGALLY_SENSITIVE). La ausencia de etiqueta bloquea el pipeline.
- **throttling-by-default:** Todo scraper o conector debe implementar un backoff y límite de peticiones (rate limiting) por host. No se tumba infraestructura del Estado.
- **auditability-by-default:** Toda consulta que involucre fuentes sensibles (como BCRA o WHOIS) o PII específica debe registrar quién la hizo y para qué caso.
- **no-PII-hoarding:** No se almacena Información Personal Identificable masiva "por si acaso". Se ingesta y procesa sólo lo justificable para la resolución de entidades y la operación en curso.
- **entity-resolution-later, provenance-now:** La capa de ingesta guarda el payload original crudo y su versión normalizada en tablas inmutables. El merge de identidades, grafos o scoring ocurre aguas abajo de manera asíncrona y reversible.
- **API > CKAN > structured file > RSS > guarded HTML:** Es el orden de prioridad estricto para desarrollar conectores. Scraping HTML se usa sólo si no existe alternativa.
- **separacion entre raw lake, normalized layer, entity layer, graph layer, alert layer:** La arquitectura debe mantener fronteras rígidas. Raw almacena el JSON/CSV original, Normalized mapea fechas y strings limpios, Entity unifica (e.g., CUIT único), Graph traza aristas (e.g., Persona A es director de Empresa B), y Alert evalúa eventos sobre entidades.
- **fallback explícito ante fallas de fuente:** Si COMPR.AR se cae, el sistema debe degradar el servicio para ese conector (marcarlo como down) pero la búsqueda de entidades debe seguir devolviendo los datos cacheados o históricos.
- **desactivación rápida de conectores rotos:** Obligatoriedad de kill-switches (feature flags) por conector para detener la ingesta en segundos si cambia un formato o hay problemas legales, sin requerir un deploy.
- **smoke-test before merge:** Ningún PR de conector se mergea sin una prueba real contra el endpoint (o un payload exacto simulado) para validar el schema resultante.
- **no feature ships without source verifiability:** Si la UI muestra que "La Empresa X ganó Y licitaciones", debe proveer un enlace directo al documento o registro crudo original.

## SECCIÓN 3 — INVENTARIO CONSOLIDADO DE FUENTES PARA IMPLEMENTACIÓN

### Geografía
- **Valor que aporta:** Normalización estricta de todo input espacial, clave para evitar duplicados por mala escritura ("Bs. As.", "Baires", "CABA") y para cruzar incidentes con jurisdicciones y límites administrativos.
- **Top 3 a 8 fuentes:** API Georef, BA APIs (CABA), IGN Capas SIG, IDERA, PBA Catálogo (sección territorio).
- **Mejores para MVP:** API Georef (como base nacional unificada) y BA APIs (para precisión hiperlocal en AMBA).
- **Más ricas pero más costosas:** IDERA, debido a que federar y parsear WFS/WMS de nodos provinciales inconsistentes requiere alto esfuerzo de orquestación.
- **Frágiles:** Nodos provinciales individuales de IDERA que se caen frecuentemente.
- **No escalan:** Scraping de visores cartográficos web propietarios.
- **Sólo sirven de enriquecimiento:** Capas temáticas de INTA / SEGEMAR.
- **No deben ser core:** Catastros de municipios pequeños que publican PDFs escaneados.

### Crimen / Justicia
- **Valor que aporta:** Contexto de riesgo territorial, compliance básico, monitoreo de background checks a nivel corporativo.
- **Top 3 a 8 fuentes:** SNIC (Estadísticas criminales), Datos Justicia Argentina (IGJ/Registros), BORA (Avisos Judiciales), Mapas del Delito (CABA/PBA), RSS Ministerios de Seguridad.
- **Mejores para MVP:** Datos Justicia (especialmente IGJ) y SNIC (para el heat map base nacional).
- **Más ricas pero más costosas:** BORA (Avisos judiciales y edictos), ya que requieren un pipeline de OCR robusto y NLP para extraer identidades sin PII errónea.
- **Frágiles:** Scraping de juzgados provinciales o del PJN por barreras técnicas (captchas, bloqueos dinámicos).
- **No escalan:** Búsqueda manual causa por causa sin un listado índice confiable.
- **Sólo sirven de enriquecimiento:** RSS de noticias institucionales sobre operativos.
- **No deben ser core:** Bases de personas buscadas no normalizadas o con riesgo legal.

### Contrataciones / Regulación
- **Valor que aporta:** Procurement intelligence, due diligence de fraude (red flags), monitoreo de gasto público.
- **Top 3 a 8 fuentes:** COMPR.AR, BORA (Normativas/Sociedades), Datos Abiertos IGJ, CONTRAT.AR, Portales provinciales (PBA/CABA/Córdoba).
- **Mejores para MVP:** Datos Abiertos IGJ (entidades), BORA y COMPR.AR.
- **Más ricas pero más costosas:** CONTRAT.AR y portales provinciales que no utilizan OCDS y requieren spiders complejos.
- **Frágiles:** COMPR.AR (si se hace mediante scraping de la UI en lugar de descarga de listados, por cambios en el DOM).
- **No escalan:** Descarga manual de PDFs escaneados de resoluciones municipales menores.
- **Sólo sirven de enriquecimiento:** Presupuestos ejecutados agregados (sin desglose a nivel proveedor).
- **No deben ser core:** Transparencia activa subnacional que se publica en formatos cerrados sin historización.

### Finanzas
- **Valor que aporta:** Due diligence de liquidez, riesgo de contraparte, fraude básico.
- **Top 3 a 8 fuentes:** BCRA Central de Deudores, BCRA Cheques Denunciados, SSN (Seguros), CNV, BCRA Principales Variables.
- **Mejores para MVP:** SSN (datos abiertos de aseguradoras) y BCRA Cheques Denunciados (fraude puntual con riesgo manejable).
- **Más ricas pero más costosas:** BCRA Central de Deudores (es muy rica, pero operativamente requiere auditoría estricta y control de acceso por caso para no violar normativas de datos).
- **Frágiles:** Extracción no autorizada de AFIP (padrones web cerrados).
- **No escalan:** Scraping masivo a endpoints del BCRA sin tokens o acuerdos.
- **Sólo sirven de enriquecimiento:** BCRA Principales Variables (para macroeconomía contextual).
- **No deben ser core:** Scoring crediticio comercial de terceros sin contrato API formal (Nosis, Veraz).

### Transporte
- **Valor que aporta:** Monitoreo de logística crítica, infraestructura y contexto de movilidad.
- **Top 3 a 8 fuentes:** API Transporte CABA, ANAC Estadísticas, CNRT Consultas, Trenes Argentinos GTFS.
- **Mejores para MVP:** ANAC (Estadísticas macro) y API Transporte CABA (si el token es estable).
- **Más ricas pero más costosas:** GTFS-RT (requiere infraestructura de ingesta en tiempo real pesada).
- **Frágiles:** Scraping de la web de la CNRT, basada en formularios POST.
- **No escalan:** Rastreo masivo de embarcaciones (AIS) vía scraping público, sin una licencia B2B.
- **Sólo sirven de enriquecimiento:** Mapas estáticos de Ecobici o flujos de tránsito menores.
- **No deben ser core:** Vuelos en tiempo real si no se cuenta con fuente oficial API (por el costo y rate limit de proveedores).

### Telco / Cyber
- **Valor que aporta:** Atribución de infraestructura a corporaciones, verificación de dominios y licencias.
- **Top 3 a 8 fuentes:** ENACOM (Datos abiertos), NIC Argentina (WHOIS), ASN Públicos, ARSAT REFEFO.
- **Mejores para MVP:** ENACOM (Licencias TIC y Homologaciones).
- **Más ricas pero más costosas:** NIC Argentina (WHOIS .ar), debido a restricciones estrictas de scraping y barreras de uso.
- **Frágiles:** Bases de portabilidad numérica no oficiales.
- **No escalan:** Intentos de barrido (zone walking) de dominios .ar.
- **Sólo sirven de enriquecimiento:** Trazabilidad de incidentes o feeds públicos de phishing.
- **No deben ser core:** WHOIS masivo .ar para grafos globales de propiedad sin permiso explícito.

### Provincias / Municipios
- **Valor que aporta:** Granularidad a nivel compras locales y regulaciones de habilitación urbana.
- **Top 3 a 8 fuentes:** PBA Catálogo, BA Data, Mendoza Datos, Santa Fe Datos, Córdoba Gobierno Abierto.
- **Mejores para MVP:** BA Data (CABA) y PBA Catálogo, por la madurez y formato Andino/CKAN.
- **Más ricas pero más costosas:** Córdoba y Mendoza (requieren integración particular de formatos no estandarizados).
- **Frágiles:** Integraciones que dependan de hojas de cálculo de Google Drive publicadas por municipios pequeños.
- **No escalan:** Procesos manuales de pedido de acceso a la información por mail.
- **Sólo sirven de enriquecimiento:** Ordenanzas municipales menores (fuera de compras/planeamiento).
- **No deben ser core:** Fuentes provinciales con más de 2 años sin actualización (se consideran muertas).

### Medios / Institucionales
- **Valor que aporta:** Alertas tempranas, OSINT narrativo, verificación de allanamientos o adjudicaciones polémicas.
- **Top 3 a 8 fuentes:** RSS Télam / Oficiales, Sitemaps de Ministerios / MPF, RSS Boletines Policiales provinciales.
- **Mejores para MVP:** RSS Institucionales del Ministerio de Seguridad / Justicia (formatos estructurados simples).
- **Más ricas pero más costosas:** Sitios web de Ministerios Públicos sin RSS (requieren spiders y parsers de HTML constante).
- **Frágiles:** Scraping de notas que cambian de URL.
- **No escalan:** Procesamiento NLP profundo de cientos de medios para análisis de sentimiento inicial.
- **Sólo sirven de enriquecimiento:** Noticias periodísticas para añadir un "flag" manual.
- **No deben ser core:** Scrapear medios nacionales con paywall o copyright restrictivo, ya que contamina legalmente el producto.

### Extras
- **Valor que aporta:** Entorno ampliado, factores exógenos y contexto de due diligence avanzado.
- **Top 3 a 8 fuentes:** Subastas públicas (bienes decomisados/estatales), SMN (clima para logística), Observatorios de obra pública (como el ODP u ONGs), Datos académicos de INTA.
- **Mejores para MVP:** Ninguna de este bloque es core para la fase 1; se integran como pruebas de concepto.
- **Más ricas pero más costosas:** Extracción de datos tabulares desde PDFs de balances de ONGs.
- **Frágiles:** Observatorios de terceros que no mantienen sus APIs de consulta.
- **No escalan:** Carga manual de planillas de declaraciones juradas.
- **Sólo sirven de enriquecimiento:** Capas ambientales del SMN para riesgo de obra.
- **No deben ser core:** PEPs informales armados de blogs sin confirmación en BORA o AFIP.

## SECCIÓN 4 — TOP DE FUENTES PARA MVP EN 5 FASES

### Fase 1 Core
- **Datos Argentina (Portal Nacional CKAN)**
  - *Razón de inclusión:* Registry y federador de metadata.
  - *Valor operacional:* Permite auto-descubrimiento y validación de datasets.
  - *Tipo de acceso:* OPEN_DATA (API CKAN).
  - *Complejidad:* Baja.
  - *Riesgo legal:* Nulo.
  - *Estabilidad esperada:* Alta.
  - *Uso:* Enriquecimiento/Búsqueda.
  - *Rol:* Core (Base orquestadora).
- **API Georef**
  - *Razón:* Única forma técnica de tener calles y provincias normalizadas sin colisión.
  - *Valor operacional:* Geocodificación nacional determinística.
  - *Tipo de acceso:* OPEN_DATA (API REST).
  - *Complejidad:* Baja.
  - *Riesgo:* Nulo.
  - *Estabilidad:* Alta.
  - *Uso:* Normalización (Geocoding / Graph).
  - *Rol:* Core.
- **BA APIs (CABA Geocoding)**
  - *Razón:* Georef nacional no es suficiente para hiperlocal CABA.
  - *Valor:* Precisión urbana (parcelas/calles).
  - *Tipo:* OPEN_DATA (API REST).
  - *Complejidad:* Baja.
  - *Riesgo:* Nulo.
  - *Estabilidad:* Alta.
  - *Uso:* Normalización.
  - *Rol:* Core.
- **Datos Justicia (IGJ Entidades Constituidas)**
  - *Razón:* Es la semilla corporativa del producto. Da Razón Social, CUIT, Fecha y Tipo.
  - *Valor:* Dossier inicial de empresas (Entity Resolution base).
  - *Tipo:* OPEN_DATA (Dumps CSV/ZIP).
  - *Complejidad:* Media (procesar volumen).
  - *Riesgo:* Bajo.
  - *Estabilidad:* Media (actualización asincrónica).
  - *Uso:* Graph / Búsqueda.
  - *Rol:* Core absoluto.
- **SNIC (Estadísticas Criminales)**
  - *Razón:* Da contexto geográfico de riesgo.
  - *Valor:* Scoring de riesgo por departamento/provincia.
  - *Tipo:* OPEN_DATA (Descarga CSV/XLSX).
  - *Complejidad:* Media (parsing de hojas Excel/CSV con esquemas variables).
  - *Riesgo:* Nulo (agregados).
  - *Estabilidad:* Alta.
  - *Uso:* Scoring / Enriquecimiento territorial.
  - *Rol:* Core.

### Fase 2 Expansión
- **Boletín Oficial de la República Argentina (BORA)**
  - *Razón:* Contiene designación de autoridades, concursos, sanciones, avisos comerciales.
  - *Valor:* Monitoreo continuo de eventos societarios y normativos.
  - *Tipo:* PUBLIC_WEB (Crawler de PDFs/HTML).
  - *Complejidad:* Alta (OCR, Regex, NLP básico).
  - *Riesgo:* Medio (Depende de si extrae PII no minimizada).
  - *Estabilidad:* Media-Baja (Cambios de UI o PDF mal formados).
  - *Uso:* Monitoreo / Graph (relaciones entre personas y empresas).
  - *Rol:* Core (en esta fase).
- **COMPR.AR**
  - *Razón:* Portal clave de compras.
  - *Valor:* Procurement intelligence y vínculos CUIT-Adjudicación.
  - *Tipo:* PUBLIC_QUERY (Crawler sobre resultados o API oculta).
  - *Complejidad:* Alta (Spiders frágiles, paginación, rate limits).
  - *Riesgo:* Bajo a Medio.
  - *Estabilidad:* Baja.
  - *Uso:* Búsqueda / Scoring (volumen de contratos).
  - *Rol:* Core Secundario.
- **PBA Catálogo / BA Data (Datasets de compras)**
  - *Razón:* Bajar la escala a jurisdicciones críticas.
  - *Valor:* Expandir contratos y contratistas.
  - *Tipo:* OPEN_DATA (CKAN).
  - *Complejidad:* Media.
  - *Riesgo:* Nulo.
  - *Estabilidad:* Alta.
  - *Uso:* Enriquecimiento / Graph.
  - *Rol:* Expansión.

### Fase 3 Enriquecimiento
- **BCRA Central de Deudores / Cheques**
  - *Razón:* Riesgo de contraparte real (¿Tiene cheques rechazados? ¿En situación 4?).
  - *Valor:* Scoring de due diligence financiero.
  - *Tipo:* LEGALLY_SENSITIVE (API).
  - *Complejidad:* Baja (consumo REST), Alta (legal).
  - *Riesgo:* ALTO (Uso masivo puede requerir revisión legal dura).
  - *Estabilidad:* Alta.
  - *Uso:* Scoring / Consulta manual puntual.
  - *Rol:* Enrichment (Consulta controlada).
- **NIC Argentina (WHOIS)**
  - *Razón:* Relacionar CUITs con activos digitales.
  - *Valor:* Graph de empresas ficticias o dominios defensivos.
  - *Tipo:* LEGALLY_SENSITIVE (Protocolo Whois / Formulario).
  - *Complejidad:* Alta (bloqueos, captchas).
  - *Riesgo:* ALTO.
  - *Estabilidad:* Baja.
  - *Uso:* Enrichment.
  - *Rol:* Edge.

### Fase 4 Monitoreo/Alerts
- **RSS Institucionales (Ministerios / Seguridad)**
  - *Razón:* Eventos policiales o institucionales en tiempo real.
  - *Valor:* Alertas tempranas de operativos o allanamientos.
  - *Tipo:* OPEN_DATA (XML/RSS).
  - *Complejidad:* Baja.
  - *Riesgo:* Bajo.
  - *Estabilidad:* Alta.
  - *Uso:* Monitoreo / Alertas.
  - *Rol:* Enrichment.

### Fase 5 Intelligence/Graph/Scoring
- **Graph de Entidades Sintéticas**
  - *Razón:* Cruce determinístico de IGJ + BORA + COMPR.AR.
  - *Valor:* Generar Aristas probabilísticas (ej. "Persona X que ganó licitación en COMPR.AR comparte domicilio (Georef) con Empresa Y en IGJ").
  - *Tipo:* N/A (Derivado interno).
  - *Complejidad:* Extrema.
  - *Riesgo:* Medio (Falsos positivos reputacionales).
  - *Estabilidad:* Alta (Depende de calidad de datos).
  - *Uso:* Scoring de Riesgo Sistémico.
  - *Rol:* Core final.

## SECCIÓN 5 — ROADMAP DE PRODUCTO EN 5 FASES

### FASE 1 — FOUNDATION + SOURCE DISCOVERY + FIRST CONNECTORS
1. **Objetivo:** Sentar la infraestructura base (Data Lake crudo, Postgres normalizado) e ingerir los datos maestros (geografía, identidades corporativas de IGJ y estadísticas base).
2. **Por qué existe:** Sin un diccionario geográfico (Georef) y un registro semilla de entidades (IGJ), toda ingesta futura colisiona y genera duplicados.
3. **Fuentes (entran):** Datos Argentina (CKAN), API Georef, BA APIs, IGJ (Datos Justicia), SNIC.
4. **Fuentes (NO entran todavía):** BORA, COMPR.AR, DNRPA, BCRA masivo, NIC.ar, Scrapers inestables.
5. **Entregables técnicos:**
   - Schema de DB PostgreSQL con tablas `raw_source`, `normalized_entity`, `normalized_address`.
   - Conector genérico CKAN + descargador ZIP asíncrono.
   - Wrapper interno para consultas a Georef / BA APIs con fallback.
   - Script de seed para cargar histórico de IGJ y SNIC.
6. **Entregables de producto:**
   - API de búsqueda de entidades básica (`GET /api/entities?q=cuit_o_nombre`).
   - Normalizador geográfico interno funcional.
7. **Definition of done:** El pipeline descarga, parsea, valida y guarda en base unificada el dataset IGJ y SNIC. Búsqueda responde < 150ms.
8. **Criterios de go/no-go:**
   - **GO:** Las entidades se insertan sin violación de constrains, las direcciones se resuelven contra Georef con confidence > 0.8.
   - **NO-GO:** Si el parsing del CSV/ZIP falla > 5% de registros, o Georef devuelve timeouts persistentes, se bloquea la fase.
9. **Dependencias:** Infraestructura Postgres/MinIO (S3), orquestador (Celery/Cron).
10. **Riesgos:** Cambios silenciosos en las columnas del dataset IGJ del Ministerio de Justicia.
11. **Mitigaciones:** Implementación de Data Contracts (p.ej. usando Pydantic/Zod). Si falta una columna, falla el build/ingesta y guarda el crudo en cuarentena.
12. **Smoke tests realistas:**
   - `test_ckan_registry_vitality` (ver Sección 6).
   - `test_georef_normalization` (ver Sección 6).
   - `test_igj_schema_lock` (ver Sección 6).
13. **Pruebas de regresión mínimas:** Re-procesar un CSV viejo conocido de IGJ debe generar cero cambios en el estado de la base.
14. **Métricas de calidad:** Latencia Georef < 50ms, Completitud CUIT > 95% en ingesta IGJ.
15. **Quick wins:** Tener un buscador interno rápido (MVP 0.1) que devuelve la ficha básica corporativa.
16. **Deuda técnica aceptable:** Búsqueda en texto completo usando `pg_trgm` en lugar de ElasticSearch/OpenSearch en este punto.
17. **Deuda técnica NO aceptable:** Insertar registros sin un `source_id` o `fetched_at` unívoco. Fallar silenciosamente ante errores de schema.
18. **Criterio de rollback:** Drop de la tabla normalizada, purga de la base y reingesta controlada desde el Raw Data Lake.

### FASE 2 — NORMALIZATION + RAW/BRONZE/SILVER LAYERS
1. **Objetivo:** Habilitar el pipeline documental/no estructurado y de contrataciones (BORA y COMPR.AR) mapeando a la capa Silver (normalizada).
2. **Por qué existe:** Para darle actividad económica y legal a las entidades estáticas de la Fase 1.
3. **Fuentes (entran):** BORA (Boletín Oficial), COMPR.AR, Datos Abiertos SSN, ANAC Estadísticas.
4. **Fuentes (NO entran todavía):** BCRA, NIC, Subastas judiciales cerradas.
5. **Entregables técnicos:**
   - Workers de extracción (Crawlers con Throttling).
   - Servicio OCR/NLP básico para extraer secciones 1, 2 y 3 del BORA.
   - Parsers de tablas HTML dinámicas para COMPR.AR.
6. **Entregables de producto:**
   - Ficha de la entidad ahora muestra "Licitaciones Adjudicadas" y "Avisos Societarios (BORA)".
   - Vista territorial de montos de contratación.
7. **Definition of done:** 30 días de BORA procesados, 5,000 expedientes de COMPR.AR ingeridos y normalizados a esquema común.
8. **Criterios de go/no-go:**
   - **GO:** Los extractores corren de forma idempotente sin duplicar registros.
   - **NO-GO:** Si el scraper de COMPR.AR es bloqueado (403/429), rediseño mandatorio con backoff/proxy ético. No se pasa a producción.
9. **Dependencias:** Sistema de colas robusto (RabbitMQ/Redis) para el scraping lento.
10. **Riesgos:** Bloqueo de IPs por parte del Estado, variaciones en el DOM o PDFs defectuosos en el BORA.
11. **Mitigaciones:** Throttling estricto (1 req/sec), User-Agents de crawler responsable, y cuarentena automática para PDFs que no pasen Regex básicos.
12. **Smoke tests realistas:**
   - `test_bora_daily_fetch`
   - `test_comprar_search_parser`
13. **Pruebas de regresión mínimas:** Re-parser 10 edictos históricos previamente verificados; deben extraer las mismas entidades (CUITs/Nombres).
14. **Métricas de calidad:** Rate de extracción exitosa en BORA > 85%, Tasa de bloqueos HTTP 429 < 1%.
15. **Quick wins:** Buscador interno de Boletín Oficial estructurado por CUIT (imposible nativamente en la web oficial).
16. **Deuda técnica aceptable:** Extracción manual o regex pesados sin LLM para parsers de edictos.
17. **Deuda técnica NO aceptable:** Scrapers sin Kill Switch. Correr crawlers sin timeout.
18. **Criterio de rollback:** Desactivar el Kill Switch del scraper de COMPR.AR/BORA. La plataforma sigue viva con datos estáticos de Fase 1.

### FASE 3 — ENTITY RESOLUTION + GEO ENRICHMENT + SEARCH
1. **Objetivo:** Fusionar y enriquecer. Que un CUIT en COMPR.AR y en IGJ sea la misma entidad lógica, y enriquecer con consultas manuales controladas (BCRA/NIC).
2. **Por qué existe:** Evitar al usuario ver 3 resultados distintos de la misma empresa proveedora. Generar el "Dossier 360".
3. **Fuentes (entran):** BCRA Cheques/Central de Deudores (sólo vía query manual/puntual), NIC.ar (sólo query).
4. **Fuentes (NO entran todavía):** Integraciones masivas de alto riesgo de PII, RSS Institucionales automatizados.
5. **Entregables técnicos:**
   - Motor de resolución de entidades determinístico (Match por CUIT) y probabilístico (Nombre + Distancia Georef).
   - Backend API endpoints para consumir el "Dossier unificado".
   - Integración de OpenSearch o despliegue robusto de índices `pg_trgm`.
6. **Entregables de producto:**
   - Búsqueda global (Google-like) en la UI que consolida toda la info de la entidad.
   - Módulo de "Salud Financiera" (Query en tiempo real contra BCRA vía API interna delegada).
7. **Definition of done:** El matching une correctamente > 95% de los registros con el mismo CUIT sin colisionar entidades distintas. Búsquedas retornan en < 200ms.
8. **Criterios de go/no-go:**
   - **GO:** Falsos positivos (empresas diferentes unidas por error) en test manuales < 1%.
   - **NO-GO:** Si el matching probabilístico une entidades dispares (Ej. dos "Panaderías La Unión" de distintas provincias), se revierte a matching determinístico estricto.
9. **Dependencias:** Cluster de búsqueda (Elastic/OpenSearch).
10. **Riesgos:** Violación de términos de uso si se lanza bulk a BCRA o NIC.
11. **Mitigaciones:** Consumo puramente On-Demand (activado por botón en la UI por el analista). Logging estricto de auditoría para cada query de BCRA.
12. **Smoke tests realistas:**
   - `test_entity_resolution_cuit_merge`
   - `test_bcra_null_tolerance`
13. **Pruebas de regresión mínimas:** Validar que 50 entidades semilla mantienen su Entity ID a través de los ciclos de mergeo nocturnos.
14. **Métricas de calidad:** Latencia de búsqueda < 200ms, Entity fragmentation rate (registros sueltos) < 10%.
15. **Quick wins:** Entregarle al analista OSINT una ficha de empresa que ya tenga compras del estado + advertencia de cheques rechazados en una sola vista.
16. **Deuda técnica aceptable:** UI administrativa minimalista.
17. **Deuda técnica NO aceptable:** Merge automático probabilístico sin un Confidence Score registrado. Queries a BCRA sin audit log.
18. **Criterio de rollback:** Desvincular las aristas del grafo de entidades y volver a mostrar tablas normalizadas crudas.

### FASE 4 — CASE WORKFLOWS + API + UI + WATCHLISTS
1. **Objetivo:** Operationalizar la plataforma, pasando de búsqueda a alertas asíncronas, flujos de trabajo (casos) y una interfaz sólida.
2. **Por qué existe:** El OSINT proactivo requiere monitoreo (Watchlists), no solo búsquedas forenses.
3. **Fuentes (entran):** RSS Ministerios, Actualizaciones Delta de BORA y COMPR.AR.
4. **Fuentes (NO entran todavía):** Grafo predictivo, reglas de scoring mágicas.
5. **Entregables técnicos:**
   - Motor de notificaciones (Event-driven).
   - Auth/Authorization completo (JWT/RBAC).
   - API Gateways para consumo de sistemas externos (API Key management).
6. **Entregables de producto:**
   - UI de Casos/Carpetas de investigación.
   - Creación de Watchlist ("Avisame si CUIT X gana una licitación o aparece en el BORA").
7. **Definition of done:** Las alertas se disparan en menos de 10 min de la ingesta de la novedad, sin duplicados. UI fluida y roles de seguridad aplicados.
8. **Criterios de go/no-go:**
   - **GO:** Las watchlists disparan correos/webhooks con payload correcto.
   - **NO-GO:** Event loop saturado generando alertas duplicadas por fallos de idempotencia.
9. **Dependencias:** SMTP/Servicio de email (SendGrid, AWS SES), Auth Provider (Auth0/Supabase Auth).
10. **Riesgos:** Sobrecarga de notificaciones ("Alert Fatigue") al analista.
11. **Mitigaciones:** Digest diario opcional. Deduplicación estricta de eventos en la cola asíncrona.
12. **Smoke tests realistas:**
   - `test_watchlist_idempotency`
   - `test_api_auth_roles`
13. **Pruebas de regresión mínimas:** Ingestar un evento "fake" antiguo debe ser ignorado silenciosamente por el motor de alertas.
14. **Métricas de calidad:** Latencia de entrega de evento < 1 min desde ingesta, Tasa de falsos positivos en alertas = 0.
15. **Quick wins:** Envío de un "Brief Matutino" automático al analista con novedades en jurisdicciones de interés.
16. **Deuda técnica aceptable:** Diseño visual no pulido, emails en texto plano al inicio.
17. **Deuda técnica NO aceptable:** Falta de idempotencia en procesamiento de eventos.
18. **Criterio de rollback:** Apagar el motor de workers de notificaciones (Celery Queue pause).

### FASE 5 — RISK ENGINE + GRAPH + ALERTING + HARDENING
1. **Objetivo:** Incorporar grafo real (relaciones societarias indirectas), motor de scoring explicable (due diligence automatizado) y auditoría final legal.
2. **Por qué existe:** Es el pináculo de la inteligencia: no buscar datos, sino que el sistema infiera y proponga los riesgos ("Empresa X comparte misma sede social que Proveedor Sancionado Y").
3. **Fuentes (entran):** Consolidación total. Cruces masivos entre BORA, IGJ y Georef.
4. **Fuentes (NO entran):** Atribuciones adivinatorias (modelos de ML de caja negra).
5. **Entregables técnicos:**
   - Integración de BD Orientada a Grafos (Neo4j o Postgres AGE).
   - Motor de Reglas (Rule Engine) escrito explícitamente (ej. YAML/JSON).
6. **Entregables de producto:**
   - Visualizador de grafo de entidades (Nodos y Aristas).
   - Panel de Scoring de Riesgo por Proveedor con "Explainability" claro.
7. **Definition of done:** Grafo renderizado. El "Risk Score" se genera al vuelo y muestra explícitamente sus componentes (Ej: Score 80 = 50 por Deuda + 30 por Sanción).
8. **Criterios de go/no-go:**
   - **GO:** Las consultas al grafo resuelven 3 grados de separación en < 1 segundo. El Score es 100% auditable.
   - **NO-GO:** Si el cálculo del Risk Score depende de inferencias mágicas o ML opaco que el área de Compliance no puede justificar ante un juez o auditor, no se despliega.
9. **Dependencias:** Infraestructura de Grafo. Revisión legal pre-deploy.
10. **Riesgos:** Demandas o problemas legales por calificar mal a una entidad basados en datos desactualizados o errores de grafo.
11. **Mitigaciones:** Exención de responsabilidad (Disclaimer UI) obligatoria. El score es una recomendación de revisión, no una verdad absoluta. Exclusión de PII sensible del cálculo.
12. **Smoke tests realistas:**
   - `test_scoring_explainability`
   - `test_graph_traversal_speed`
13. **Pruebas de regresión mínimas:** Modificar un threshold de una regla debe recalcular correctamente el score solo de las entidades afectadas.
14. **Métricas de calidad:** Latencia de visualización del grafo (hasta 50 nodos) < 1s, Audits legales pasados sin observaciones.
15. **Quick wins:** Mapa de influencias ("Este funcionario aprobó licitaciones a estas 3 empresas con domicilios adyacentes").
16. **Deuda técnica aceptable:** Grafo sin layout ultra-optimizado visualmente.
17. **Deuda técnica NO aceptable:** Calcular un Risk Score que no registre la versión de los datos y las reglas con las que se generó.
18. **Criterio de rollback:** Desvincular el módulo UI de grafo y volver a la vista tabular de la Fase 4.

## SECCIÓN 6 — SMOKE TESTS REALISTAS POR FASE

### Fase 1
- **test_ckan_registry_vitality**
  - *Objetivo:* Validar que el portal Datos Argentina responde y el formato del registro CKAN no mutó drásticamente.
  - *Precondiciones:* Sistema con acceso a Internet libre.
  - *Input:* GET `http://datos.gob.ar/api/3/action/package_show?id=seguridad-estadisticas-criminales-republica-argentina`
  - *Salida esperada:* 200 OK. JSON con key `result` y al menos un elemento en el array `resources` con url de descarga accesible.
  - *Criterios de falla:* 404/5xx, o el JSON no contiene la estructura `result.resources`.
  - *Severidad:* ALTA (CRÍTICA). Rompe todo el orquestador CKAN.
  - *Bloquea release:* SÍ.
  - *Evidencia a capturar:* Body de la respuesta JSON truncado y Status Code.
  - *Frecuencia:* Diaria o en cada deploy del Ingestion Agent.
- **test_georef_normalization**
  - *Objetivo:* Confirmar precisión del SDK interno de estandarización sobre la API oficial.
  - *Precondiciones:* API `apis.datos.gob.ar` operativa.
  - *Input:* `GET apis.datos.gob.ar/georef/api/v2.0/direcciones?direccion=Av.%20Corrientes%201234&provincia=CABA`
  - *Salida esperada:* JSON con `cantidad > 0`, `nomenclatura` consolidada ("AVENIDA CORRIENTES 1234, Ciudad Autónoma de Buenos Aires").
  - *Criterios de falla:* Retorna cantidad 0 para una dirección hiper conocida, o timeout > 5s.
  - *Severidad:* MEDIA. Afecta calidad de Entity Resolution futura.
  - *Bloquea release:* SÍ.
  - *Evidencia:* Par key-value normalizado.
  - *Frecuencia:* En pipeline PR (unit testing de integraciones).
- **test_igj_schema_lock**
  - *Objetivo:* Detectar alteraciones estructurales en el CSV de entidades IGJ de Justicia.
  - *Precondiciones:* Archivo mock de IGJ CSV disponible local o mock URL.
  - *Input:* CSV crudo original con 5 filas válidas, insertado al parser.
  - *Salida esperada:* Parseador extrae exactamente 5 entidades con los headers obligatorios (`cuit`, `razon_social`, `fecha_contrato`).
  - *Criterios de falla:* Exception de esquema, o algún CUIT se parsea como Nulo.
  - *Severidad:* ALTA. Ensucia base maestra.
  - *Bloquea release:* SÍ.
  - *Evidencia:* Logs de Pydantic/Zod validator errors.
  - *Frecuencia:* Cada vez que se descarga un nuevo CSV (pre-ingesta real).

### Fase 2
- **test_bora_daily_fetch**
  - *Objetivo:* Verificar que la estructura de la web y descarga del Boletín Oficial se mantiene.
  - *Precondiciones:* BORA publicado hoy en la sección primera.
  - *Input:* Scraping inicial sobre `boletinoficial.gob.ar` para sección 1 y fecha `TODAY`.
  - *Salida esperada:* Descarga de al menos 1 archivo PDF o HTML de edicto.
  - *Criterios de falla:* Selector de la UI devuelve None, o PDF mal formado.
  - *Severidad:* MEDIA (Se asume inestabilidad oficial).
  - *Bloquea release:* NO (Activa alerta operativa para actualizar conector, pero el build pasa).
  - *Evidencia:* Header del archivo bajado.
  - *Frecuencia:* Diaria en CRON.
- **test_comprar_search_parser**
  - *Objetivo:* Asegurar que los selectores CSS/Regex del crawler de COMPR.AR siguen vigentes.
  - *Precondiciones:* Ninguna.
  - *Input:* Búsqueda pública en COMPR.AR (ej: jurisdicción="Ministerio de Salud").
  - *Salida esperada:* Tabla parseada, extrayendo "Número de Expediente" y "Objeto".
  - *Criterios de falla:* Tabla vacía o selectores que lanzan excepción.
  - *Severidad:* ALTA operativa. Kill switch automático al fallar.
  - *Bloquea release:* SÍ (para deploy de cambios del scraper).
  - *Evidencia:* Objeto JSON de muestra del expediente extraído.
  - *Frecuencia:* Semanal / Cada PR del crawler.

### Fase 3
- **test_entity_resolution_cuit_merge**
  - *Objetivo:* Validar la lógica de colisión en DB cuando entra un mismo CUIT desde 2 fuentes.
  - *Precondiciones:* Base vacía de testing (Entity Table).
  - *Input:* Ingestar Source A (IGJ) con CUIT 30-11111-0, luego Source B (COMPR.AR) con el mismo CUIT 30-11111-0.
  - *Salida esperada:* La base muestra 2 filas en `raw_source`, pero exactamente 1 sola fila `entity_id` en la tabla maestra consolidada.
  - *Criterios de falla:* Aparecen 2 entidades lógicas distintas o falla la constraint unique.
  - *Severidad:* CRÍTICA (Falla estructural core).
  - *Bloquea release:* SÍ.
  - *Evidencia:* Query result `count(*)` de entidades para ese CUIT.
  - *Frecuencia:* CI/CD en todo PR backend.
- **test_bcra_null_tolerance**
  - *Objetivo:* Asegurar Graceful Degradation al consultar la Central de Deudores con un CUIT inválido o sin deudas.
  - *Precondiciones:* Wrapper BCRA activado.
  - *Input:* `GET {api_bcra}/CentralDeDeudores/v1.0/Deudas/12345678` (inválido).
  - *Salida esperada:* Manejo controlado del 404. El scraper no lanza excepción no controlada, retorna payload vacío limpio `{}` o array vacío.
  - *Criterios de falla:* Unhandled Promise Rejection, o la app se crashea.
  - *Severidad:* ALTA operativa.
  - *Bloquea release:* SÍ.
  - *Evidencia:* Stack trace vacío y objeto retornado.
  - *Frecuencia:* Pipeline de tests.

### Fase 4
- **test_watchlist_idempotency**
  - *Objetivo:* Garantizar que no hay "fatiga de alertas" por inyecciones repetidas.
  - *Precondiciones:* 1 Watchlist configurada activa en Test DB, sistema de mensajería mockeado.
  - *Input:* Insertar el evento "Licitación Ganada CUIT 33-33333-3" dos veces en milisegundos a la cola asíncrona.
  - *Salida esperada:* El contador de envío de mail (o inserción en buzón de UI) se incrementa exactamente 1 vez.
  - *Criterios de falla:* Se envían 2 notificaciones al usuario por el mismo evento ID.
  - *Severidad:* MEDIA (Grave a nivel producto/UX).
  - *Bloquea release:* SÍ.
  - *Evidencia:* Conteo final de la bandeja mock.
  - *Frecuencia:* CI/CD.
- **test_api_auth_roles**
  - *Objetivo:* Validar protección de endpoints según RBAC.
  - *Precondiciones:* Roles configurados (Analista, Admin).
  - *Input:* Request a `DELETE /api/entity/UUID` con token de rol Analista.
  - *Salida esperada:* HTTP 403 Forbidden.
  - *Criterios de falla:* HTTP 200, 401 o 500.
  - *Severidad:* CRÍTICA (Seguridad).
  - *Bloquea release:* SÍ.
  - *Evidencia:* Status code HTTP devuelto.
  - *Frecuencia:* CI/CD en endpoints críticos.

### Fase 5
- **test_scoring_explainability**
  - *Objetivo:* Demostrar que el algoritmo de riesgo nunca es una caja negra.
  - *Precondiciones:* Entidad de test pre-cargada con métricas pre-cruzadas (e.g. 2 cheques denunciados simulados).
  - *Input:* Petición GET al risk engine para la entidad.
  - *Salida esperada:* JSON que incluye el score (e.g., `85`) y un array explícito `reasons: ["HIGH_BOUNCED_CHECKS", "RECENT_SANCTION"]`.
  - *Criterios de falla:* El array `reasons` está vacío o nulo cuando el score no es neutral.
  - *Severidad:* ALTA (Implicancias operacionales/compliance).
  - *Bloquea release:* SÍ.
  - *Evidencia:* Payload del score y reasons.
  - *Frecuencia:* Pipeline PR motor de riesgo.
- **test_graph_traversal_speed**
  - *Objetivo:* Validar tiempos de respuesta de Neo4j / Postgres AGE (Performance).
  - *Precondiciones:* DB grafo con 10,000 nodos (datos sintéticos).
  - *Input:* Cypher Query o SQL recursivo pidiendo 3 grados de conexión de una entidad ruteadora.
  - *Salida esperada:* Query resuelto en `< 800ms`.
  - *Criterios de falla:* Timeout del query (>2s) o CPU spike del host de base de datos.
  - *Severidad:* MEDIA (No rompe, pero degrada gravemente UX).
  - *Bloquea release:* NO, pero reporta WARN en logs.
  - *Evidencia:* Execution time registrado por la base.
  - *Frecuencia:* Tests de stress nocturnos.

## SECCIÓN 7 — MATRIZ DE CONECTORES Y ESTRATEGIA DE INGESTIÓN

| Tipo Conector | Cuándo SÍ usarlo | Cuándo NO usarlo | Patrón de extracción | Throttling por host | Retries | Timeouts | Caching | Checksum / Versionado | Dedupe | Schema validation | Observabilidad / Logging | Manejo de errores | Kill switch | Costo operativo | Fragilidad | Fase a Prod |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **CKAN connector** | Catálogos (Datos Ar, PBA) | Para buscar datos en vivo / realtime | Discovery (`package_search`) -> Metadata (`package_show`) -> Descarga de `resource.url` | 10 req/s | 3x con backoff (1s, 2s, 4s) | 30s | Metadata por 24h | MD5 del recurso, versionar metadata | Ignorar si el MD5 no cambia | Strict Pydantic/Zod en metadatos | Loggea cambios de schema y count de resources | Falla controlada si un resource 404, alerta warning | NO necesario (es oficial y estable) | Bajo (API REST estándar) | Baja | Fase 1 |
| **API REST connector** | Georef, BCRA, BA APIs | Portales no documentados / endpoints ocultos | GET puntual o POST batch oficial | 5 req/s (BCRA: 1 req/s) | 3x exponencial para 5xx, 0 para 4xx | 15s | Redis 30 días (Geocoding/CUITs estáticos) | N/A (Response JSON inmutable) | Upsert sobre Entity Table / Cache hit | Strict (fallar si faltan campos base) | Latencia p95, HTTP codes (429/500), Request ID | Graceful degradation (ej. fallback a Regex si Georef cae) | SÍ (mandatorio para evitar penalizaciones 429 masivas) | Medio (Requiere Redis/Cache y rotación) | Media | Fase 1, 3 |
| **CSV/XLSX downloader** | IGJ, SNIC, SSN | Datos en tiempo real transaccional | File GET -> File Stream -> Parser por chunks | N/A (Descarga bulk) | 3x (Resume stream si soporta Ranged bytes) | 5m (Archivos grandes) | N/A (Descarga completa a MinIO) | SHA256 del archivo completo, guardado en `raw_lake` | Ingestar solo si SHA256 es nuevo | Loose (Ignorar columnas nuevas, fallar si faltan claves) | Filas parseadas vs Filas en error, Bytes bajados | Mover archivo a Cuarentena si el parser falla > 10% de filas | NO (Corre en cron programado asíncrono) | Bajo/Medio (Storage S3 + Workers) | Baja | Fase 1, 2 |
| **RSS/Atom connector** | Noticias de seguridad, comunicados | Páginas HTML sin feed oficial | XML Parse -> Extract link/title/pubDate -> Download content | 1 req/min | 2x | 10s | Memoria en Worker (Guids ya vistos) | Hash del GUID/Enclosure | Hash en BD para saltar insert duplicado | Minimal (asegurar `pubDate` y `link`) | Count de nuevas entradas procesadas | Ignorar entradas malformadas silenciosamente | NO | Muy Bajo | Baja | Fase 4 |
| **Sitemap/news connector** | BORA diario, sitios estáticos | Blogs pequeños (usar RSS mejor) | Parse `sitemap.xml` -> Filtrar por `<lastmod>` hoy -> Extract URLs | 1 req/s | 3x | 30s | N/A | MD5 del contenido HTML crudo extraído | MD5 de la URL | Minimal | URLs descubiertas vs Procesadas | Alertar si sitemap da 404 continuo | SÍ (Si el sitio cambia dominio/estructura) | Medio (Storage HTML) | Media | Fase 2 |
| **WMS/WFS connector** | IDERA, IGN | Análisis tabular masivo sin visualización | Query bounding box o request de features (GeoJSON) | 2 req/s | 3x | 60s | Tile cache local / PostGIS snapshot | Versionado temporal del dataset | EPSG bounds dedupe (ignorar fuera de ARG) | Geometry validation (`ST_IsValid`) | Errores de OGC exception report | Fallback a capa pre-cacheada local | NO | Alto (Procesamiento Geoespacial DB) | Alta (Nodos provinciales lentos) | Fase 2 |
| **HTML parser con guardrails** | COMPR.AR, CONTRAT.AR | Si existe API oculta, JSON endpoint o CSV | Fetch HTML -> Chequear Selectores Core (ej. Tabla `id="resultados"`) -> Extraer a JSON | 1 req/3s (Aleatorio) | 2x (Solo para 500s) | 30s | Cache HTML completo en S3 antes de parsear | Hash del DOM relevante (tabla central) | Hash de la fila (Expediente + Monto + CUIT) | Fallar inmediatamente si el selector CSS no halla nada | Fallos de parseo por selector, Captchas detectados | Auto-suspensión (Kill Switch) ante 3 fallos de CSS seguidos | Alto (Mantenimiento de spiders + proxies si hay IP ban) | Alta (Cambios de UI sin aviso) | Fase 2 |
| **WHOIS query adapter** | NIC.ar | Barridos bulk indiscriminados | TCP 43 Whois Request / Form POST controlado | 1 req/10s (Estricto) | 1x | 15s | Cache de resultados Whois (30-90 días mínimo) | N/A | Cache por dominio consultado | Parsing estructurado de Registrante/Contacto | Consultas rate-limited, IPs bloqueadas | Degradación de confidence a "Unknown", alerta legal (abuse limit) | SÍ (Crucial para no quemar la IP del servidor en NIC) | Medio (Rotación pasiva, límites) | Alta | Fase 3 |
| **Manual-review connector** | Subastas complejas, Deudores BCRA | Todo proceso automatizable bulk | UI File Upload (Analista) / Botón "Fetch Now" | Manual | N/A | N/A | Documento original al Lake (inmutable) | MD5 del PDF subido o texto ingresado | Hash de contenido | Esquema forzado por analista al clasificar | Audit Log (Quién subió, cuándo y por qué) | Rechazar archivo/query al instante si no matchea regex | N/A | Bajo técnico, Alto HH (Humano) | Nula | Fase 3, 5 |
| **File-drop/import connector** | Declaraciones Juradas, XLSX provinciales raros | Sources que tienen API/CKAN | Cron vigila S3 Bucket por un "Drop" -> Dispara DAG Airflow/Celery | N/A | N/A | 1h max | N/A | Hash y versionado del archivo en MinIO/S3 | Row hash (ignorar si misma tupla existe) | Validar headers predefinidos por un config YAML | Notificación Slack/Email con reporte (Filas OK, Filas ERROR) | Alertar al dev si el archivo es ininteligible, mover a /error/ | NO | Bajo | Media | Fase 2, 4 |

## SECCIÓN 8 — MODELO DE DATOS UNIFICADO (ARGENTINA-FIRST)

**Principios del diseño:**
* Estructura columnar (lógica) para la normalización en Postgres.
* El modelo separa rígidamente la extracción (Source/Dataset) del registro atómico (Raw/Normalized Record), de la entidad resuelta (Entity/Node) y de la relación (Graph Edge).

**A. Tablas Core (Metadatos e Ingesta):**
- `source_id` (PK, UUID)
- `source_name` (String, e.g. "IGJ", "COMPR.AR")
- `source_type` (Enum: API, CKAN, CSV, CRAWLER, MANUAL)
- `source_url` (String)
- `source_license` (String, e.g. "Open Data", "Copyright")
- `source_classification` (Enum: OPEN_DATA, PUBLIC_QUERY, LEGALLY_SENSITIVE, RESTRICTED)
- `source_host` (String, para throttling, e.g. "datos.gob.ar")
- `source_priority` (Integer: 1-100. P.ej. AFIP > IGJ > Web scraping)
- `dataset_id` (UUID, referencia al paquete CKAN o archivo específico)
- `dataset_name` (String)
- `dataset_version` (String / Datetime)

**B. Tablas Transaccionales (Normalized Record):**
- `record_id` (PK, UUID)
- `raw_reference` (JSONB o Pointer a Object Storage en S3 con el JSON/HTML original inmutable)
- `fetched_at` (Timestamp inmutable de ingesta)
- `published_at` (Timestamp original de la fuente, ej. Fecha del Boletín)
- `effective_date` (Timestamp operativo, ej. Fecha de adjudicación o constitución societaria)
- `update_date` (Timestamp de actualización en nuestro DB)
- `event_type` (Enum: CONSTITUTION, ADJUDICATION, SANCTION, BOUNCED_CHECK, NEWS)

**C. Entidades y Tributos (Resolved Entity - Nodo del Grafo):**
- `entity_id` (PK, UUID, Entidad lógica agrupada)
- `entity_type` (Enum: PERSON, COMPANY, GOV_AGENCY, LOCATION)
- `entity_subtype` (Enum: SA, SRL, COOPERATIVA, MUNICIPIO)
- `cuit` (String, 11 dígitos numéricos limpios. Clave Candidata principal)
- `dni` (String, numérico)
- `person_names` (Array de Strings)
- `org_names` / `company_name` (String, Razón Social)
- `domain_names` (Array de Strings)
- `vehicle_plate` (String, USO EXCEPCIONAL CON GUARDRAILS)
- `confidence_score` (Float 0.0-1.0 de la fusión de identidad)
- `risk_score` (Integer 0-100, calculado asíncronamente)
- `pii_risk` (Enum: LOW, MODERATE, HIGH, CRITICAL)
- `legal_classification` (Enum heredado de la fuente más restrictiva que lo compone)
- `review_status` (Enum: AUTO_MERGED, NEEDS_REVIEW, MANUAL_VERIFIED, REJECTED)
- `notes` (Texto libre para el analista)

**D. Territorial y Geografía (Normalized Address):**
- `address_id` (PK, UUID)
- `jurisdiction` (String, Nacional, Provincial, Municipal)
- `province` (String, Código normalizado ISO-3166-2:AR / Georef)
- `municipality` (String, ID Georef)
- `locality` (String, ID Georef)
- `neighborhood` (String)
- `address` (String original crudo)
- `normalized_address` (String devuelto por Georef/BA APIs)
- `lat` (Float, -90 a 90)
- `lon` (Float, -180 a 180)
- `geocode_confidence` (Float 0.0 a 1.0. Ej: 1.0=Parcela CABA, 0.4=Centroide Provincia)

**E. Eventos Operativos (Licitaciones, Normativas, Causas):**
- `case_number` / `expediente` (String normalizado, e.g. "EX-2023-12345678- -APN-DIR#MIN")
- `contract_id` / `tender_id` (String de la plataforma de compras)
- `sanction_flag` (Boolean, true si el evento es negativo)
- `amount` (Decimal/Numeric)
- `currency` (String, ARS/USD)
- `title` (String, Título del aviso o licitación)
- `summary` (Texto libre / Descripción del objeto de contratación)
- `tags` (Array de Strings, e.g. ["Obra Pública", "Salud"])

**Reglas Base del Modelo:**
- **Precedence:** CUIT/AFIP/IGJ mandan sobre scraping comercial. Si el nombre de la empresa difiere, el Entity adopta el de mayor `source_priority`, guardando el otro como alias histórico (`raw_reference`).
- **Nullability:** TODO campo descriptivo permite Nulos, excepto PKs, IDs de Source y `fetched_at`. El CUIT no puede ser Not Null universalmente porque hay empresas extranjeras o ministerios públicos sin CUIT explícito en algunos datasets.
- **Conflictos:** Resueltos dejando inmutable el Raw, y reescribiendo el Entity Node con un nuevo `update_date`.
- **Soft Deletes:** NADA se borra. Las entidades falsas o colisionadas se marcan `review_status = REJECTED` o `is_active = false`.
- **Lineage:** El grafo rastrea cada `Entity` de vuelta a 1 o más `Normalized Record` de la tabla B.
- **Diferenciación:** Raw (JSON/HTML en S3) -> Normalized (Fila en DB con tipado fuerte, Ej. Tabla `comprar_contracts`) -> Resolved Entity (Nodo Empresa A) -> Graph Edge (Empresa A [ADJUDICADO_EN] -> Contrato Z) -> Alert Event (Redis pub/sub: "Nuevo Contrato para Empresa A").

## SECCIÓN 9 — RESOLUCIÓN DE ENTIDADES Y REGLAS DE MATCHING

El Entity Resolution (ER) no puede ser una caja negra estadística; en investigación de due diligence un falso positivo destruye la credibilidad.

*   **Matching Exacto:**
    *   **Claves Fuertes:** CUIT y DNI limpios (sin guiones/puntos). En Argentina, el CUIT es inmutable y unívoco por entidad tributaria/jurídica. Es la base principal.
    *   **Regla Exacta:** `CUIT_A == CUIT_B` -> Merge automático incondicional (Confidence 1.0).
*   **Matching Probabilístico:**
    *   **Claves Débiles:** Razón Social, Nombre de Fantasía, Dirección original (`address`), Teléfono, Dominio de Internet (`domain_names`).
    *   **Regla Probabilística:** Razón Social con similitud trigrama (`pg_trgm.similarity`) > 0.85 + `municipality` (Georef) coincidente = Match Potencial.
*   **Umbrales Operativos:**
    *   **Score >= 0.95:** Auto-merge (ej. CUIT coincide o Nombre Exacto + Dirección Exacta normalizada).
    *   **Score 0.75 - 0.94:** Queue de Revisión Manual (`NEEDS_REVIEW`). El sistema crea dos Entidades aisladas pero sugiere el vínculo al analista en UI.
    *   **Score < 0.75:** Consideradas entidades completamente diferentes. No se vinculan.
*   **Razones Sociales con Variantes:** (Ej. "Constructora San Martín S.A.", "Const. San Martin", "CSM S.A."). Se limpian sufijos societarios antes de comparar (S.A., SRL, SH, UTE). Manda CUIT; si no hay CUIT, el match va a Queue Manual.
*   **Domicilios Conflictivos:** Varias empresas en "Florida 141, Piso 2, CABA". Común en estudios contables (domicilio legal constituido). Se prohíbe el auto-merge basado SÓLO en domicilio si se trata de oficinas conocidas (identificables por alta densidad de CUITs en la misma lat/lon).
*   **Dominios asociados:** Un dominio .ar se vincula probabilísticamente si su Titular en WHOIS matchea CUIT o Razón Social estricta, pero NO se hace auto-merge solo por similitud de strings (ej. "claro.com.ar" vs la empresa "Claro SA", se marca como edge posible pero requiere confirmación).
*   **Entidades Públicas:** Municipios y Ministerios a menudo licitan sin exponer su propio CUIT. Se consolidan por un diccionario manual de sinónimos base (ej. "Min. Seguridad", "Ministerio de Seguridad de la Nación" -> ID `GOV_MINSEG`).
*   **Personas (PII baja evidencia):** "Juan Pérez". Altísima colisión. Se prohíbe terminantemente el merge de personas sin al menos DNI + coincidencia de domicilio electoral (si estuviera legalmente accesible) o participación en la misma sociedad en IGJ.
*   **Falsos positivos (Ejemplo real):** Empresa "Panadería La Central" (San Luis) y "Panadería La Central" (Tucumán). Evitado usando el campo `province` normalizado como barrera absoluta (si `province` es distinto, max score penalizado en -0.5).
*   **Enriquecimiento Erróneo:** Si se detecta un merge falso posterior, el sistema usa el `Entity Lineage` para desenganchar los records del CUIT equivocado y recalcular los grafos (Entity Split/Rollback asíncrono).

## SECCIÓN 10 — TAXONOMÍA DE ENTIDADES Y EVENTOS ARGENTINA-FIRST

**A. Nodos Base (Entidades)**
*   **PERSON:** Persona Física (Individuo, Empleado, Director).
*   **PERSON_OFFICIAL:** Funcionario Público (PEP, requiere DNI/CUIT verificado y nombramiento BORA).
*   **ORG_CORPORATE:** Empresa, Razón Social, Sociedad (S.A., S.R.L., SAS).
*   **ORG_NONPROFIT:** Asociación Civil, Fundación, Cooperativa, Mutual, Sindicato.
*   **ORG_GOV:** Organismo Público, Ministerio, Municipio, Poder Judicial.
*   **ORG_VENDOR:** Proveedor del Estado (Subtipo de ORG_CORPORATE inscripto en SIPRO/COMPR.AR).
*   **LOCATION:** Ubicación, Parcela, Dirección Normalizada, Coordenada.
*   **ASSET_VEHICLE:** Vehículo, Automotor, Maquinaria Agrícola.
*   **ASSET_VESSEL:** Embarcación (Matrícula Rey).
*   **ASSET_AIRCRAFT:** Vuelo, Aeronave (LV-XXX).
*   **ASSET_REALESTATE:** Inmueble, Partida Catastral.
*   **DIGITAL_DOMAIN:** Dominio web (.ar, .com), IPv4/IPv6, AS Number.
*   **TELCO_OPERATOR:** Operador TIC, ISP, licenciatario ENACOM.
*   **TELCO_LINE:** Línea telefónica, Número geográfico (Prefijo).
*   **DOC_LEGAL:** Documento normativo, Ley, Decreto, Resolución BORA.
*   **DOC_CONTRACT:** Contrato, Licitación, Adjudicación, Expediente de Obra Pública.
*   **DOC_CASE:** Causa judicial, Expediente Judicial, Edicto, Subasta.
*   **INCIDENT_CRIME:** Incidente criminal, Hecho SNIC, Mapa del Delito CABA.

**B. Aristas y Eventos (Events/Edges)**
*   **SOC_INCORPORATION:** Constitución societaria inicial (Vincula Personas a ORG_CORPORATE, Fuente: IGJ).
*   **SOC_BOARD_UPDATE:** Cambio de autoridades / directorio (Fuente: BORA).
*   **TENDER_OPENED:** Apertura de licitación, pre-pliego (Vincula ORG_GOV a DOC_CONTRACT).
*   **CONTRACT_AWARDED:** Adjudicación firmada (Vincula ORG_VENDOR a DOC_CONTRACT, Fuente: COMPR.AR).
*   **FIN_DEBT_UPDATE:** Actualización de deuda financiera (Vincula Entidad a Central Deudores).
*   **FIN_CHEQUE_BOUNCED:** Cheque rechazado denunciado (Fuente: BCRA Cheques).
*   **DIG_DOMAIN_REG:** Alta de dominio / Transferencia (Fuente: WHOIS / DNS).
*   **DIG_DNS_CHANGE:** Cambio de resolución DNS (Fuente: Infra externa pasiva).
*   **INCIDENT_LOGGED:** Nuevo incidente criminal agregado a la grilla (Fuente: SNIC / Ministerio).
*   **ASSET_AUCTIONED:** Nueva subasta judicial/pública programada (Fuente: BORA / Jus).
*   **DOC_LAW_PUBLISHED:** Nueva norma / decreto promulgado.
*   **GOV_SANCTION:** Sanción, Inhabilitación de Proveedor, Multa (Fuente: Contrataciones Públicas / Transparencia).
*   **GOV_BUDGET_UPDATE:** Update de presupuesto o nivel de ejecución oficial.
*   **MOBILITY_LOGGED:** Nuevo dato de movilidad (Fuente: API Transporte CABA / Vuelos).

## SECCIÓN 11 — LÍMITES LEGALES Y OPERATIVOS

La plataforma no puede ser un liability legal. La clasificación es estricta:

*   **A. Lo que es CORE y Seguro (Open Data, uso libre e incondicional):**
    *   Datos Argentina, API Georef, SNIC (Agregados), IGJ (Bases públicas de Jus), BORA (Ley y Normativas generales), BA APIs.
*   **B. Lo que es Usable con Guardrails (Requiere throttling, no abusar de rate limits):**
    *   COMPR.AR, CONTRAT.AR (Scraping de tablas HTML no es ilegal pero abusar rompe la infraestructura). Resoluciones de SSN y ENACOM. Cheques Rechazados BCRA (es open data pero sensible).
*   **C. Lo que SÓLO admite Consulta Manual (No automatizable, requiere input del usuario):**
    *   Central de Deudores BCRA: NO scrapear masivamente para pre-calcular perfiles crediticios universales de ciudadanos; usar sólo si el analista tiene un caso justificado (Due Diligence corporativo).
    *   NIC.ar (WHOIS): Uso restringido por TOS. Consulta puntual por investigación. No hacer copias maestras del listado completo.
*   **D. Lo que NO debe entrar en Producto (Prohibido):**
    *   Padrón Electoral crudo conteniendo domicilios habitacionales de millones de personas físicas no políticamente expuestas.
    *   Datos de menores o identidades protegidas publicadas accidentalmente en edictos judiciales crudos.
*   **E. Lo que requiere Revisión Legal Previa antes de escalar a features:**
    *   Automated Scoring: Asignar un "Score de Riesgo 99/100" a una persona física basado en deuda pública. (Posible riesgo de violación de Ley de Protección de Datos Personales si es opaco o incorrecto). Todo scoring debe ser explicable, determinístico y priorizar Entidades Jurídicas Comerciales sobre personas privadas.
*   **F. Lo que NO debe Scrapearse Masivamente (Risk/Ban):**
    *   DNRPA (Titularidad Vehicular y Patentes). No existe un dataset bulk abierto oficial y ético utilizable como producto. Intentar romper captchas de DNRPA es fraude a infraestructura oficial y se excluye del scope operativo.
    *   Portales del Poder Judicial de la Nación (PJN) y sistemas de consulta de causas sin API, que penalizan direcciones IP agresivas y contienen información sensible sin anonimizar (domicilios, causas de familia).
    *   Medios periodísticos de alcance nacional con copyright y paywall activo.

*Manejo de PII, Minimización y Consentimiento:*
El principio base es usar "Interés Legítimo" (Prevención de Fraude, Cumplimiento Normativo / Due Diligence corporativo, Interés Público / Transparencia Estatal). Si un dato no contribuye a estas finalidades operacionales (ej. religión, preferencias, o domicilio personal no constituido legalmente), se descarta en el pipeline de Ingesta (Minimización) antes de llegar al Lake. Todas las lecturas del sistema sobre bases B y C dejan un Audit Trail detallado ligado al JWT del Analista.

## SECCIÓN 12 — ARQUITECTURA TÉCNICA RECOMENDADA

Para un MVP con criterio de escala racional, sin modas injustificadas, que soporte el flujo OSINT:

*   **Source Registry / Configuration:** Base Postgres y configuración en YAML para registrar las fuentes, SLAs y dueños.
*   **Scheduler & Ingestion Workers:**
    *   **Python + Celery / Temporal:** Robusto para manejar timeouts, retries y backoffs exponenciales obligatorios (ej. Scraping BORA/COMPR.AR o descargas ZIP grandes de IGJ). Temporal es superior para flujos crónicos, Celery/Redis si el equipo domina Python tradicional.
*   **Raw Storage (Data Lake):**
    *   **MinIO (Compatible S3):** Para almacenar JSONs crudos, PDFs del Boletín Oficial, XMLs, y dumps CSV inmutables. Costo-efectivo, hosteable on-prem/cloud.
*   **Normalized & Entity Store (Data Warehouse Operativo):**
    *   **PostgreSQL:** El motor central, gestionado (Neon, Supabase o AWS RDS). Sólido para el esquema relacional riguroso (`entities`, `contracts`), uniones determinísticas, y soporte GIS (`PostGIS`) para las coordenadas de Georef/CABA.
*   **Search Index:**
    *   **OpenSearch:** (o Elasticsearch básico) alimentado asíncronamente (Logstash/Debezium) desde Postgres. Obligatorio para búsqueda probabilística full-text ("Google-like search") ultra-rápida sobre 20 millones de CUITs/Adjudicaciones.
*   **Graph Store (Alternativa al MVP tardío):**
    *   Postergado en Fases 1-3 (usar Recursive CTEs de Postgres si hace falta). En Fase 5, saltar a **Neo4j** para calcular N-grados de separación (Ej: "Persona -> Sociedad -> Licitación -> Municipio").
*   **Alerting Engine & Rule Engine:**
    *   Worker asíncrono (Python) escuchando una cola Redis de eventos nuevos, ejecutando reglas determinísticas simples cargadas en JSON (`IF monto > X AND ente = Y -> ALERTA`).
*   **Review Queue & Admin Console:**
    *   Backend Node/TypeScript + React (stack existente "Radar"). Panel donde los analistas pueden resolver colisiones CUIT/Nombre (Entity Merge UI).
*   **Observability & Audit Log:**
    *   Grafana + Prometheus para métricas del sistema (Latency, Error rates).
    *   Logs de negocio y auditoría a tabla segregada de PostgreSQL (append-only) para trazar quién consultó la Central del BCRA.
*   **Secret Handling & Feature Flags / Kill Switches:**
    *   Variables de entorno (`.env`, Vercel Secrets).
    *   `Kill Switches` implementados a nivel base de datos (`source_registry.is_active = FALSE`). El orquestador lee este flag antes de ejecutar cada tarea del conector.

## SECCIÓN 13 — CONTRATOS DE DATOS Y CALIDAD

Para evitar "Basura entra, Basura sale" en OSINT y falsos positivos críticos:

*   **Data Contracts por Fuente (Pydantic / JSON Schema):** Obligatoriedad. El conector (ej. CKAN, IGJ, COMPR.AR) solo puede escribir en el `raw_lake` si y solo si el JSON de salida aprueba un schema (validando tipos de datos).
*   **Schema Checks:** Si cambian las columnas del CSV del SNIC o del BORA, la validación falla (Error: "Columna 'razon_social' no encontrada en el header").
*   **Freshness Checks:** Si el Boletín Oficial (Diario) no tiene un registro nuevo tras 48h hábiles, salta alerta operativa P1 al equipo.
*   **Volume Anomaly Checks:** Si IGJ publicaba un CSV de 20MB y de repente pesa 2KB, el sistema detecta anomalía volumétrica de ingesta y aborta. No sobrescribe la tabla `Entities`.
*   **Field Completeness Checks (Nulls):** Se rechaza ingesta estructurada si campos críticos para ER (CUIT, Jurisdicción, Razón Social) superan un umbral Nulo del 10%.
*   **Referential Checks (Lineage):** No puede existir una Entidad (Node) o Contrato (Edge) que no apunte a un `source_id` y `record_id` válidos.
*   **Geometry Validity Checks:** Las coordenadas deben estar en [-90, 90] y [-180, 180]. Un polígono auto-intersecante de IDERA/IGN (WKT/GeoJSON inválido) se rechaza con alerta geo-técnica `ST_IsValid(geom) == false`.
*   **Duplicate Detection:** Si la tupla (CUIT, Numero Expediente, Fecha) ya existe (Hash SHA256 repetido), no se procesa ni inserta, mitigando scrapers atrapados en bucles.
*   **Confidence Degradation (Fallbacks):** Si falla Georef en devolver una dirección confiable (API Down), y usamos una Regex básica de "Provincia, Calle, Número" (PBA/CABA), la lat/lon calculada a ojo recibe penalidad de score `-0.5` en confianza. No se muestra en el mapa primario hasta curación manual.
*   **Source Health Scoring:** Si COMPR.AR arroja 5 timeouts semanales, su "Health Score" global baja. Fuentes con bajo health no son consideradas para alertas urgentes automáticas.
*   **Catálogo de Errores Comunes:** (Ej: "CUIT 00-00000000-0 de entes públicos en contratos", "Fechas 1900-01-01 en IGJ", "CUITs con sufijos o espacios").
*   **Política de Cuarentena (Datasets rotos):** Dataset que rompe Schema, Volumetría o Completeness, va automáticamente a una tabla paralela `quarantine_records` y requiere intervención de un Data Engineer.

## SECCIÓN 14 — PLAN DE OBSERVABILIDAD Y OPERACIÓN

Para no operar ciegos sobre la arquitectura del Estado argentino:

*   **Métricas por conector:** Peticiones HTTP totales, Rate Limits (429) hit, Tiempo de descarga.
*   **Métricas por fuente:** SLA de frescura de la fuente (cuándo actualizó el Estado), bytes promedio ingeridos diarios.
*   **Métricas por pipeline:** Filas procesadas/segundo, OCR páginas/min, % registros que pasan el Data Contract (Ej. 99% en IGJ).
*   **Métricas por entidad:** Volumen de nuevas identidades (Entidades nuevas únicas vs Duplicadas detectadas en merge nocturno), Entidades con CUIT vacío, Colisiones que requieren Review Humano (>10%).
*   **Métricas por alertas:** Alertas disparadas al usuario por hora/día (controlar fatiga), correos rebotados, retraso en delivery.
*   **Métricas de búsqueda:** Latencia p50, p90, p99 de Search UI y API externa.
*   **Error Budgets:** COMPR.AR (scraper inestable) tiene un budget de error del 5% diario permitido. API Georef (oficial) tiene 0.1% de tolerancia.
*   **SLAs Internos Razonables:** 200ms para endpoints de búsqueda y grafo. 24h máximas desde que un edicto legal se publica en BORA hasta que la Alerta de usuario suena.
*   **Dashboards Operativos (Grafana):** Tablero "Salud Ingesta" (Conectores en verde/rojo/kill_switch_activado), "Volumetría Data Lake", "Errores 500 API".
*   **Runbooks:** Pasos estructurados (Markdown/Confluence) para "Qué hacer si falla el scraper BORA". (Ej: Revisar si cambió el class name de la web oficial, desactivar feature flag del extractor, probar fix local).
*   **Alertas de salud:** Integración Grafana -> Slack/Opsgenie.
*   **Incident Levels:** L1 (Gravedad Máxima: Ingestión PII restringida no autorizada, Caída de UI, Borrado accidental. Requiere Rollback), L2 (Conector Oficial Down, Búsqueda Lenta), L3 (Scraper html temporalmente bloqueado).
*   **Respuesta ante fuente caída (Timeout/503):** Backoff exponencial y alertas. No se detiene la UI ni los servicios históricos de entidades (Resiliencia).
*   **Respuesta ante cambio de schema (Drift):** El conector falla el Data Contract, entra en cuarentena silenciosamente. El desarrollador adapta el parser de JSON/CSV, actualiza el YAML del Data Contract y re-ingesta la cola de cuarentena (Retry Queue).
*   **Respuesta ante duplicación masiva:** (Ej. Bug en el hash que inserta 5 millones de CUITs idénticos). El Soft Delete/Rollback (gracias al linaje `fetched_at`) elimina el batch anómalo entero en 1 query sin afectar historia previa.
*   **Respuesta ante geocoding drift:** (API del IGN o Georef re-escribe IDs provinciales o cambia la nomenclatura de CABA). Recalcular asíncronamente las entidades afectadas mediante un job de Map/Reduce nocturno y reportar.

## SECCIÓN 15 — PLAN DE PRODUCTO POR CAPACIDAD

Transformando las fuentes base en capacidades (Capabilities) tangibles para el Analista OSINT:

*   **Perfil de Entidad / Dossier 360:**
    *   *Fuentes:* IGJ (Datos Justicia), BORA, COMPR.AR, BA APIs/Georef.
    *   *Fase:* Fase 1 (IGJ, Geo) -> Fase 2/3 (COMPR.AR, BORA).
    *   *Riesgo/Valor:* Riesgo Bajo / Valor Alto (Core del producto).
    *   *Smoke Test habilitante:* `test_entity_resolution_cuit_merge`.
*   **Búsqueda Rápida (CUIT, Razón Social, Jurisdicción, Dominio NIC):**
    *   *Fuentes:* IGJ, NIC (si manual/puntual), Índices OpenSearch.
    *   *Fase:* Fase 1 -> Fase 3 (con dominios y full text).
    *   *Riesgo/Valor:* Riesgo Nulo / Valor Altísimo.
    *   *Smoke Test habilitante:* Search response < 200ms devolviendo hits exactos y fuzzy.
*   **Vista Territorial / Heatmaps de Riesgo:**
    *   *Fuentes:* SNIC (Crimen), IGN (Capas Administrativas), COMPR.AR (Compras por municipio/provincia).
    *   *Fase:* Fase 1 (Normalización) -> Fase 2.
    *   *Riesgo/Valor:* Riesgo Nulo / Valor Medio (Inteligencia contextual).
    *   *Smoke Test habilitante:* `test_georef_normalization` + carga exitosa de polígonos GeoJSON (IGN).
*   **Vista de Contrataciones Públicas:**
    *   *Fuentes:* COMPR.AR, CONTRAT.AR, Portales provinciales (PBA/CABA/Córdoba CKAN).
    *   *Fase:* Fase 2.
    *   *Riesgo/Valor:* Riesgo Medio (Scraping inestable, cambios de portal) / Valor Muy Alto (Due Diligence).
    *   *Smoke Test habilitante:* `test_comprar_search_parser`.
*   **Vista Financiera / Due Diligence Avanzado:**
    *   *Fuentes:* BCRA (Central Deudores / Cheques Rechazados), SSN.
    *   *Fase:* Fase 3 (Query Manual/Puntual).
    *   *Riesgo/Valor:* Riesgo Legal Alto (Central de Deudores) / Valor Altísimo.
    *   *Smoke Test habilitante:* `test_bcra_null_tolerance` + Auditoría de logs de consulta.
*   **Vista Societaria (Autoridades / Sociedades):**
    *   *Fuentes:* BORA (Sección 1 y 2), IGJ.
    *   *Fase:* Fase 2.
    *   *Riesgo/Valor:* Riesgo Bajo / Valor Alto (Vínculos PEP/Directivos).
    *   *Smoke Test habilitante:* `test_bora_daily_fetch` y OCR parser.
*   **Watchlists y Notificaciones Asíncronas:**
    *   *Fuentes:* Novedades de BORA, COMPR.AR, RSS Ministerios.
    *   *Fase:* Fase 4.
    *   *Riesgo/Valor:* Riesgo Medio (Fatiga de alertas) / Valor Operacional Alto.
    *   *Smoke Test habilitante:* `test_watchlist_idempotency`.
*   **Grafo de Relaciones Estructurado (Graph UI):**
    *   *Fuentes:* Cruce consolidado de Entidades + Domicilios Normalizados + Nombres en BORA.
    *   *Fase:* Fase 5.
    *   *Riesgo/Valor:* Riesgo Medio (Falsos Positivos Visuales) / Valor Estratégico Alto (Intelligence).
    *   *Smoke Test habilitante:* `test_graph_traversal_speed`.
*   **Scoring Explicable de Riesgo (Compliance Privado / Analista Público):**
    *   *Fuentes:* Reglas determinísticas sobre Sanciones, Deuda BCRA, Volúmen Contractual.
    *   *Fase:* Fase 5.
    *   *Riesgo/Valor:* Riesgo Alto (Legal/Compliance Caja Negra) / Valor Alto.
    *   *Smoke Test habilitante:* `test_scoring_explainability` (Must show "Reasons" array).
*   **Briefs Automáticos / Línea de Tiempo de Eventos (Timeline):**
    *   *Fuentes:* Todas (Motor Event-Driven).
    *   *Fase:* Fase 4.
    *   *Riesgo/Valor:* Riesgo Bajo / Valor Medio (Ahorro de tiempo del analista).
    *   *Smoke Test habilitante:* Queue workers no bloqueados procesando eventos históricos cronológicos.

## SECCIÓN 16 — INVENTARIO DE FEATURES QUE NO DEBEN CONSTRUIRSE TODAVÍA

Disciplina arquitectónica: No enamorarse de demos irrealizables sin datos maduros:

*   **Scoring Mágico / Caja Negra (AI/ML):** Modelos predictivos de Machine Learning que determinan "quién va a ganar una licitación" o "quién es testaferro" sin features probadas históricas ni labels manuales. No sirven legalmente.
*   **Reconocimiento Facial (Face Recognition):** Cruzar fotos borrosas de DNI o perfiles de RRSS con cámaras de subastas no tiene base de datos abierta legal ni valor inmediato en due diligence de contratos; es PII altísima con precisión baja y altísimo riesgo regulatorio.
*   **Padrones Vehiculares Inventados (DNRPA OSINT):** Intentar adivinar el titular registral de millones de patentes (DNRPA) raspando fotomultas parciales. Legalmente prohibido y técnicamente incompleto. (Las consultas a la DNRPA deben ser uno a uno, aranceladas y legales fuera de este sistema masivo).
*   **Atribución Masiva de Titularidad de Dominios (NIC.ar):** Asumir sin cruce de CUIT que el dominio .com.ar es propiedad de una empresa solo por similitud fonética. El WHOIS es restrictivo.
*   **Enrichments Masivos con PII Innecesaria:** Extraer las direcciones de familiares menores de edad o testigos de edictos de divorcio de boletines provinciales escaneados y guardarlos por años. Requiere anonimización forzosa en la capa Extractora (OCR) descartando datos sin Interés Legítimo operativo.
*   **Scraping Indiscriminado de Noticias/Causas (PJN/Medios):** Rastrear la web completa por el nombre de un funcionario en Clarín/La Nación sin pagar API comercial es violar copyright y TOS, terminando en bloqueos IP y procesos legales a la empresa creadora de esta herramienta.
*   **Alertas basadas en fuentes inestables:** Licitaciones que dependen de hojas de Google Sheets inestables de municipios de 3ra categoría. Producen falsas alarmas que el analista ignorará (Fatiga).
*   **Graph "Bonito" pero con Matching Pobre:** Levantar Neo4j en el Día 1 sin tener el CUIT/Georef unificado (Entity Resolution). Generará un diagrama de espagueti inútil donde "Gobierno de la Ciudad", "CABA", y "G.C.B.A" son 3 nodos sin conexión.

## SECCIÓN 17 — PLAN DE ENTREGA FASE POR FASE

Este roadmap técnico/producto orienta qué priorizar operativamente (Time-to-Market vs Risk):

*   **Orden de Implementación Estricto:** FASE 1 (Fundación: Data Lake + Schema DB + Georef + IGJ) -> FASE 2 (Expansión Económica y Normativa: BORA + COMPR.AR) -> FASE 3 (Unificación y Search API: Entity Resolution Unificado + UI de Búsqueda de Entidades) -> FASE 4 (Operatividad: Watchlists + API Externa + RBAC + Alertas RSS) -> FASE 5 (Analítica Avanzada: Graph Engine + Scoring Determinístico + Auditoría).
*   **Equipo Mínimo Sugerido:** 1 Data Engineer Backend Python/Postgres Senior (Pipeline Ingesta, Celery, Airflow/Temporal), 1 Desarrollador Fullstack Node/React (API, Auth, UI, Search, Watchlists), 1 Product Owner / Analista Legal OSINT (Clasificación de fuentes, reglas de negocio, QA/UAT).
*   **Qué puede hacer 1 Dev Fuerte (Prototipo/Semana 1-4):** Montar el Data Lake en MinIO, definir schemas SQLAlchemy/Pydantic/Prisma (según lenguaje), ingestar el CSV pesado de IGJ, implementar llamadas a la API de Georef para normalizar las sedes sociales y construir un endpoint GET RESTful interno con búsqueda difusa en PostgreSQL (`pg_trgm`). (Fase 1 completa en MVP).
*   **Qué requiere 2-3 perfiles (Semana 5-12):** Escribir, mantener y monitorear scrapers concurrentes que extraen texto en crudo, aplican NLP básico / Regex sobre BORA, evaden bans en COMPR.AR, y exponen todo esto en una UI React pulida de "Dossier 360" (Entity View) (Fase 2 y 3).
*   **Qué parte conviene prototipar:** Crawler de BORA (descargar 1 día y probar parsers de Regex sobre PDF/HTML sin ensuciar la BD principal), y Query manual de Central de Deudores BCRA a consola.
*   **Qué parte debe endurecerse antes de usuarios reales:** El algoritmo probabilístico de Entity Resolution (Umbral de colisiones y Queue de revisión manual) y las validaciones del Data Contract en S3/MinIO.
*   **Qué parte debe auditar legalmente antes de escalar:** El uso de `Central de Deudores BCRA`, listados completos de la `SSN`, e indexado indiscriminado de `BORA` respecto de la minimización de PII innecesaria para perfiles financieros u operacionales (ej. limpiar edictos de sucesiones/adopciones y dejar sólo edictos comerciales societarios).
*   **Demo Interna Fase 1 (Sprints 1-2):** CLI o UI minimalista que muestra una búsqueda en vivo devolviendo "CUIT", "Razón Social" y "Lat/Lon exacto del domicilio normalizado" consumiendo únicamente las bases estructuradas de IGJ y la API oficial Georef.
*   **Demo Interna Fase 3 (Sprints 5-6):** "El Super Buscador". Ingreso un CUIT y veo un JSON consolidado (o UI Frontend de Ficha) que reúne: Identidad (IGJ/Datos Argentina) + Novedades (BORA) + Obras Adjudicadas (COMPR.AR).
*   **Evidencia de Fase Terminada (Definition of Done):** No hay "Fase Terminada" sin los Smoke Tests en Verde automatizados en CI/CD, base legal de datos documentada en el `Source Registry YAML`, cero credenciales en repo y rollback de DB probado sin pérdida del Data Lake (Raw Files Intactos en Storage).

## SECCIÓN EXTRA — SOURCE REGISTRY SEED (MANDATORIO)

### 1) DATOS ARGENTINA — PORTAL NACIONAL + CKAN + APIs
*   **source_key:** `datos_argentina`
*   **official_name:** Portal Nacional de Datos Públicos / Datos Argentina
*   **owner:** Estado Nacional Argentino
*   **url_portal:** `https://www.argentina.gob.ar/datos-abiertos/portal`
*   **url_docs:** `https://www.datos.gob.ar/acerca/ckan`
*   **url_api_base:** `http://datos.gob.ar/api/3/action/`
*   **url_dataset_or_query:** `http://datos.gob.ar/api/3/action/package_search`
*   **access_type:** OPEN_DATA
*   **auth_mode:** None
*   **formats:** JSON, CSV, ZIP, XLSX
*   **consumption_pattern:** Usar endpoint CKAN `package_search` -> Explorar `package_show` -> Descargar vía `resource.url`.
*   **first_call_example:** `GET http://datos.gob.ar/api/3/action/package_search?q=seguridad`
*   **pagination_or_batching:** Parámetros `start` y `rows` en queries de búsqueda CKAN.
*   **freshness_model:** Variable según cada Dataset publicado. Leer metadata `organization` y fechas.
*   **legal_classification:** OPEN_DATA
*   **production_recommendation:** CORE Layer para discovery de fuentes masivas del Estado.
*   **integration_priority:** Fase 1
*   **smoke_test_seed:** Call a `package_show?id=estructura-organica-pen` y validar si hay url válida en array resources.
*   **reasons_to_not_use_as_core:** Los datasets federados en el portal suelen ser visuales o agregados, no transaccionales API reales, y muchos son PDFs o Excels sin estándar.
*   **fallback_strategy:** Si no responde Datastore API `datastore_search`, descargar el recurso físico desde el Object Storage público asociado.

### 2) API GEOREF — NORMALIZACIÓN GEOGRÁFICA ARGENTINA
*   **source_key:** `georef_ar`
*   **official_name:** GeorefAR API
*   **owner:** Datos Argentina / Estado Nacional
*   **url_portal:** `https://www.argentina.gob.ar/georef/acerca-de-georef`
*   **url_docs:** `https://www.argentina.gob.ar/datos-abiertos/georef/openapi`
*   **url_api_base:** `https://apis.datos.gob.ar/georef/api`
*   **url_dataset_or_query:** `https://apis.datos.gob.ar/georef/api/v2.0/direcciones`
*   **access_type:** OPEN_DATA
*   **auth_mode:** None
*   **formats:** JSON
*   **consumption_pattern:** Llamadas GET para normalización en vivo, POST Batch (JSON List) masivo para Data Lake/Crawlers.
*   **first_call_example:** `GET https://apis.datos.gob.ar/georef/api/v2.0/direcciones?direccion=Av.%20Corrientes%201234&provincia=CABA`
*   **pagination_or_batching:** POST endpoint en `/v2.0/direcciones` acepta lotes (Batch).
*   **freshness_model:** Base semestral/anual actualizada estáticamente.
*   **legal_classification:** OPEN_DATA
*   **production_recommendation:** CORE Absoluto. La única fuente unificada confiable para nombres y coordenadas oficiales.
*   **integration_priority:** Fase 1
*   **smoke_test_seed:** Normalizar calle + altura mal escrita y confirmar si la Nomenclature sale parseada bien.
*   **reasons_to_not_use_as_core:** Pobre o nula resolución hiperlocal de manzanas y parcelas no catastrales comparado con APIs locales, como en barrios emergentes.
*   **fallback_strategy:** Usar BA APIs si la provincia es CABA; usar Regex heurísticas y grabar confianza (Confidence Score) de 0.2 si la API Georef falla al 500.

### 3) BCRA — CENTRAL DE DEUDORES
*   **source_key:** `bcra_central_deudores`
*   **official_name:** API Central de Deudores
*   **owner:** BCRA (Banco Central de la República Argentina)
*   **url_portal:** `https://www.bcra.gob.ar/conocer-que-es-la-central-de-deudores/`
*   **url_docs:** `https://www.bcra.gob.ar/Catalogo/Content/files/pdf/central-deudores-v1.pdf`
*   **url_api_base:** `https://api.bcra.gob.ar/CentralDeDeudores/v1.0/`
*   **url_dataset_or_query:** `https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/{cuit}`
*   **access_type:** API (RESTRICTED USE)
*   **auth_mode:** Ninguno / IP Whitelisting o validación de TOS corporativo.
*   **formats:** JSON
*   **consumption_pattern:** Consulta 1-a-1 explícitamente requerida, manual o automatizada puntual, NUNCA BULK CRAWLING.
*   **first_call_example:** `GET https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/20111111112`
*   **pagination_or_batching:** Consulta puntual, rate limit estricto por IP.
*   **freshness_model:** Actualización mensual / bimestral de reportes de bancos.
*   **legal_classification:** LEGALLY_SENSITIVE
*   **production_recommendation:** Herramienta potente de Due Diligence financiero pero usarla exclusivamente bajo demanda y guardrails fuertes.
*   **integration_priority:** Fase 3 (Enriquecimiento on-demand).
*   **smoke_test_seed:** Call con CUIT inválido y comprobar manejo sin crashear.
*   **reasons_to_not_use_as_core:** PII alta para personas físicas (deudas hipotecarias/tarjetas de ciudadanos comunes). Scoring automático no explicable expone a la empresa.
*   **fallback_strategy:** Si endpoint se cae, suspender enriquecimiento financiero, mostrar "Not Available" y no recalcular risk scores basados en él.

### 4) BCRA — CHEQUES DENUNCIADOS
*   **source_key:** `bcra_cheques`
*   **official_name:** API Cheques Denunciados
*   **owner:** BCRA
*   **url_portal:** `https://www.bcra.gob.ar/cheques-denunciados/`
*   **url_docs:** `https://www.bcra.gob.ar/archivos/Catalogo/Content/files/pdf/Cheques-v1.pdf`
*   **url_api_base:** `https://api.bcra.gob.ar/cheques/v1.0/`
*   **url_dataset_or_query:** `https://api.bcra.gob.ar/cheques/v1.0/denunciados/{entidad}/{numero}`
*   **access_type:** API
*   **auth_mode:** None (Revisar manual vigente v1.0).
*   **formats:** JSON
*   **consumption_pattern:** Búsqueda puntual y controlada por número de cheque y entidad emisora pre-mapeada.
*   **first_call_example:** `GET https://api.bcra.gob.ar/cheques/v1.0/denunciados/11/20377516` (Banco 11, Cheque 20377516)
*   **pagination_or_batching:** Consulta específica.
*   **freshness_model:** Diaria / Event-driven.
*   **legal_classification:** OPEN_DATA / PUBLIC_QUERY (Uso ético).
*   **production_recommendation:** Uso como alerta de Fraude Puntual B2B en comprobación activa, no armar grafo maestro.
*   **integration_priority:** Fase 2 / 3.
*   **smoke_test_seed:** Listado de Entidades (`/entidades`) devuelve catálogo JSON parseable válido.
*   **reasons_to_not_use_as_core:** Scope de uso de red flags es muy estrecho e incidental.
*   **fallback_strategy:** Desactivar módulo fraude temporalmente, ocultar en UI y seguir operando las validaciones base.

### 5) IGN — CAPAS SIG / GEOSERVICIOS
*   **source_key:** `ign_sig`
*   **official_name:** Instituto Geográfico Nacional — Capas SIG / Información Geoespacial
*   **owner:** IGN
*   **url_portal:** `https://www.ign.gob.ar/NuestasActividades/InformacionGeoespacial/Principal`
*   **url_docs:** `https://www.ign.gob.ar/sig`
*   **url_api_base:** N/A (WMS/WFS o Descarga)
*   **url_dataset_or_query:** Links de descarga directa Shapefile/GeoJSON en portal.
*   **access_type:** OPEN_DATA
*   **auth_mode:** None
*   **formats:** Shapefile (.shp), GeoJSON, Servicios OGC WMS/WFS
*   **consumption_pattern:** Descargar ZIP/SHP estático de límites administrativos / penitenciarías / pasos fronterizos, importar a PostGIS/Cache local y consumir en consultas internas de intersección.
*   **first_call_example:** Manual Download de Polígonos de "Departamentos" y carga en Postgres (`shp2pgsql`).
*   **pagination_or_batching:** Por capa geoespacial (layer completo).
*   **freshness_model:** Actualización periódica no frecuente (Límites físicos).
*   **legal_classification:** OPEN_DATA
*   **production_recommendation:** CORE Layer Georeferencial visual y contextual de riesgo territorial.
*   **integration_priority:** Fase 1.
*   **smoke_test_seed:** Chequear validez de las geometrías descargadas usando `ST_IsValid(geom)`.
*   **reasons_to_not_use_as_core:** WFS/WMS directos a producción sobrecargan al servidor IGN, y sufren latencia extrema.
*   **fallback_strategy:** Si los servidores WMS de capas están down, utilizar siempre tiles/features oxidados en Caché Local.

### 6) DATOS JUSTICIA ARGENTINA (IGJ Entidades)
*   **source_key:** `igj_entidades`
*   **official_name:** Entidades constituidas en la IGJ
*   **owner:** Ministerio de Justicia / Inspección General de Justicia
*   **url_portal:** `https://datos.jus.gob.ar/dataset/entidades-constituidas-en-la-inspeccion-general-de-justicia-igj`
*   **url_docs:** Misma URL CKAN.
*   **url_api_base:** `https://datos.jus.gob.ar/`
*   **url_dataset_or_query:** Archivo CSV/ZIP de distribución del portal de Datos Justicia.
*   **access_type:** OPEN_DATA
*   **auth_mode:** None
*   **formats:** CSV (Muestreo), ZIP (Dump completo).
*   **consumption_pattern:** Consumo batch offline (ETL) programado. Bajar el ZIP completo, descomprimir, y hacer carga masiva particionada a Postgres. Modelar Entidades, Domicilios.
*   **first_call_example:** GET al enlace de descarga `resource` del ZIP oficial.
*   **pagination_or_batching:** Procesamiento batch por chunk del CSV crudo grande.
*   **freshness_model:** Dataset versionado, chequear metadata mensual.
*   **legal_classification:** OPEN_DATA (Entidades Comerciales y ASFL de carácter público).
*   **production_recommendation:** CORE Absoluto para creación del Entity Graph de personas jurídicas.
*   **integration_priority:** Fase 1.
*   **smoke_test_seed:** Script parser extrae `razon_social` y `cuit` sin fallar ni cruzar columnas, logueando cabeceras esperadas.
*   **reasons_to_not_use_as_core:** Las bases de IGJ Nacional no cubren registros de personas jurídicas constituidas exclusivamente bajo amparo de Registros Públicos de Comercio (RPC) provinciales en el interior profundo.
*   **fallback_strategy:** Complementar el Lake cruzando bases de padrones AFIP/ARBA abiertos provinciales cuando la empresa no aparezca en IGJ Nacional.

### 7) ESTADÍSTICAS CRIMINALES / SNIC
*   **source_key:** `snic`
*   **official_name:** Estadísticas criminales de la República Argentina / bases de datos
*   **owner:** Ministerio de Seguridad
*   **url_portal:** `https://www.argentina.gob.ar/seguridad/estadisticascriminales/bases-de-datos`
*   **url_docs:** URL Portal
*   **url_api_base:** N/A (Descarga directa)
*   **url_dataset_or_query:** Archivos SAT/microdatos en formato XLSX/CSV en el portal.
*   **access_type:** OPEN_DATA / PUBLIC_WEB
*   **auth_mode:** None
*   **formats:** XLSX, CSV
*   **consumption_pattern:** Descargar archivos periódicamente -> Chequeo de Schema Lock y Hash (MD5) -> Bulk Ingest a Postgres para cruzar con coordenadas IGN/Georef.
*   **first_call_example:** Descargar XLSX manual, pasar a pandas/csv.
*   **pagination_or_batching:** Archivos macro anuales.
*   **freshness_model:** Anual, estadístico y agregado (no es feed realtime de delitos).
*   **legal_classification:** OPEN_DATA (Datos agregados desvinculados nominalmente).
*   **production_recommendation:** CORE para scoring geográfico y territorial agregado.
*   **integration_priority:** Fase 1.
*   **smoke_test_seed:** Validar MD5 de archivo CSV. Si cambia, asegurar que el total de filas parseables (Headers `anio, provincia, departamento, total`) coinciden con el esquema previo.
*   **reasons_to_not_use_as_core:** Agregados no proveen utilidad forense sobre incidentes inmediatos (no informa un allanamiento ni una condena personal de ayer).
*   **fallback_strategy:** Enriquecer inteligencia territorial cruzando mapas del delito específicos provinciales (ej. CABA/PBA) que sí ofrecen granularidad de geocoding.

### 8) COMPR.AR
*   **source_key:** `comprar`
*   **official_name:** COMPR.AR — Portal de Compras Públicas Nacionales
*   **owner:** Oficina Nacional de Contrataciones
*   **url_portal:** `https://comprar.gob.ar/`
*   **url_docs:** `https://www.argentina.gob.ar/comprar/soy-proveedor/compras-electronicas`
*   **url_api_base:** N/A (Web App)
*   **url_dataset_or_query:** `https://comprar.gob.ar/ComprasElectronicas.aspx`
*   **access_type:** PUBLIC_QUERY
*   **auth_mode:** Browsing anónimo público (Búsqueda Avanzada), Requiere Login proveedor para operaciones.
*   **formats:** HTML DOM Dinámico, ASPX.
*   **consumption_pattern:** Web Crawler con Puppeteer o Beautiful Soup usando filtros de Búsqueda Avanzada (por rango de fechas/jurisdicción). Captura IDs (expediente), Organismos, Fechas, Objetos y montos/adjudicados del DOM, descarga de PDF de resolución (si aplica).
*   **first_call_example:** Cargar la URL base de compras electrónicas de estado abierto, extraer el Grid table HTML.
*   **pagination_or_batching:** Control exhaustivo de Throttling/Paginación, 1 req/seg con User-Agent custom para evitar baneos IP por la WAF de AFIP/Nación.
*   **freshness_model:** Dinámico (Altísima Frecuencia, transaccional).
*   **legal_classification:** PUBLIC_QUERY / OPEN_DATA.
*   **production_recommendation:** Valioso pero FRÁGIL. Uso como ingestión Core para Procurement Intelligence con guardrails estrictos.
*   **integration_priority:** Fase 2.
*   **smoke_test_seed:** Script parser debe retornar exitosamente Objeto/Expediente y Organismo resolviendo al menos un contrato público listado hoy.
*   **reasons_to_not_use_as_core:** La UI ASPX cambia frecuentemente. Bloqueos de IP por WAF si detectan scrapers agresivos. No existe dump OCDS estructurado y oficial limpio de todos los años y anexos históricos.
*   **fallback_strategy:** Mantener las extracciones pasadas a salvo. Si falla, el pipeline queda en pausa, pero alerta a los usuarios de "Estado Degradado de Actualización".

### 9) BOLETÍN OFICIAL DE LA REPÚBLICA ARGENTINA (BORA)
*   **source_key:** `bora`
*   **official_name:** Boletín Oficial de la República Argentina
*   **owner:** Secretaría Legal y Técnica
*   **url_portal:** `https://www.boletinoficial.gov.ar/`
*   **url_docs:** `http://www.reddeboletines.gob.ar` (Referencia prov.)
*   **url_api_base:** Endpoint semi-abierto JSON para el índice diario.
*   **url_dataset_or_query:** Dependiente de la API o HTML de Sección 1 a 4.
*   **access_type:** PUBLIC_WEB
*   **auth_mode:** None
*   **formats:** Web HTML, XML, PDF Oficial Firmado.
*   **consumption_pattern:** Consulta programada DIARIA. Se descarga índice (JSON/HTML), se identifican edictos comerciales (Sección 2), avisos oficiales (Sección 1) -> Se descarga PDF/HTML o texto completo crudo de cada aviso -> OCR/Regex -> Entity Mapping.
*   **first_call_example:** Buscar y descargar edición del día en curso (Sección Primera) `GET https://www.boletinoficial.gob.ar/` (inspeccionar Network Tab para API de la UI).
*   **pagination_or_batching:** Por edición diaria, descargar y archivar localmente por fecha en MinIO.
*   **freshness_model:** Publicación diaria a primera hora AM.
*   **legal_classification:** PUBLIC_WEB (Documentación oficial, uso legítimo).
*   **production_recommendation:** CORE Documental y de Novedades (El corazón del Alerting y Cambios de Autoridades).
*   **integration_priority:** Fase 2.
*   **smoke_test_seed:** Scraper nocturno es capaz de parsear el header o un edicto de muestra al azar de la Sección II de la edición de ayer.
*   **reasons_to_not_use_as_core:** Pura información desestructurada. Los nombres de personas físicas son propensos a colisión, y los PDFs están mal encodeados en muchos boletines provinciales asociados.
*   **fallback_strategy:** Si no es posible parsear nombres específicos por NLP, guardar al menos el texto raw indexado en ElasticSearch para permitir al analista encontrar resultados por "Keyword" manual.

### 10) BUENOS AIRES APIs (Geocoding / Transporte)
*   **source_key:** `ba_apis`
*   **official_name:** APIs Buenos Aires Ciudad (USIG / Transporte)
*   **owner:** Gobierno de la Ciudad de Buenos Aires (GCBA)
*   **url_portal:** `https://buenosaires.gob.ar/apis`
*   **url_docs:** `https://usig.buenosaires.gob.ar/apis/`
*   **url_api_base:** `https://servicios.usig.buenosaires.gob.ar/` (USIG) y `https://api-transporte.buenosaires.gob.ar/` (Transporte)
*   **url_dataset_or_query:** `https://servicios.usig.buenosaires.gob.ar/normalizar/?direccion=Callao+100`
*   **access_type:** OPEN_DATA / REQUIRES_TOKEN (Transporte/Flujos).
*   **auth_mode:** API Key / JWT o registro manual para endpoints de movilidad; None para USIG Normalizador abierto.
*   **formats:** REST / OpenAPI / JSON.
*   **consumption_pattern:** USIG usado sincrónicamente y masivamente cacheado. Transporte para movilidad en real-time.
*   **first_call_example:** `GET https://servicios.usig.buenosaires.gob.ar/normalizar/?direccion=Florida%20141`
*   **pagination_or_batching:** Por requests REST.
*   **freshness_model:** Cartografía urbana y movilidad CABA con alta fidelidad.
*   **legal_classification:** OPEN_DATA
*   **production_recommendation:** CORE Urbano / Normalizador Especializado. Suple y complementa fallas de Georef en parcelas porteñas de alta complejidad.
*   **integration_priority:** Fase 1.
*   **smoke_test_seed:** Call endpoint `normalizar/?direccion=Obelisco` retorna coordenadas exactas y formato de calle "Av. 9 de Julio".
*   **reasons_to_not_use_as_core:** Su cobertura es estrictamente AMBA / CABA, inútil para requerimientos a nivel nacional o provincial de Due Diligence.
*   **fallback_strategy:** Si BA APIs cae, usar API Georef como backup automático.

### 11) NIC ARGENTINA — WHOIS
*   **source_key:** `nic_ar`
*   **official_name:** NIC Argentina (Registro de Dominios)
*   **owner:** Secretaría Legal y Técnica
*   **url_portal:** `https://nic.ar/`
*   **url_docs:** `https://nic.ar/whois`
*   **url_api_base:** N/A (Web UI / Protocolo tcp-43)
*   **url_dataset_or_query:** Formularios POST en la web y Puerto TCP 43 para `whois -h whois.nic.ar dominio.com.ar`.
*   **access_type:** LEGALLY_SENSITIVE / PUBLIC_QUERY
*   **auth_mode:** Consulta libre de datos, con rate limits duros del servidor Whois y la WAF.
*   **formats:** Texto plano WHOIS Protocol, Formulario HTML.
*   **consumption_pattern:** Consultas explícitas disparadas y validadas por analistas en el marco de una investigación ("Enrichment"). NUNCA BARRIDO BULK, ni crawls automáticos descontrolados.
*   **first_call_example:** Comando Terminal o libreria Python `whois`: `whois -h whois.nic.ar clarin.com.ar`
*   **pagination_or_batching:** Nulo. Solo consultas atómicas y rate limiteadas con pausas explícitas (sleep).
*   **freshness_model:** Tiempo real oficial.
*   **legal_classification:** LEGALLY_SENSITIVE / RESTRICTED BULK.
*   **production_recommendation:** Edge Case / Enrichment OSINT (Atribución). Muy valioso operativamente, peligrosísimo técnicamente si se abusa.
*   **integration_priority:** Fase 3 (Control manual).
*   **smoke_test_seed:** Protocolo Whois arroja un documento texto plano con el String `Registrant` y el ID / CUIT visible.
*   **reasons_to_not_use_as_core:** El rate limit y los ToS de NIC.ar prohíben derivar la base de datos completa de titularidad de dominios, y los baneos son a nivel Datacenter / ASN del infractor.
*   **fallback_strategy:** Si el servidor Whois nos bloquea, emitir Error 429 al analista, e informar que NIC Argentina no está disponible y que se usen bases pasivas de DNS externas comerciales (Ej. SecurityTrails/Censys) bajo propio riesgo comercial.

### 12) DNRPA (TITULARIDAD VEHICULAR / PATENTES)
*   **source_key:** `dnrpa`
*   **official_name:** Dirección Nacional de Registro de la Propiedad del Automotor
*   **owner:** Ministerio de Justicia
*   **url_portal:** `https://www.dnrpa.gov.ar/`
*   **url_docs:** N/A
*   **url_api_base:** N/A
*   **url_dataset_or_query:** Sistemas de Trámites Online cerrados.
*   **access_type:** RESTRICTED
*   **auth_mode:** Validaciones impositivas, Clave Fiscal, Trámite Arancelado Individual.
*   **formats:** Web Application / Formularios.
*   **consumption_pattern:** NULO MASIVO. ESTRICTAMENTE PROHIBIDO (Por política de diseño del sistema OSINT) armar "Scraping" bulk de registros vehiculares y patentes, al violar directamente normativas de PII y seguridad del Estado.
*   **first_call_example:** N/A.
*   **pagination_or_batching:** N/A.
*   **freshness_model:** Tiempo real (Oficial cerrado).
*   **legal_classification:** LEGALLY_SENSITIVE / RESTRICTED (Bloqueo Duro).
*   **production_recommendation:** PROHIBIDA su Inclusión como conector automatizado core de la plataforma.
*   **integration_priority:** FUERA DE ROADMAP PRODUCTIVO.
*   **smoke_test_seed:** N/A.
*   **reasons_to_not_use_as_core:** Violación penal de acceso a registros personales y base de datos con altísima protección y sin open data oficial de personas. Genera liabilities críticos para la plataforma.
*   **fallback_strategy:** Sólo permitir a los analistas incorporar metadatos nominales vehiculares "A MANO" en la ficha del investigado si estos surgen de una constancia de consulta registral oficial adquirida en regla e ingresada por el "Manual-review connector".
