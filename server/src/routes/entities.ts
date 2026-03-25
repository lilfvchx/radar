import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { db } from '../core/db';
import { EntityRepository } from '../core/repositories/EntityRepository';

// Zod Request Schemas
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Query parameter "q" is required.'),
  jurisdiction: z.string().optional()
});

const uuidSchema = z.object({
  uuid: z.string().uuid('Invalid UUID format.')
});

// Zod Response Schemas
const addressSchema = z.object({
  address_id: z.string(),
  entity_id: z.string(),
  province: z.string().nullable(),
  municipality: z.string().nullable(),
  lat: z.string().nullable(),
  lon: z.string().nullable(),
  geocode_confidence: z.string().nullable(),
  deleted_at: z.date().nullable(),
});

const masterDataSchema = z.object({
  entity_id: z.string(),
  entity_type: z.string(),
  cuit: z.string().nullable(),
  razon_social: z.string().nullable(),
  update_date: z.date().nullable(),
  deleted_at: z.date().nullable(),
});

const rawRecordSchema = z.object({
  record_id: z.string(),
  fetched_at: z.date(),
  data: z.any()
});

const dossierResponseSchema = z.object({
  masterData: masterDataSchema,
  addresses: z.array(addressSchema),
  boraNews: z.array(rawRecordSchema),
  comprarAwards: z.array(rawRecordSchema),
});

const entitiesResponseSchema = z.array(masterDataSchema);

export function createEntitiesRouter(repository: EntityRepository) {
  const router = express.Router();

  // Rate Limiting: 10 requests / second per IP
  const apiLimiter = rateLimit({
    windowMs: 1000,
    max: 10,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.use(apiLimiter);

  // Endpoint 1: Search Entities Full-Text / Exact CUIT
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const queryResult = searchQuerySchema.safeParse({
        q: req.query.q,
        jurisdiction: req.query.jurisdiction
      });

      if (!queryResult.success) {
        res.status(400).json({ error: queryResult.error.format() });
        return;
      }

      const { q, jurisdiction } = queryResult.data;
      const results = await repository.searchEntities(q, jurisdiction);

      const parsedResponse = entitiesResponseSchema.parse(results);
      res.json(parsedResponse);
    } catch (error) {
      console.error('Error in /api/v1/entities search:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // Endpoint 2: Consolidated Entity Dossier
  router.get('/:uuid/dossier', async (req: Request, res: Response): Promise<void> => {
    try {
      const uuidResult = uuidSchema.safeParse({
        uuid: req.params.uuid
      });

      if (!uuidResult.success) {
        res.status(400).json({ error: uuidResult.error.format() });
        return;
      }

      const { uuid } = uuidResult.data;
      const dossier = await repository.getDossier(uuid);

      if (!dossier) {
        res.status(404).json({ error: 'Entity not found.' });
        return;
      }

      const parsedResponse = dossierResponseSchema.parse(dossier);
      res.json(parsedResponse);

    } catch (error) {
      console.error('Error in /api/v1/entities/:uuid/dossier:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
}

// Instantiate default router with default DB injection
const defaultRepository = new EntityRepository(db);
const defaultRouter = createEntitiesRouter(defaultRepository);

export default defaultRouter;
