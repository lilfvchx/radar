import { eq, or, and } from "drizzle-orm";
import { normalizedEntities, normalizedAddresses, entityResolutionSuggestions, entityResolutionStatusEnum } from "../db/schema";

/**
 * Calculates the Levenshtein distance between two strings.
 */
function levenshteinDistance(s1: string, s2: string): number {
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1) // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Calculates a similarity score between 0 and 1 using Levenshtein distance.
 */
function calculateSimilarity(s1: string, s2: string): number {
  const s1Norm = s1.trim().toLowerCase();
  const s2Norm = s2.trim().toLowerCase();

  if (s1Norm === s2Norm) return 1.0;

  const distance = levenshteinDistance(s1Norm, s2Norm);
  const maxLength = Math.max(s1Norm.length, s2Norm.length);

  if (maxLength === 0) return 1.0;

  return 1.0 - distance / maxLength;
}

export interface NewRecord {
  cuit?: string | null;
  razon_social: string;
  province?: string | null;
  entity_type: "PERSON" | "COMPANY" | "GOV_AGENCY" | "LOCATION";
}

export interface ResolutionResult {
  status: "MERGED" | "NEEDS_REVIEW" | "NEW";
  entity_id: string;
  score: number;
  reason: string;
}

/**
 * Resolves a new incoming entity record against existing entities.
 *
 * @param db The Drizzle database instance (transaction or client)
 * @param record The new record to resolve
 * @returns A ResolutionResult indicating if it was merged, needs review, or is new
 */
export async function resolveEntity(db: any, record: NewRecord): Promise<ResolutionResult> {
  // 1. Exact Match via CUIT
  if (record.cuit) {
    const existing = await db
      .select({
        entity_id: normalizedEntities.entity_id,
        cuit: normalizedEntities.cuit,
        update_date: normalizedEntities.update_date
      })
      .from(normalizedEntities)
      .where(
        and(
          eq(normalizedEntities.cuit, record.cuit),
          eq(normalizedEntities.entity_type, record.entity_type)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update the update_date
      await db
        .update(normalizedEntities)
        .set({ update_date: new Date() })
        .where(eq(normalizedEntities.entity_id, existing[0].entity_id));

      return {
        status: "MERGED",
        entity_id: existing[0].entity_id,
        score: 1.0,
        reason: "Exact match on CUIT"
      };
    }
  }

  // 2. Probabilistic Matching via Levenshtein on Razón Social
  if (!record.cuit && record.razon_social) {
    // We fetch all entities of the same type to do in-memory probabilistic match
    // In a real huge DB, we'd use pg_trgm in SQL, but memory constraint allows this.
    const candidates = await db
      .select({
        entity_id: normalizedEntities.entity_id,
        razon_social: normalizedEntities.razon_social,
        province: normalizedAddresses.province
      })
      .from(normalizedEntities)
      .leftJoin(normalizedAddresses, eq(normalizedEntities.entity_id, normalizedAddresses.entity_id))
      .where(eq(normalizedEntities.entity_type, record.entity_type));

    let bestScore = 0;
    let bestCandidateId: string | null = null;

    for (const candidate of candidates) {
      if (!candidate.razon_social) continue;

      let score = calculateSimilarity(record.razon_social, candidate.razon_social);

      // Evaluate province penalty
      if (record.province && candidate.province) {
        if (record.province.trim().toLowerCase() !== candidate.province.trim().toLowerCase()) {
          score -= 0.5; // Severe penalty for different province
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCandidateId = candidate.entity_id;
      }
    }

    if (bestScore > 0.85 && bestCandidateId) {
      // 3. Needs Review
      // Create a NEW entity anyway, but link them in suggestions table
      const newEntityResult = await db
        .insert(normalizedEntities)
        .values({
          entity_type: record.entity_type,
          cuit: record.cuit || null,
          razon_social: record.razon_social,
        })
        .returning({ entity_id: normalizedEntities.entity_id });

      const newEntityId = newEntityResult[0].entity_id;

      if (record.province) {
         await db.insert(normalizedAddresses).values({
           entity_id: newEntityId,
           province: record.province
         });
      }

      await db.insert(entityResolutionSuggestions).values({
        new_entity_id: newEntityId,
        existing_entity_id: bestCandidateId,
        score: bestScore.toString(),
        status: "NEEDS_REVIEW"
      });

      return {
        status: "NEEDS_REVIEW",
        entity_id: newEntityId,
        score: bestScore,
        reason: "Probabilistic match > 0.85 but needs human review"
      };
    }
  }

  // 4. Default to NEW Entity
  const newEntityResult = await db
    .insert(normalizedEntities)
    .values({
      entity_type: record.entity_type,
      cuit: record.cuit || null,
      razon_social: record.razon_social,
    })
    .returning({ entity_id: normalizedEntities.entity_id });

  const newEntityId = newEntityResult[0].entity_id;

  if (record.province) {
      await db.insert(normalizedAddresses).values({
        entity_id: newEntityId,
        province: record.province
      });
  }

  return {
    status: "NEW",
    entity_id: newEntityId,
    score: 0,
    reason: "No matches found"
  };
}
