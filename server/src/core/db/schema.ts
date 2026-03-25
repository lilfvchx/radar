import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  jsonb,
  integer,
  numeric,
  uniqueIndex
} from "drizzle-orm/pg-core";

/**
 * ENUMS: Definitions for the OSINT architecture classifications.
 */

/**
 * Clasificación legal de la fuente de datos.
 * Dicta la prioridad y los guardrails legales (OPEN_DATA no tiene riesgos, LEGALLY_SENSITIVE sí).
 */
export const sourceClassificationEnum = pgEnum("source_classification", [
  "OPEN_DATA",
  "PUBLIC_QUERY",
  "LEGALLY_SENSITIVE",
  "RESTRICTED"
]);

/**
 * Tipos de entidades mapeadas según el OSINT_ARCHITECTURE_ARGENTINA.
 */
export const entityTypeEnum = pgEnum("entity_type", [
  "PERSON",
  "COMPANY",
  "GOV_AGENCY",
  "LOCATION"
]);

/**
 * 1. source_registry
 * Metadatos de la fuente. Controla la ingesta y prioridades para resolver colisiones.
 * Refleja el "Source-first" y "Provenance-first".
 */
export const sourceRegistry = pgTable("source_registry", {
  /** Identificador único de la fuente. Todo registro debe tener linaje a esto. */
  source_id: uuid("source_id").defaultRandom().primaryKey(),

  /** Nombre descriptivo (ej. "IGJ", "COMPR.AR") */
  source_name: varchar("source_name", { length: 255 }).notNull(),

  /** Etiqueta de clasificación legal (OPEN_DATA, etc.). Obligatoria por "legal-by-design". */
  sourceClassification: sourceClassificationEnum("source_classification").notNull(),

  /** Prioridad (1-100) para resolver colisiones de Entidades. Ej: AFIP > IGJ > Web scraping */
  priority: integer("priority").notNull().default(50),
});

/**
 * 2. raw_records
 * Almacén inmutable del payload JSONB original. Todo registro debe tener linaje.
 * Nunca se borran datos de esta tabla ("Soft Deletes obligatorios" o inmutabilidad absoluta del Data Lake crudo).
 */
export const rawRecords = pgTable("raw_records", {
  /** Identificador atómico del registro crudo extraído */
  record_id: uuid("record_id").defaultRandom().primaryKey(),

  /** Linaje (Provenance): FK obligatoria a source_registry indicando de dónde salió */
  source_id: uuid("source_id").notNull().references(() => sourceRegistry.source_id),

  /** Payload inmutable tal cual vino de la fuente. Garantiza auditabilidad y reprocesamiento. */
  raw_payload: jsonb("raw_payload").notNull(),

  /** Hash SHA256 del raw_payload para deduplicación estricta y control de ingesta (no procesar el mismo registro dos veces) */
  content_hash: varchar("content_hash", { length: 256 }).notNull().unique(),

  /** fetched_at autogenerado e inmutable. Fundamental para auditoría de cuándo se obtuvo el dato. */
  fetched_at: timestamp("fetched_at").defaultNow().notNull(),

  /** Flag de Soft Delete para cumplir la restricción "no borramos nada". */
  deleted_at: timestamp("deleted_at"),
});

/**
 * 3. normalized_entities
 * Entidades lógicas procesadas (empresas, personas, ministerios).
 * El Entity Resolution consolida los raw records acá.
 */
export const normalizedEntities = pgTable("normalized_entities", {
  /** ID interno de la entidad lógica agrupada (Nodo del Grafo) */
  entity_id: uuid("entity_id").defaultRandom().primaryKey(),

  /** Clasificación de la entidad (PERSON, COMPANY, GOV_AGENCY) */
  entity_type: entityTypeEnum("entity_type").notNull(),

  /**
   * CUIT: varchar(11). Admite nulos obligatoriamente según arquitectura porque hay
   * ministerios o entidades extranjeras sin CUIT explícito en los datasets.
   */
  cuit: varchar("cuit", { length: 11 }),

  /** Razón Social / Nombre completo unificado */
  razon_social: varchar("razon_social", { length: 500 }),

  /** Soft delete flag. Indica si la entidad fue "borrada" (ej. fusionada erróneamente, etc.) */
  deleted_at: timestamp("deleted_at"),
});

/**
 * 4. normalized_addresses
 * Domicilios con variables espaciales y de georeferencing para mapeos de riesgo territorial.
 */
export const normalizedAddresses = pgTable("normalized_addresses", {
  /** ID interno de la dirección normalizada */
  address_id: uuid("address_id").defaultRandom().primaryKey(),

  /** FK a la entidad dueña del domicilio para vincular empresas/personas con geografía */
  entity_id: uuid("entity_id").notNull().references(() => normalizedEntities.entity_id),

  /** Provincia, idealmente normalizada usando la API Georef o BA APIs */
  province: varchar("province", { length: 255 }),

  /** Municipio / Localidad, normalizada usando Georef */
  municipality: varchar("municipality", { length: 255 }),

  /** Latitud (-90 a 90) extraída del normalizador */
  lat: numeric("lat", { precision: 10, scale: 7 }),

  /** Longitud (-180 a 180) extraída del normalizador */
  lon: numeric("lon", { precision: 10, scale: 7 }),

  /** Confianza de geocodificación (float 0.0 a 1.0) para evaluar calidad de la coordenada. */
  geocode_confidence: numeric("geocode_confidence", { precision: 3, scale: 2 }),

  /** Soft delete flag. */
  deleted_at: timestamp("deleted_at"),
});
