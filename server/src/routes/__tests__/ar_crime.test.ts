import request from 'supertest';
import express from 'express';
import arCrimeRouter from '../ar_crime';

// Mock DB
jest.mock('../../core/source/ar_crime/store/db', () => ({
  getCrimeEvents: jest.fn().mockResolvedValue([
    {
      event_id: '1',
      event_type: 'homicide',
      severity_score: 90,
      confidence_score: 80,
      geo: { lat: -34.6, lon: -58.4 },
      dedupe_key: 'dk1',
    },
    {
      event_id: '2',
      event_type: 'robbery',
      severity_score: 50,
      confidence_score: 60,
      geo: { lat: -34.7, lon: -58.5 },
      dedupe_key: 'dk2',
    },
  ]),
  getCrimeEvent: jest.fn().mockResolvedValue({
    event_id: '1',
    event_type: 'homicide',
  }),
  getSourceItems: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../core/source/ar_crime/ingest', () => ({
  runArCrimeIngest: jest.fn().mockResolvedValue({ sourceCount: 10, eventCount: 5, runId: 'run_1' }),
}));

const app = express();
app.use(express.json());
app.use('/api/ar-crime', arCrimeRouter);

describe('AR Crime API', () => {
  it('GET /events returns filtered events', async () => {
    const res = await request(app).get('/api/ar-crime/events?types=homicide&minSeverity=80');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].event_id).toBe('1');
  });

  it('GET /event/:id returns single event', async () => {
    const res = await request(app).get('/api/ar-crime/event/1');
    expect(res.status).toBe(200);
    expect(res.body.event_type).toBe('homicide');
  });

  it('POST /ingest/run executes ingest', async () => {
    process.env.AR_CRIME_SCHEDULER_ENABLED = 'true';
    const res = await request(app).post('/api/ar-crime/ingest/run');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.eventCount).toBe(5);
  });
});
