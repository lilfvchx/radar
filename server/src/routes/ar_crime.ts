import { Router, Request, Response } from 'express';
import { getCrimeEvents, getSourceItemsByIds } from '../core/source/ar_crime/store/db';
import { runIngestionPipeline } from '../core/source/ar_crime/pipeline';

const router = Router();

/**
 * GET /api/ar-crime/events
 * Fetch crime events with optional filters.
 */
router.get('/events', (req: Request, res: Response) => {
  try {
    const { bbox, from, to, types, minSeverity, minConfidence } = req.query;

    let parsedBbox: [number, number, number, number] | undefined;
    if (typeof bbox === 'string') {
      const parts = bbox.split(',').map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        parsedBbox = parts as [number, number, number, number];
      }
    }

    const filters = {
      bbox: parsedBbox,
      from: typeof from === 'string' ? from : undefined,
      to: typeof to === 'string' ? to : undefined,
      types: typeof types === 'string' ? types.split(',') : undefined,
      minSeverity: typeof minSeverity === 'string' ? Number(minSeverity) : undefined,
      minConfidence: typeof minConfidence === 'string' ? Number(minConfidence) : undefined,
    };

    const events = getCrimeEvents(filters);

    // Enrich with source snippets
    const enrichedEvents = events.map((event) => {
      const sources = getSourceItemsByIds(event.source_ids).map(src => ({
        sourceName: src.source_name,
        title: src.title,
        url: src.source_url,
        publishedAt: src.published_at,
      }));

      return {
        ...event,
        sources,
      };
    });

    res.json({ events: enrichedEvents });
  } catch (error: any) {
    console.error('[ArCrime API] Failed to fetch events:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/ar-crime/ingest/run
 * Manually trigger the ingestion pipeline.
 */
router.post('/ingest/run', (req: Request, res: Response) => {
  // Fire and forget
  runIngestionPipeline().catch((err) => console.error(err));
  res.json({ status: 'started' });
});

export default router;
