# Prompt 1.1: Configuración de Base de Datos y Modelos Core (Drizzle/Prisma + PostgreSQL)


**Rol:** Eres el Lead Data Architect de una plataforma OSINT para Argentina. Tu enfoque es "Source-first" y "Provenance-first".
**Contexto:** Basado en la SECCIÓN 8 del `OSINT_ARCHITECTURE_ARGENTINA.md`, necesitamos definir el esquema de base de datos relacional para el Data Lake Operacional. El motor será PostgreSQL usando un ORM moderno (preferentemente Drizzle ORM o Prisma). Todo registro debe tener linaje (`source_id`, `fetched_at`) y no borramos nada (Soft Deletes obligatorios).
**Misión:** Escribe el código del esquema del ORM (`schema.ts`) que incluya las siguientes tablas con sus respectivas relaciones (Foreign Keys) y constraints fuertes:
1. `source_registry` (Metadatos de la fuente, `source_classification` enum, `priority`).
2. `raw_records` (Almacén del payload JSONB original inmutable, con PK `record_id`, FK a `source_id`, hash SHA256 para deduplicación).
3. `normalized_entities` (Entidades lógicas: `cuit`, `razon_social`, `entity_type` enum).
4. `normalized_addresses` (Domicilios con `province`, `municipality`, `lat`, `lon`, `geocode_confidence` float).
**Restricciones:** El `cuit` debe ser un `varchar(11)` y admitir nulos (hay ministerios sin CUIT explícito). `fetched_at` debe ser autogenerado e inmutable. Incluye comentarios JSDoc explicando por qué se usa cada campo según la realidad OSINT argentina.
**Entregable:** Código TypeScript del ORM (`schema.ts`) y un script de migración inicial vacío o equivalente.
