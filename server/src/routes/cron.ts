import { Router } from 'express';
import { runArCrimeIngest } from '../core/source/ar_crime/ingest';

const router = Router();

router.get('/ingest', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await runArCrimeIngest();
    res.json({ ok: true, result });
  } catch (err: any) {
    console.error('Cron ingest error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
