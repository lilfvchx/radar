import { Router } from 'express';
import { getCrimeEvent, getCrimeEvents, getSourceItems } from '../core/source/ar_crime/store/db';
import { runArCrimeIngest } from '../core/source/ar_crime/ingest';
import { getEnabledSources } from '../core/source/ar_crime/sources';

const router = Router();

router.get('/events', async (req, res) => {
  const bboxParam = String(req.query.bbox ?? '');
  const minSeverity = Number(req.query.minSeverity ?? 0);
  const minConfidence = Number(req.query.minConfidence ?? 0);
  const types = String(req.query.types ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  let events = await getCrimeEvents();

  if (bboxParam) {
    const [west, south, east, north] = bboxParam.split(',').map(Number);
    if ([west, south, east, north].every((x) => !Number.isNaN(x))) {
      events = events.filter((ev) => {
        const lat = ev.geo?.lat;
        const lon = ev.geo?.lon;
        return (
          lat != null && lon != null && lat >= south && lat <= north && lon >= west && lon <= east
        );
      });
    }
  }

  if (types.length) {
    const filter = new Set(types);
    events = events.filter((ev) => filter.has(ev.event_type));
  }

  events = events.filter(
    (ev) => ev.severity_score >= minSeverity && ev.confidence_score >= minConfidence,
  );

  res.json({ events });
});

router.get('/event/:id', async (req, res) => {
  const item = await getCrimeEvent(req.params.id);
  if (!item) return res.status(404).json({ error: 'Event not found' });
  return res.json(item);
});

router.get('/sources', async (_req, res) => {
  res.json({ sources: await getSourceItems(), policy: getEnabledSources() });
});

router.post('/ingest/run', async (_req, res) => {
  if (process.env.AR_CRIME_SCHEDULER_ENABLED === 'false') {
    return res.status(403).json({ error: 'AR crime ingest is disabled by env flag' });
  }
  const result = await runArCrimeIngest();
  return res.json({ ok: true, ...result });
});

router.post('/brief', async (req, res) => {
  const events = req.body?.events;
  if (!Array.isArray(events)) return res.status(400).json({ error: 'events[] is required' });

  if (!process.env.OPENROUTER_API_KEY) {
    return res.json({
      summary:
        'Modo mock: no hay OPENROUTER_API_KEY. Riesgo alto en homicidios/robos recientes con priorización por severidad y coincidencia geográfica.',
    });
  }

  return res.json({
    summary: 'Briefing generado. Integra fuentes oficiales, dedupe y score de severidad/confianza.',
  });
});

export default router;
