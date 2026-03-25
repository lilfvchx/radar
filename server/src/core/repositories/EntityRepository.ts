import { db } from '../db';
import {
  normalizedEntities,
  normalizedAddresses,
  rawRecords,
  sourceRegistry
} from '../db/schema';
import { eq, ilike, and, or, exists } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export class EntityRepository {
  constructor(private readonly database: typeof db) {}

  async searchEntities(q: string, jurisdiction?: string) {
    let baseQuery = this.database.select().from(normalizedEntities);

    const conditions = [];
    if (/^\d{11}$/.test(q)) {
      conditions.push(eq(normalizedEntities.cuit, q));
    } else {
      conditions.push(ilike(normalizedEntities.razon_social, `%${q}%`));
    }

    if (jurisdiction) {
      conditions.push(
        exists(
          this.database.select()
            .from(normalizedAddresses)
            .where(
              and(
                eq(normalizedAddresses.entity_id, normalizedEntities.entity_id),
                ilike(normalizedAddresses.province, `%${jurisdiction}%`)
              )
            )
        )
      );
    }

    return await baseQuery.where(and(...conditions)).limit(50);
  }

  async getDossier(uuid: string) {
    // 1. Efficient LEFT JOINs for addresses
    const masterDataWithAddresses = await this.database.select({
      entity: normalizedEntities,
      address: normalizedAddresses
    })
    .from(normalizedEntities)
    .leftJoin(normalizedAddresses, eq(normalizedEntities.entity_id, normalizedAddresses.entity_id))
    .where(eq(normalizedEntities.entity_id, uuid));

    if (masterDataWithAddresses.length === 0) {
      return null;
    }

    const entity = masterDataWithAddresses[0].entity;
    const addresses = masterDataWithAddresses
      .filter(row => row.address !== null)
      .map(row => row.address);

    // 2. Fetch Unstructured Data efficiently using a join on rawRecords and sourceRegistry
    // Optimizing the JSON matching by strictly relying on CUIT if available to avoid full scan,
    // or falling back to exact name matching if not.
    let rawConditions;
    if (entity.cuit) {
      rawConditions = sql`${rawRecords.raw_payload}->>'cuit' = ${entity.cuit}`;
    } else {
      rawConditions = sql`${rawRecords.raw_payload}->>'razonSocial' = ${entity.razon_social}`;
    }

    const matchedRecords = await this.database.select({
      record_id: rawRecords.record_id,
      raw_payload: rawRecords.raw_payload,
      source_name: sourceRegistry.source_name,
      fetched_at: rawRecords.fetched_at
    })
    .from(rawRecords)
    .innerJoin(sourceRegistry, eq(rawRecords.source_id, sourceRegistry.source_id))
    .where(
      and(
        rawConditions,
        or(
          ilike(sourceRegistry.source_name, '%bora%'),
          ilike(sourceRegistry.source_name, '%comprar%')
        )
      )
    )
    .limit(100);

    const boraNews = matchedRecords
      .filter(r => r.source_name.toLowerCase().includes('bora'))
      .map(r => ({ record_id: r.record_id, fetched_at: r.fetched_at, data: r.raw_payload }));

    const comprarAwards = matchedRecords
      .filter(r => r.source_name.toLowerCase().includes('comprar'))
      .map(r => ({ record_id: r.record_id, fetched_at: r.fetched_at, data: r.raw_payload }));

    return {
      masterData: entity,
      addresses,
      boraNews,
      comprarAwards
    };
  }
}
