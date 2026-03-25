# Prompt 3.1: Algoritmo de Resolución de Entidades (Entity Merge Logic)


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
