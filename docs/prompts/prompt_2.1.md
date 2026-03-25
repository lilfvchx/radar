# Prompt 2.1: Scraper Crawler para COMPR.AR con Kill Switch


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
