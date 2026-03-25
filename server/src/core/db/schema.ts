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

export const sourceClassificationEnum = pgEnum("source_classification", [
  "OPEN_DATA",
  "PUBLIC_QUERY",
  "LEGALLY_SENSITIVE",
  "RESTRICTED"
]);

export const entityTypeEnum = pgEnum("entity_type", [
  "PERSON",
  "COMPANY",
  "GOV_AGENCY",
  "LOCATION"
]);

export const entityResolutionStatusEnum = pgEnum("entity_resolution_status", [
  "MERGED",
  "NEW",
  "NEEDS_REVIEW"
]);

export const sourceRegistry = pgTable("source_registry", {
  source_id: uuid("source_id").defaultRandom().primaryKey(),
  source_name: varchar("source_name", { length: 255 }).notNull(),
  sourceClassification: sourceClassificationEnum("source_classification").notNull(),
  priority: integer("priority").notNull().default(50),
});

export const rawRecords = pgTable("raw_records", {
  record_id: uuid("record_id").defaultRandom().primaryKey(),
  source_id: uuid("source_id").notNull().references(() => sourceRegistry.source_id),
  raw_payload: jsonb("raw_payload").notNull(),
  content_hash: varchar("content_hash", { length: 256 }).notNull().unique(),
  fetched_at: timestamp("fetched_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const normalizedEntities = pgTable("normalized_entities", {
  entity_id: uuid("entity_id").defaultRandom().primaryKey(),
  entity_type: entityTypeEnum("entity_type").notNull(),
  cuit: varchar("cuit", { length: 11 }),
  razon_social: varchar("razon_social", { length: 500 }),
  update_date: timestamp("update_date").defaultNow(),
  deleted_at: timestamp("deleted_at"),
});

export const normalizedAddresses = pgTable("normalized_addresses", {
  address_id: uuid("address_id").defaultRandom().primaryKey(),
  entity_id: uuid("entity_id").notNull().references(() => normalizedEntities.entity_id),
  province: varchar("province", { length: 255 }),
  municipality: varchar("municipality", { length: 255 }),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lon: numeric("lon", { precision: 10, scale: 7 }),
  geocode_confidence: numeric("geocode_confidence", { precision: 3, scale: 2 }),
  deleted_at: timestamp("deleted_at"),
});

export const entityResolutionSuggestions = pgTable("entity_resolution_suggestions", {
  suggestion_id: uuid("suggestion_id").defaultRandom().primaryKey(),
  new_entity_id: uuid("new_entity_id").notNull().references(() => normalizedEntities.entity_id),
  existing_entity_id: uuid("existing_entity_id").notNull().references(() => normalizedEntities.entity_id),
  score: numeric("score", { precision: 5, scale: 4 }).notNull(),
  status: entityResolutionStatusEnum("status").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
