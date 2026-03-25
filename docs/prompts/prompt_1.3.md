# Prompt 1.3: Conector Genérico CKAN (Datos Argentina / PBA)


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
